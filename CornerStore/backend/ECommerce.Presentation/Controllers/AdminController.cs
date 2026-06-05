using ECommerce.Services;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Abstraction.AI;
using ECommerce.Shared.DTOs.AdminDTOs;
using ECommerce.Shared.DTOs.AIDTOs;
using ECommerce.Shared.DTOs.OrderDTOs;
using ECommerce.Shared.DTOs.ProductDTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.Presentation.Controllers
{
    [Authorize(Roles = "Admin,SuperAdmin")]
    public class AdminController : ApiBaseController
    {
        private readonly IAdminService _adminService;
        private readonly IAdminAiService _adminAiService;
        private readonly IProductService _productService;
        private readonly ProductImageStorage _productImageStorage;
        private readonly IAuditLogService _auditLog;

        public AdminController(
            IAdminService adminService,
            IAdminAiService adminAiService,
            IProductService productService,
            ProductImageStorage productImageStorage,
            IAuditLogService auditLog
        )
        {
            _adminService = adminService;
            _adminAiService = adminAiService;
            _productService = productService;
            _productImageStorage = productImageStorage;
            _auditLog = auditLog;
        }

        [HttpGet("stats")]
        public async Task<ActionResult<AdminStatsDTO>> GetStats()
        {
            var result = await _adminService.GetDashboardStatsAsync();
            return HandleResult(result);
        }

        [HttpGet("analytics")]
        public async Task<ActionResult<AdminAnalyticsDTO>> GetAnalytics()
        {
            var result = await _adminService.GetAnalyticsAsync();
            return HandleResult(result);
        }

        [HttpGet("reports")]
        public async Task<ActionResult<AdminReportsDTO>> GetReports()
        {
            var result = await _adminService.GetReportsAsync();
            return HandleResult(result);
        }

        [HttpGet("users")]
        public async Task<ActionResult<AdminPagedResult<AdminUserDTO>>> GetUsers(
            [FromQuery] AdminListQueryParams queryParams
        )
        {
            var result = await _adminService.GetUsersPagedAsync(queryParams);
            return HandleResult(result);
        }

        [HttpGet("users/{id}")]
        public async Task<ActionResult<AdminUserDTO>> GetUser(string id)
        {
            var result = await _adminService.GetUserByIdAsync(id);
            return HandleResult(result);
        }

        [HttpPost("users")]
        public async Task<ActionResult<AdminUserDTO>> CreateUser([FromBody] CreateAdminUserDTO dto)
        {
            var result = await _adminService.CreateUserAsync(dto);
            if (result.IsSuccess)
                await LogAudit("Create", "User", result.Value.Id, result.Value.Email);
            return HandleResult(result);
        }

        [HttpPut("users/{id}")]
        public async Task<ActionResult<AdminUserDTO>> UpdateUser(
            string id,
            [FromBody] UpdateAdminUserDTO dto
        )
        {
            var result = await _adminService.UpdateUserAsync(id, dto);
            if (result.IsSuccess)
                await LogAudit("Update", "User", id, dto.DisplayName);
            return HandleResult(result);
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var requesterId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var result = await _adminService.DeleteUserAsync(id, requesterId);
            if (result.IsSuccess)
                await LogAudit("Delete", "User", id);
            return HandleResult(result);
        }

        [HttpGet("products")]
        public async Task<ActionResult<AdminPagedResult<ProductDTO>>> GetProducts(
            [FromQuery] AdminListQueryParams queryParams
        )
        {
            var products = await _productService.GetProductsForAdminPagedAsync(queryParams);
            return Ok(products);
        }

        [HttpPost("products")]
        public async Task<ActionResult<ProductDTO>> CreateProduct([FromBody] CreateProductDTO dto)
        {
            var result = await _productService.CreateProductAsync(dto);
            if (result.IsSuccess)
                await LogAudit("Create", "Product", result.Value.Id.ToString(), result.Value.Name);
            return HandleResult(result);
        }

        [HttpPut("products/{id:int}")]
        public async Task<ActionResult<ProductDTO>> UpdateProduct(
            int id,
            [FromBody] UpdateProductDTO dto
        )
        {
            var existing = await _productService.GetProductByIdAsync(id);
            var result = await _productService.UpdateProductAsync(id, dto);
            if (result.IsSuccess && existing.IsSuccess)
            {
                var oldUrl = existing.Value.PictureUrl;
                var newUrl = result.Value.PictureUrl;
                if (!string.Equals(oldUrl, newUrl, StringComparison.OrdinalIgnoreCase))
                    _productImageStorage.DeleteLocalIfExists(oldUrl);
                await LogAudit("Update", "Product", id.ToString(), dto.Name);
            }

            return HandleResult(result);
        }

        [HttpDelete("products/{id:int}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var existing = await _productService.GetProductByIdAsync(id);
            var result = await _productService.DeleteProductAsync(id);
            if (result.IsSuccess && existing.IsSuccess)
            {
                _productImageStorage.DeleteLocalIfExists(existing.Value.PictureUrl);
                await LogAudit("Delete", "Product", id.ToString(), existing.Value.Name);
            }

            return HandleResult(result);
        }

        [HttpPost("products/upload-image")]
        [RequestSizeLimit(5 * 1024 * 1024)]
        public async Task<ActionResult<ProductImageUploadResultDTO>> UploadProductImage(
            IFormFile file
        )
        {
            var result = await _productImageStorage.SaveAsync(file);
            if (!result.IsSuccess)
                return HandleProblem(result.Errors);

            return Ok(new ProductImageUploadResultDTO(result.Value));
        }

        [HttpGet("orders")]
        public async Task<ActionResult<AdminPagedResult<OrderToReturnDTO>>> GetOrders(
            [FromQuery] AdminOrderQueryParams queryParams
        )
        {
            var result = await _adminService.GetOrdersPagedAsync(queryParams);
            return HandleResult(result);
        }

        [HttpGet("orders/{id:guid}")]
        public async Task<ActionResult<OrderToReturnDTO>> GetOrder(Guid id)
        {
            var result = await _adminService.GetOrderByIdAsync(id);
            return HandleResult(result);
        }

        [HttpGet("reviews")]
        public async Task<ActionResult<AdminPagedResult<AdminReviewDTO>>> GetReviews(
            [FromQuery] AdminListQueryParams queryParams
        )
        {
            var result = await _adminService.GetReviewsPagedAsync(queryParams);
            return HandleResult(result);
        }

        [HttpDelete("reviews/{id:int}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var result = await _adminService.DeleteReviewAsync(id);
            if (result.IsSuccess)
                await LogAudit("Delete", "Review", id.ToString());
            return HandleResult(result);
        }

        [HttpGet("audit-logs")]
        public async Task<ActionResult<AuditLogsPageDTO>> GetAuditLogs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            CancellationToken ct = default
        )
        {
            var result = await _adminService.GetAuditLogsAsync(page, pageSize, search, ct);
            return HandleResult(result);
        }

        [HttpGet("ai/overview")]
        public async Task<ActionResult<AdminAiOverviewDTO>> GetAiOverview(CancellationToken ct)
        {
            return HandleResult(await _adminAiService.GetOverviewAsync(ct));
        }

        [HttpGet("ai/analytics")]
        public async Task<ActionResult<AdminAiAnalyticsDTO>> GetAiAnalytics(CancellationToken ct)
        {
            return HandleResult(await _adminAiService.GetAnalyticsAsync(ct));
        }

        [HttpGet("ai/logs")]
        public async Task<ActionResult<AdminAiLogsPageDTO>> GetAiLogs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            CancellationToken ct = default
        )
        {
            return HandleResult(await _adminAiService.GetLogsAsync(page, pageSize, search, ct));
        }

        [HttpGet("ai/logs/{id:long}")]
        public async Task<ActionResult<AssistantInteractionLogDetailDTO>> GetAiLogById(long id, CancellationToken ct)
        {
            return HandleResult(await _adminAiService.GetLogByIdAsync(id, ct));
        }

        [HttpGet("ai/knowledge/stats")]
        public async Task<ActionResult<KnowledgeStatsDTO>> GetKnowledgeStats(CancellationToken ct)
        {
            return HandleResult(await _adminAiService.GetKnowledgeStatsAsync(ct));
        }

        [HttpGet("ai/config")]
        public async Task<ActionResult<AiConfigDTO>> GetAiConfig(CancellationToken ct)
        {
            return HandleResult(await _adminAiService.GetAiConfigAsync(ct));
        }

        [HttpGet("ai/cost")]
        public async Task<ActionResult<AiCostSummaryDTO>> GetAiCost(CancellationToken ct)
        {
            return HandleResult(await _adminAiService.GetAiCostSummaryAsync(ct));
        }

        [HttpGet("ai/recommendations")]
        public async Task<ActionResult<RecommendationAnalyticsDTO>> GetRecommendationAnalytics(CancellationToken ct)
        {
            return HandleResult(await _adminAiService.GetRecommendationAnalyticsAsync(ct));
        }

        [HttpGet("ai/visual-search")]
        public async Task<ActionResult<VisualSearchAnalyticsDTO>> GetVisualSearchAnalytics(CancellationToken ct)
        {
            return HandleResult(await _adminAiService.GetVisualSearchAnalyticsAsync(ct));
        }

        [HttpGet("system/health")]
        public async Task<ActionResult<SystemHealthDTO>> GetSystemHealth(CancellationToken ct)
        {
            return HandleResult(await _adminAiService.GetSystemHealthAsync(ct));
        }

        private async Task LogAudit(string action, string entityType, string? entityId, string? details = null)
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "admin";
            await _auditLog.WriteAsync(email, action, entityType, entityId, details);
        }

        private ActionResult HandleProblem(IReadOnlyList<ECommerce.Shared.CommonResponses.Error> errors)
        {
            if (errors.Count == 0)
                return Problem(statusCode: StatusCodes.Status500InternalServerError, title: "An Error Occurred");

            var error = errors[0];
            return Problem(
                title: error.Code,
                detail: error.Description,
                statusCode: error.ErrorType switch
                {
                    ECommerce.Shared.CommonResponses.ErrorType.NotFound => StatusCodes.Status404NotFound,
                    ECommerce.Shared.CommonResponses.ErrorType.Validation => StatusCodes.Status400BadRequest,
                    _ => StatusCodes.Status500InternalServerError,
                }
            );
        }
    }
}

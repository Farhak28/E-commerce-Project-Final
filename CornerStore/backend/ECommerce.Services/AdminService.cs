using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities.IdentityModule;
using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Domain.Entities.ProductModule;
using ECommerce.Persistence.Data.DbContexts;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Specifications.OrderSpecifications;
using ECommerce.Services.Specifications.ProductSpecifications;
using ECommerce.Shared;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.AdminDTOs;
using ECommerce.Shared.DTOs.OrderDTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Services
{
    public class AdminService : IAdminService
    {
        private const int LowStockThreshold = 10;

        private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "Admin",
            "SuperAdmin",
        };

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IOrderService _orderService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly StoreDbContext _db;
        private readonly IAuditLogService _auditLog;

        public AdminService(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IOrderService orderService,
            IUnitOfWork unitOfWork,
            StoreDbContext db,
            IAuditLogService auditLog
        )
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _orderService = orderService;
            _unitOfWork = unitOfWork;
            _db = db;
            _auditLog = auditLog;
        }

        public async Task<Result<AdminStatsDTO>> GetDashboardStatsAsync()
        {
            var orders = (
                await _unitOfWork.GetRepository<Order, Guid>().GetAllAsync(new OrderSpecification())
            ).ToList();
            var productsCount = await _unitOfWork
                .GetRepository<Product, int>()
                .CountAsync(new ProductWithCountSpecifications(new ProductQueryParams()));
            var usersCount = _userManager.Users.Count();
            var ordersCount = orders.Count;
            var revenue = orders.Sum(o => o.GetTotal());
            var pendingOrders = orders.Count(o =>
                o.Status.ToString().Contains("Pending", StringComparison.OrdinalIgnoreCase)
                || o.Status.ToString().Contains("Submitted", StringComparison.OrdinalIgnoreCase)
            );
            var lowStock = await _db.Products.CountAsync(p => p.StockQuantity <= LowStockThreshold);
            var activeShipments = orders.Count(o =>
                o.FulfillmentStage
                    is not FulfillmentStage.Delivered
                        and not FulfillmentStage.Cancelled
                        and not FulfillmentStage.Returned
                && o.Status
                    is not OrderStatus.Cancelled
                        and not OrderStatus.PaymentFailed
                        and not OrderStatus.Returned
            );
            var deliveredOrders = orders.Count(o => o.FulfillmentStage == FulfillmentStage.Delivered);
            var scheduledDeliveries = orders.Count(o => o.ScheduledDeliveryAt.HasValue);
            var coupons = await _db.Set<UserCoupon>().AsNoTracking().ToListAsync();
            var now = DateTimeOffset.UtcNow;
            var activeCoupons = coupons.Count(c => !c.IsUsed && c.ExpiresAt > now);
            var redeemedCoupons = coupons.Count(c => c.IsUsed);
            var totalDiscounts = orders.Sum(o => o.DiscountAmount);
            var reviewsCount = await _db.Reviews.CountAsync();
            var brandsWithUrl = await _db.ProductBrands.CountAsync(b =>
                b.OfficialWebsiteUrl != null && b.OfficialWebsiteUrl != ""
            );

            return Result<AdminStatsDTO>.Ok(
                new AdminStatsDTO(
                    usersCount,
                    ordersCount,
                    revenue,
                    productsCount,
                    pendingOrders,
                    lowStock,
                    activeShipments,
                    deliveredOrders,
                    scheduledDeliveries,
                    activeCoupons,
                    redeemedCoupons,
                    totalDiscounts,
                    reviewsCount,
                    brandsWithUrl
                )
            );
        }

        public async Task<Result<AdminAnalyticsDTO>> GetAnalyticsAsync()
        {
            var orderSpec = new OrderSpecification();
            var orders = (await _unitOfWork.GetRepository<Order, Guid>().GetAllAsync(orderSpec)).ToList();
            var now = DateTimeOffset.UtcNow;

            var revenueByMonth = Enumerable
                .Range(0, 6)
                .Select(i =>
                {
                    var month = now.AddMonths(-i);
                    var label = month.ToString("MMM yyyy");
                    var amount = orders
                        .Where(o => o.OrderDate.Year == month.Year && o.OrderDate.Month == month.Month)
                        .Sum(o => o.GetTotal());
                    return new RevenueByMonthDTO(label, amount);
                })
                .Reverse()
                .ToList();

            var ordersByStatus = orders
                .GroupBy(o => o.Status.ToString())
                .Select(g => new OrdersByStatusDTO(g.Key, g.Count()))
                .OrderByDescending(x => x.Count)
                .ToList();

            var fulfillmentByStage = orders
                .GroupBy(o => o.FulfillmentStage.ToString())
                .Select(g => new FulfillmentByStageDTO(g.Key, g.Count()))
                .OrderByDescending(x => x.Count)
                .ToList();

            var assistantEstimate = await _db.AssistantInteractionLogs.CountAsync();
            var scheduledDeliveries = orders.Count(o => o.ScheduledDeliveryAt.HasValue);
            var totalDeliveryRevenue = orders.Sum(o =>
                o.DeliveryPrice > 0 ? o.DeliveryPrice : o.DeliveryMethod?.Price ?? 0
            );
            var totalDiscounts = orders.Sum(o => o.DiscountAmount);
            var visualSearchEvents = await _db.VisualSearchEvents.CountAsync();

            return Result<AdminAnalyticsDTO>.Ok(
                new AdminAnalyticsDTO(
                    revenueByMonth,
                    ordersByStatus,
                    fulfillmentByStage,
                    assistantEstimate,
                    scheduledDeliveries,
                    totalDeliveryRevenue,
                    totalDiscounts,
                    visualSearchEvents
                )
            );
        }

        public async Task<Result<AdminCouponsSummaryDTO>> GetCouponsSummaryAsync()
        {
            var coupons = await _db.Set<UserCoupon>().AsNoTracking().ToListAsync();
            var now = DateTimeOffset.UtcNow;
            var orders = (
                await _unitOfWork.GetRepository<Order, Guid>().GetAllAsync(new OrderSpecification())
            ).ToList();

            var byReward = coupons
                .GroupBy(c => c.RewardKey)
                .Select(g => new AdminCouponTierDTO(
                    g.Key,
                    g.Count(c => !c.IsUsed && c.ExpiresAt > now),
                    g.Count(c => c.IsUsed)
                ))
                .OrderByDescending(x => x.Active + x.Redeemed)
                .ToList();

            return Result<AdminCouponsSummaryDTO>.Ok(
                new AdminCouponsSummaryDTO(
                    coupons.Count(c => !c.IsUsed && c.ExpiresAt > now),
                    coupons.Count(c => c.IsUsed),
                    coupons.Count(c => !c.IsUsed && c.ExpiresAt <= now),
                    orders.Sum(o => o.DiscountAmount),
                    byReward
                )
            );
        }

        public async Task<Result<AdminReportsDTO>> GetReportsAsync()
        {
            var analytics = await GetAnalyticsAsync();
            if (!analytics.IsSuccess)
                return Result<AdminReportsDTO>.Fail(analytics.Errors.ToList());

            var lowStock = await _db.Products.CountAsync(p => p.StockQuantity <= LowStockThreshold);
            var reviews = await _db.Reviews.AsNoTracking().ToListAsync();
            var avgRating = reviews.Count > 0 ? reviews.Average(r => r.Rating) : 0;

            return Result<AdminReportsDTO>.Ok(
                new AdminReportsDTO(
                    analytics.Value.RevenueByMonth,
                    analytics.Value.OrdersByStatus,
                    lowStock,
                    reviews.Count,
                    avgRating
                )
            );
        }

        public async Task<Result<AdminPagedResult<OrderToReturnDTO>>> GetOrdersPagedAsync(
            AdminOrderQueryParams queryParams
        )
        {
            var spec = new OrderSpecification();
            var orders = await _unitOfWork.GetRepository<Order, Guid>().GetAllAsync(spec);
            var filtered = orders.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(queryParams.UserEmail))
            {
                filtered = filtered.Where(o =>
                    o.UserEmail.Contains(queryParams.UserEmail, StringComparison.OrdinalIgnoreCase)
                );
            }

            if (!string.IsNullOrWhiteSpace(queryParams.Status))
            {
                filtered = filtered.Where(o =>
                    o.Status.ToString().Equals(queryParams.Status, StringComparison.OrdinalIgnoreCase)
                );
            }

            if (!string.IsNullOrWhiteSpace(queryParams.Search))
            {
                var term = queryParams.Search.Trim();
                filtered = filtered.Where(o =>
                    o.UserEmail.Contains(term, StringComparison.OrdinalIgnoreCase)
                    || o.Id.ToString().Contains(term, StringComparison.OrdinalIgnoreCase)
                );
            }

            var list = filtered.OrderByDescending(o => o.OrderDate).ToList();
            var page = Math.Max(1, queryParams.Page);
            var pageSize = Math.Clamp(queryParams.PageSize, 1, 100);
            var slice = list.Skip((page - 1) * pageSize).Take(pageSize);

            var mappedResults = new List<OrderToReturnDTO>();
            foreach (var order in slice)
            {
                var orderResult = await _orderService.GetOrderByIdAsync(order.Id, order.UserEmail);
                if (orderResult.IsSuccess)
                    mappedResults.Add(orderResult.Value);
            }

            return Result<AdminPagedResult<OrderToReturnDTO>>.Ok(
                new AdminPagedResult<OrderToReturnDTO>(mappedResults, list.Count, page, pageSize)
            );
        }

        public async Task<Result<OrderToReturnDTO>> GetOrderByIdAsync(Guid id)
        {
            var spec = new OrderSpecification();
            var order = (await _unitOfWork.GetRepository<Order, Guid>().GetAllAsync(spec)).FirstOrDefault(o =>
                o.Id == id
            );

            if (order is null)
                return Error.NotFound("Order.NotFound", $"No order found with Id:{id}");

            return await _orderService.GetOrderByIdAsync(order.Id, order.UserEmail);
        }

        public async Task<Result<AdminPagedResult<AdminUserDTO>>> GetUsersPagedAsync(AdminListQueryParams queryParams)
        {
            var users = _userManager.Users.ToList();
            var orders = await _unitOfWork.GetRepository<Order, Guid>().GetAllAsync();

            if (!string.IsNullOrWhiteSpace(queryParams.Search))
            {
                var term = queryParams.Search.Trim();
                users = users
                    .Where(u =>
                        (u.Email != null && u.Email.Contains(term, StringComparison.OrdinalIgnoreCase))
                        || (u.DisplayName != null && u.DisplayName.Contains(term, StringComparison.OrdinalIgnoreCase))
                        || (u.PhoneNumber != null && u.PhoneNumber.Contains(term, StringComparison.OrdinalIgnoreCase))
                    )
                    .ToList();
            }

            var page = Math.Max(1, queryParams.Page);
            var pageSize = Math.Clamp(queryParams.PageSize, 1, 100);
            var slice = users.Skip((page - 1) * pageSize).Take(pageSize).ToList();
            var usersDto = new List<AdminUserDTO>(slice.Count);

            foreach (var user in slice)
            {
                var roles = await _userManager.GetRolesAsync(user);
                var ordersCount = orders.Count(o =>
                    string.Equals(o.UserEmail, user.Email, StringComparison.OrdinalIgnoreCase)
                );

                usersDto.Add(
                    new AdminUserDTO(
                        user.Id,
                        user.Email ?? string.Empty,
                        user.DisplayName,
                        user.PhoneNumber,
                        roles.ToList(),
                        ordersCount
                    )
                );
            }

            return Result<AdminPagedResult<AdminUserDTO>>.Ok(
                new AdminPagedResult<AdminUserDTO>(usersDto, users.Count, page, pageSize)
            );
        }

        public async Task<Result<AdminUserDTO>> GetUserByIdAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user is null)
                return Error.NotFound("User.NotFound", $"User with Id:{id} was not found.");

            return await MapUserAsync(user);
        }

        public async Task<Result<AdminUserDTO>> CreateUserAsync(CreateAdminUserDTO dto)
        {
            var email = dto.Email.Trim();
            if (await _userManager.FindByEmailAsync(email) is not null)
                return Error.Validation("User.EmailExists", "A user with this email already exists.");

            var roleError = await ValidateRolesAsync(dto.Roles);
            if (roleError is not null)
                return roleError;

            var userName = string.IsNullOrWhiteSpace(dto.UserName)
                ? BuildUserNameFromEmail(email)
                : dto.UserName.Trim();

            var user = new ApplicationUser
            {
                Email = email,
                UserName = userName,
                DisplayName = dto.DisplayName.Trim(),
                PhoneNumber = dto.PhoneNumber,
            };

            var createResult = await _userManager.CreateAsync(user, dto.Password);
            if (!createResult.Succeeded)
            {
                return createResult
                    .Errors.Select(e => Error.Validation(e.Code, e.Description))
                    .ToList();
            }

            await AssignRolesAsync(user, dto.Roles);
            return await MapUserAsync(user);
        }

        public async Task<Result<AdminUserDTO>> UpdateUserAsync(string id, UpdateAdminUserDTO dto)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user is null)
                return Error.NotFound("User.NotFound", $"User with Id:{id} was not found.");

            var roleError = await ValidateRolesAsync(dto.Roles);
            if (roleError is not null)
                return roleError;

            user.DisplayName = dto.DisplayName.Trim();
            user.PhoneNumber = dto.PhoneNumber;

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                return updateResult
                    .Errors.Select(e => Error.Validation(e.Code, e.Description))
                    .ToList();
            }

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var passwordResult = await _userManager.ResetPasswordAsync(user, token, dto.Password);
                if (!passwordResult.Succeeded)
                {
                    return passwordResult
                        .Errors.Select(e => Error.Validation(e.Code, e.Description))
                        .ToList();
                }
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await AssignRolesAsync(user, dto.Roles);

            return await MapUserAsync(user);
        }

        public async Task<Result> DeleteUserAsync(string id, string? requesterId)
        {
            if (!string.IsNullOrWhiteSpace(requesterId)
                && string.Equals(id, requesterId, StringComparison.Ordinal))
                return Result.Fail(Error.Validation("User.SelfDelete", "You cannot delete your own account."));

            var user = await _userManager.FindByIdAsync(id);
            if (user is null)
                return Result.Fail(Error.NotFound("User.NotFound", $"User with Id:{id} was not found."));

            var orders = await _unitOfWork.GetRepository<Order, Guid>().GetAllAsync();
            var hasOrders = orders.Any(o =>
                string.Equals(o.UserEmail, user.Email, StringComparison.OrdinalIgnoreCase)
            );
            if (hasOrders)
                return Result.Fail(Error.Validation(
                    "User.HasOrders",
                    "Cannot delete a user who has placed orders."
                ));

            var deleteResult = await _userManager.DeleteAsync(user);
            if (!deleteResult.Succeeded)
            {
                return Result.Fail(deleteResult
                    .Errors.Select(e => Error.Validation(e.Code, e.Description))
                    .ToList());
            }

            return Result.Ok();
        }

        public async Task<Result<AdminPagedResult<AdminReviewDTO>>> GetReviewsPagedAsync(AdminListQueryParams queryParams)
        {
            var query = _db.Reviews.AsNoTracking()
                .Include(r => r.Product)
                .OrderByDescending(r => r.CreatedAt);

            if (!string.IsNullOrWhiteSpace(queryParams.Search))
            {
                var term = queryParams.Search.Trim();
                query = query.Where(r =>
                    r.UserName.Contains(term)
                    || r.Comment.Contains(term)
                    || r.Product.Name.Contains(term)
                ).OrderByDescending(r => r.CreatedAt);
            }

            var total = await query.CountAsync();
            var page = Math.Max(1, queryParams.Page);
            var pageSize = Math.Clamp(queryParams.PageSize, 1, 100);

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new AdminReviewDTO(
                    r.Id,
                    r.ProductId,
                    r.Product.Name,
                    r.UserName,
                    r.Rating,
                    r.Comment,
                    r.CreatedAt
                ))
                .ToListAsync();

            return Result<AdminPagedResult<AdminReviewDTO>>.Ok(
                new AdminPagedResult<AdminReviewDTO>(items, total, page, pageSize)
            );
        }

        public async Task<Result> DeleteReviewAsync(int id)
        {
            var review = await _db.Reviews.FindAsync(id);
            if (review is null)
                return Result.Fail(Error.NotFound("Review.NotFound", "Review not found."));

            _db.Reviews.Remove(review);
            await _db.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result<AuditLogsPageDTO>> GetAuditLogsAsync(
            int page,
            int pageSize,
            string? search,
            CancellationToken ct = default
        )
        {
            var logs = await _auditLog.GetPagedAsync(page, pageSize, search, ct);
            return Result<AuditLogsPageDTO>.Ok(logs);
        }

        private async Task<Result<AdminUserDTO>> MapUserAsync(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var orders = await _unitOfWork.GetRepository<Order, Guid>().GetAllAsync();
            var ordersCount = orders.Count(o =>
                string.Equals(o.UserEmail, user.Email, StringComparison.OrdinalIgnoreCase)
            );

            return new AdminUserDTO(
                user.Id,
                user.Email ?? string.Empty,
                user.DisplayName,
                user.PhoneNumber,
                roles.ToList(),
                ordersCount
            );
        }

        private async Task AssignRolesAsync(ApplicationUser user, IEnumerable<string> roles)
        {
            foreach (var role in roles.Where(r => !string.IsNullOrWhiteSpace(r)).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                if (AllowedRoles.Contains(role))
                    await _userManager.AddToRoleAsync(user, role);
            }
        }

        private async Task<Error?> ValidateRolesAsync(IEnumerable<string> roles)
        {
            foreach (var role in roles.Where(r => !string.IsNullOrWhiteSpace(r)))
            {
                if (!AllowedRoles.Contains(role))
                {
                    return Error.Validation(
                        "User.InvalidRole",
                        $"Role '{role}' is not allowed. Use Admin or SuperAdmin, or leave empty for customers."
                    );
                }

                if (!await _roleManager.RoleExistsAsync(role))
                    return Error.NotFound("Role.NotFound", $"Role '{role}' does not exist.");
            }

            return null;
        }

        private static string BuildUserNameFromEmail(string email)
        {
            var normalized = email.Trim().ToLowerInvariant();
            var atIndex = normalized.IndexOf('@');
            return atIndex > 0 ? normalized[..atIndex] : normalized;
        }
    }
}

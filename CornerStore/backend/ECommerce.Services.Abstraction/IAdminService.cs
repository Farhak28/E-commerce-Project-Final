using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.AdminDTOs;
using ECommerce.Shared.DTOs.OrderDTOs;

namespace ECommerce.Services.Abstraction;

public interface IAdminService
{
    Task<Result<AdminStatsDTO>> GetDashboardStatsAsync();
    Task<Result<AdminAnalyticsDTO>> GetAnalyticsAsync();
    Task<Result<AdminReportsDTO>> GetReportsAsync();
    Task<Result<AdminPagedResult<OrderToReturnDTO>>> GetOrdersPagedAsync(AdminOrderQueryParams queryParams);
    Task<Result<OrderToReturnDTO>> GetOrderByIdAsync(Guid id);
    Task<Result<AdminPagedResult<AdminUserDTO>>> GetUsersPagedAsync(AdminListQueryParams queryParams);
    Task<Result<AdminUserDTO>> GetUserByIdAsync(string id);
    Task<Result<AdminUserDTO>> CreateUserAsync(CreateAdminUserDTO dto);
    Task<Result<AdminUserDTO>> UpdateUserAsync(string id, UpdateAdminUserDTO dto);
    Task<Result> DeleteUserAsync(string id, string? requesterId);
    Task<Result<AdminPagedResult<AdminReviewDTO>>> GetReviewsPagedAsync(AdminListQueryParams queryParams);
    Task<Result> DeleteReviewAsync(int id);
    Task<Result<AuditLogsPageDTO>> GetAuditLogsAsync(int page, int pageSize, string? search, CancellationToken ct = default);
}

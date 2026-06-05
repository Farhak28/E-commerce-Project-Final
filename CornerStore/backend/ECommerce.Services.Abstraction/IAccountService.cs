using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.AccountDTOs;

namespace ECommerce.Services.Abstraction;

public interface IAccountService
{
    Task<Result<AccountDashboardDTO>> GetDashboardAsync(string email);
}

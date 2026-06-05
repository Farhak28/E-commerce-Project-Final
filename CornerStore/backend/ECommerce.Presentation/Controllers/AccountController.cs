using ECommerce.Services.Abstraction;
using ECommerce.Shared.DTOs.AccountDTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.Presentation.Controllers;

[Authorize]
public class AccountController : ApiBaseController
{
    private readonly IAccountService _accountService;

    public AccountController(IAccountService accountService)
    {
        _accountService = accountService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<AccountDashboardDTO>> GetDashboard()
    {
        var result = await _accountService.GetDashboardAsync(GetEmailFromToken());
        return HandleResult(result);
    }
}

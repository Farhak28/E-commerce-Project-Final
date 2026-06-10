using ECommerce.Services.Abstraction;
using ECommerce.Shared.DTOs.AccountDTOs;
using ECommerce.Shared.DTOs.BasketDTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.Presentation.Controllers;

[Authorize]
public class AccountController : ApiBaseController
{
    private readonly IAccountService _accountService;
    private readonly ICouponService _couponService;

    public AccountController(IAccountService accountService, ICouponService couponService)
    {
        _accountService = accountService;
        _couponService = couponService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<AccountDashboardDTO>> GetDashboard()
    {
        var result = await _accountService.GetDashboardAsync(GetEmailFromToken());
        return HandleResult(result);
    }

    [HttpGet("coupons")]
    public async Task<ActionResult<IReadOnlyList<UserCouponDTO>>> GetCoupons()
    {
        var coupons = await _couponService.SyncAndGetCouponsAsync(GetEmailFromToken());
        return Ok(coupons);
    }

    [HttpPost("coupons/apply")]
    public async Task<ActionResult<BasketDTO>> ApplyCoupon(ApplyCouponDTO dto)
    {
        var result = await _couponService.ApplyToBasketAsync(GetEmailFromToken(), dto);
        return HandleResult(result);
    }

    [HttpDelete("coupons/basket/{basketId}")]
    public async Task<ActionResult<BasketDTO>> RemoveCoupon(string basketId)
    {
        var result = await _couponService.RemoveFromBasketAsync(GetEmailFromToken(), basketId);
        return HandleResult(result);
    }
}

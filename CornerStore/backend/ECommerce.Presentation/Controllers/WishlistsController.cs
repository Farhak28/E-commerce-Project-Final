using ECommerce.Services.Abstraction;
using ECommerce.Shared.DTOs.WishlistDTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.Presentation.Controllers
{
    [Authorize]
    public class WishlistsController : ApiBaseController
    {
        private readonly IWishlistService _wishlistService;

        public WishlistsController(IWishlistService wishlistService)
        {
            _wishlistService = wishlistService;
        }

        [HttpGet]
        public async Task<ActionResult<WishlistDTO>> GetWishlist()
        {
            var email = GetEmailFromToken();
            var result = await _wishlistService.GetWishlistAsync(email);
            return Ok(result);
        }

        [HttpPost("{productId:int}")]
        public async Task<ActionResult<WishlistDTO>> AddToWishlist(int productId)
        {
            var email = GetEmailFromToken();
            var result = await _wishlistService.AddItemAsync(email, productId);
            return Ok(result);
        }

        [HttpDelete("{productId:int}")]
        public async Task<ActionResult<WishlistDTO>> RemoveFromWishlist(int productId)
        {
            var email = GetEmailFromToken();
            var result = await _wishlistService.RemoveItemAsync(email, productId);
            return Ok(result);
        }

        [HttpDelete]
        public async Task<ActionResult> ClearWishlist()
        {
            var email = GetEmailFromToken();
            await _wishlistService.ClearAsync(email);
            return NoContent();
        }
    }
}

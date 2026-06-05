using System.Text.Json;
using ECommerce.Services.Abstraction;
using ECommerce.Shared.DTOs.WishlistDTOs;

namespace ECommerce.Services
{
    public class WishlistService : IWishlistService
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        private readonly ICacheService _cacheService;

        public WishlistService(ICacheService cacheService)
        {
            _cacheService = cacheService;
        }

        public async Task<WishlistDTO> AddItemAsync(string email, int productId)
        {
            var wishlist = await GetWishlistAsync(email);
            if (!wishlist.ProductIds.Contains(productId))
                wishlist.ProductIds.Add(productId);

            await SaveWishlistAsync(wishlist);
            return wishlist;
        }

        public async Task<bool> ClearAsync(string email)
        {
            var key = GetWishlistKey(email);
            await _cacheService.SetAsync(key, new WishlistDTO { UserEmail = email }, TimeSpan.FromSeconds(1));
            return true;
        }

        public async Task<WishlistDTO> GetWishlistAsync(string email)
        {
            var key = GetWishlistKey(email);
            var data = await _cacheService.GetAsync(key);

            if (string.IsNullOrWhiteSpace(data))
            {
                return new WishlistDTO { UserEmail = email };
            }

            return JsonSerializer.Deserialize<WishlistDTO>(data, JsonOptions)
                ?? new WishlistDTO { UserEmail = email };
        }

        public async Task<WishlistDTO> RemoveItemAsync(string email, int productId)
        {
            var wishlist = await GetWishlistAsync(email);
            wishlist.ProductIds = wishlist.ProductIds.Where(id => id != productId).ToList();
            await SaveWishlistAsync(wishlist);
            return wishlist;
        }

        private async Task SaveWishlistAsync(WishlistDTO wishlist)
        {
            var key = GetWishlistKey(wishlist.UserEmail);
            await _cacheService.SetAsync(key, wishlist, TimeSpan.FromDays(30));
        }

        private static string GetWishlistKey(string email) =>
            $"wishlist:{email.Trim().ToLowerInvariant()}";
    }
}

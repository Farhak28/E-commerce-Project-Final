using ECommerce.Shared.DTOs.WishlistDTOs;

namespace ECommerce.Services.Abstraction;

public interface IWishlistService
{
    Task<WishlistDTO> GetWishlistAsync(string email);
    Task<WishlistDTO> AddItemAsync(string email, int productId);
    Task<WishlistDTO> RemoveItemAsync(string email, int productId);
    Task<bool> ClearAsync(string email);
}

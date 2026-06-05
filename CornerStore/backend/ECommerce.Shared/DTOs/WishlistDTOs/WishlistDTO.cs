namespace ECommerce.Shared.DTOs.WishlistDTOs;

public class WishlistDTO
{
    public string UserEmail { get; set; } = default!;
    public List<int> ProductIds { get; set; } = new();
}

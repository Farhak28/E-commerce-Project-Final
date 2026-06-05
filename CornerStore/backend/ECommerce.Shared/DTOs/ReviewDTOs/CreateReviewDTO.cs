namespace ECommerce.Shared.DTOs.ReviewDTOs;

public class CreateReviewDTO
{
    public string? UserName { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = default!;
}

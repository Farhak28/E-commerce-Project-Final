namespace ECommerce.Shared.DTOs.ReviewDTOs;

public class ReviewDTO
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string UserName { get; set; } = default!;
    public int Rating { get; set; }
    public string Comment { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
}

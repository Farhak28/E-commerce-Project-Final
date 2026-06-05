namespace ECommerce.Domain.Entities.ProductModule;

public class Review : BaseEntity<int>
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string UserName { get; set; } = default!;
    public int Rating { get; set; }
    public string Comment { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
}

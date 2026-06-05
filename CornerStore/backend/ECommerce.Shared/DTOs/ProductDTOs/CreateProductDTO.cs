using System.ComponentModel.DataAnnotations;

namespace ECommerce.Shared.DTOs.ProductDTOs;

public class CreateProductDTO
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;

    [Required, MaxLength(500)]
    public string Description { get; set; } = default!;

    [Required, MaxLength(200)]
    public string PictureUrl { get; set; } = default!;

    [Range(0.01, double.MaxValue)]
    public decimal Price { get; set; }

    [Range(1, int.MaxValue)]
    public int ProductBrandId { get; set; }

    [Range(1, int.MaxValue)]
    public int ProductTypeId { get; set; }

    [Range(0, int.MaxValue)]
    public int StockQuantity { get; set; } = 100;
}

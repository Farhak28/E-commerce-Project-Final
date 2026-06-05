using ECommerce.Services;
using ECommerce.Services.Abstraction;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.ProductDTOs;
using ECommerce.Shared.DTOs.ReviewDTOs;
using Moq;

namespace ECommerce.Services.Tests;

public class ReviewSummaryServiceTests
{
    [Fact]
    public async Task GetSummaryAsync_ClassifiesPositiveAndNegativeReviews()
    {
        var products = new Mock<IProductService>();
        products.Setup(p => p.GetProductByIdAsync(1)).ReturnsAsync(
            Result<ProductDTO>.Ok(
                new ProductDTO
                {
                    Id = 1,
                    Name = "Test Phone",
                    Description = "A phone",
                    PictureUrl = "/img.png",
                    Price = 99,
                    ProductType = "Smartphones",
                    ProductBrand = "Nova",
                    AverageRating = 4.2,
                    ReviewCount = 3,
                    StockQuantity = 10,
                }
            )
        );
        products.Setup(p => p.GetReviewsByProductIdAsync(1)).ReturnsAsync(
            new[]
            {
                new ReviewDTO { Id = 1, ProductId = 1, UserName = "A", Rating = 5, Comment = "Excellent battery and great display", CreatedAt = DateTime.UtcNow },
                new ReviewDTO { Id = 2, ProductId = 1, UserName = "B", Rating = 2, Comment = "Slow charging and poor build", CreatedAt = DateTime.UtcNow },
                new ReviewDTO { Id = 3, ProductId = 1, UserName = "C", Rating = 3, Comment = "Okay product", CreatedAt = DateTime.UtcNow },
            }
        );

        var service = new ReviewSummaryService(products.Object);
        var summary = await service.GetSummaryAsync(1);

        Assert.NotNull(summary);
        Assert.Equal(1, summary!.ProductId);
        Assert.Equal(3, summary.TotalReviews);
        Assert.True(summary.PositivePercentage > 0);
        Assert.True(summary.NegativePercentage > 0);
        Assert.Contains("battery", summary.PositiveThemes.First(), StringComparison.OrdinalIgnoreCase);
        Assert.Contains("charging", summary.NegativeThemes.First(), StringComparison.OrdinalIgnoreCase);
        Assert.Contains("reviews", summary.Summary, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetSummaryAsync_ReturnsNull_WhenProductMissing()
    {
        var products = new Mock<IProductService>();
        products.Setup(p => p.GetProductByIdAsync(99)).ReturnsAsync(
            Result<ProductDTO>.Fail(Error.NotFound())
        );

        var service = new ReviewSummaryService(products.Object);
        var summary = await service.GetSummaryAsync(99);

        Assert.Null(summary);
    }
}

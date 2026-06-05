using ECommerce.Services.AI;
using ECommerce.Shared.DTOs.AIDTOs;
using ECommerce.Shared.DTOs.ProductDTOs;

namespace ECommerce.Services.Tests;

public class VisualProductMatcherTests
{
    [Fact]
    public void Match_PrioritizesExactNameAndBrand()
    {
        var catalog = new List<ProductDTO>
        {
            new()
            {
                Id = 1,
                Name = "Samsung Galaxy A35",
                Description = "Android smartphone",
                PictureUrl = "/a.jpg",
                Price = 299,
                ProductType = "Smartphones",
                ProductBrand = "Samsung",
                AverageRating = 4.5,
                ReviewCount = 10,
                StockQuantity = 5,
            },
            new()
            {
                Id = 2,
                Name = "Generic Phone Case",
                Description = "Accessory",
                PictureUrl = "/b.jpg",
                Price = 15,
                ProductType = "Accessories",
                ProductBrand = "Nova",
                AverageRating = 4,
                ReviewCount = 2,
                StockQuantity = 20,
            },
        };

        var attrs = new VisualProductAttributesDTO(
            "Smartphones",
            "Smartphone",
            "Samsung",
            "Black",
            null,
            null,
            "Samsung Galaxy A35",
            ["android", "camera"],
            ["phone", "android", "smartphone"],
            0.9
        );

        var matcher = new VisualProductMatcher();
        var result = matcher.Match(catalog, attrs);

        Assert.NotEmpty(result.ExactMatches);
        Assert.Equal(1, result.ExactMatches[0].Product.Id);
        Assert.True(result.ExactMatches[0].MatchPercentage >= 85);
    }
}

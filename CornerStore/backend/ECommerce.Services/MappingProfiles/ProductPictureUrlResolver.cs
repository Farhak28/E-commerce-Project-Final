using AutoMapper;
using ECommerce.Domain.Entities.ProductModule;
using ECommerce.Shared.DTOs.ProductDTOs;

namespace ECommerce.Services.MappingProfiles
{
    public class ProductPictureUrlResolver : IValueResolver<Product, ProductDTO, string>
    {
        public string Resolve(
            Product source,
            ProductDTO destination,
            string destMember,
            ResolutionContext context
        )
        {
            if (string.IsNullOrEmpty(source.PictureUrl))
                return string.Empty;

            if (source.PictureUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || source.PictureUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                return source.PictureUrl;

            return source.PictureUrl.StartsWith("/")
                ? source.PictureUrl
                : $"/{source.PictureUrl}";
        }
    }
}

using AutoMapper;
using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Shared.DTOs.OrderDTOs;

namespace ECommerce.Services.MappingProfiles
{
    internal class OrderItemPictureUrlResolver : IValueResolver<OrderItem, OrderItemDTO, string>
    {
        public string Resolve(
            OrderItem source,
            OrderItemDTO destination,
            string destMember,
            ResolutionContext context
        )
        {
            var pictureUrl = source.Product.PictureUrl;
            if (string.IsNullOrEmpty(pictureUrl))
                return string.Empty;

            if (pictureUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || pictureUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                return pictureUrl;

            return pictureUrl.StartsWith("/") ? pictureUrl : $"/{pictureUrl}";
        }
    }
}

using AutoMapper;
using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Services.Abstraction;
using ECommerce.Shared.DTOs.OrderDTOs;

namespace ECommerce.Services.MappingProfiles;

internal sealed class FulfillmentHeadlineResolver : IValueResolver<Order, OrderToReturnDTO, string>
{
    private readonly IRequestCultureAccessor _culture;

    public FulfillmentHeadlineResolver(IRequestCultureAccessor culture)
    {
        _culture = culture;
    }

    public string Resolve(
        Order source,
        OrderToReturnDTO destination,
        string destMember,
        ResolutionContext context
    ) => FulfillmentLabels.Headline(source.FulfillmentStage, _culture.Language);
}

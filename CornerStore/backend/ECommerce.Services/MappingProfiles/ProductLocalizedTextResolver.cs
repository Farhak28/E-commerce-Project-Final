using AutoMapper;
using ECommerce.Domain.Entities.ProductModule;
using ECommerce.Services.Abstraction;
using ECommerce.Shared.DTOs.ProductDTOs;
using ECommerce.Shared.Localization;

namespace ECommerce.Services.MappingProfiles;

internal sealed class ProductLocalizedNameResolver : IValueResolver<Product, ProductDTO, string>
{
    private readonly IRequestCultureAccessor _culture;

    public ProductLocalizedNameResolver(IRequestCultureAccessor culture)
    {
        _culture = culture;
    }

    public string Resolve(Product source, ProductDTO destination, string destMember, ResolutionContext context) =>
        StoreLocale.Normalize(_culture.Language) == StoreLocale.Arabic
        && !string.IsNullOrWhiteSpace(source.NameAr)
            ? source.NameAr!
            : source.Name;
}

internal sealed class ProductLocalizedDescriptionResolver : IValueResolver<Product, ProductDTO, string>
{
    private readonly IRequestCultureAccessor _culture;

    public ProductLocalizedDescriptionResolver(IRequestCultureAccessor culture)
    {
        _culture = culture;
    }

    public string Resolve(Product source, ProductDTO destination, string destMember, ResolutionContext context) =>
        StoreLocale.Normalize(_culture.Language) == StoreLocale.Arabic
        && !string.IsNullOrWhiteSpace(source.DescriptionAr)
            ? source.DescriptionAr!
            : source.Description;
}

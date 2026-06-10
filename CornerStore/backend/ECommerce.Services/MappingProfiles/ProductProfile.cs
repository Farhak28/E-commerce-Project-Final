using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Domain.Entities.ProductModule;
using ECommerce.Shared.DTOs.ProductDTOs;
using static System.Net.WebRequestMethods;

namespace ECommerce.Services.MappingProfiles
{
    internal class ProductProfile : Profile
    {
        public ProductProfile()
        {
            CreateMap<ProductBrand, BrandDTO>();
            CreateMap<Product, ProductDTO>()
                .ForMember(
                    dest => dest.ProductBrand,
                    opt => opt.MapFrom(src => src.ProductBrand.Name)
                )
                .ForMember(
                    dest => dest.BrandOfficialUrl,
                    opt => opt.MapFrom(src => src.ProductBrand.OfficialWebsiteUrl)
                )
                .ForMember(
                    dest => dest.ProductType,
                    opt => opt.MapFrom(src => src.ProductType.Name)
                )
                .ForMember(
                    dest => dest.PictureUrl,
                    opt => opt.MapFrom<ProductPictureUrlResolver>()
                )
                .ForMember(
                    dest => dest.AverageRating,
                    opt => opt.MapFrom(src => src.Reviews.Any() ? src.Reviews.Average(r => r.Rating) : 0.0)
                )
                .ForMember(
                    dest => dest.ReviewCount,
                    opt => opt.MapFrom(src => src.Reviews.Count)
                );

            //.ForMember(dest=>dest.PictureUrl,
            //       opt=>opt.MapFrom<>();

            CreateMap<ProductType, TypeDTO>();
        }
    }
}

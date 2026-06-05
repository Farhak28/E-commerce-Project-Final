using AutoMapper;
using ECommerce.Domain.Entities.IdentityModule;
using ECommerce.Shared.DTOs.IdentityDTOs;
using ECommerce.Shared.DTOs.OrderDTOs;

namespace ECommerce.Services.MappingProfiles
{
        internal class AuthenticationProfile : Profile
        {
            public AuthenticationProfile()
            {
                CreateMap<Address, AddressDTO>();
                CreateMap<Address, SavedAddressDTO>();
                CreateMap<AddressDTO, Address>()
                    .ForMember(d => d.Id, opt => opt.Ignore())
                    .ForMember(d => d.Name, opt => opt.Ignore())
                    .ForMember(d => d.UserId, opt => opt.Ignore())
                    .ForMember(d => d.User, opt => opt.Ignore());
            }
        }
}

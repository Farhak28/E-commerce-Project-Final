using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Shared.DTOs.OrderDTOs;

namespace ECommerce.Services.MappingProfiles
{
    public class OrderProfile : Profile
    {
        public OrderProfile()
        {
            CreateMap<AddressDTO, OrderAddress>().ReverseMap();
            CreateMap<Order, OrderToReturnDTO>()
                .ForMember(
                    dest => dest.DeliveryMethod,
                    opt => opt.MapFrom(src => src.DeliveryMethod.ShortName)
                )
                .ForMember(dest => dest.DeliveryMethodId, opt => opt.MapFrom(src => src.DeliveryMethodId))
                .ForMember(dest => dest.Subtotal, opt => opt.MapFrom(src => src.SubTotal))
                .ForMember(
                    dest => dest.DeliveryPrice,
                    opt => opt.MapFrom(src =>
                        src.DeliveryPrice > 0 ? src.DeliveryPrice : src.DeliveryMethod.Price
                    )
                )
                .ForMember(dest => dest.CouponCode, opt => opt.MapFrom(src => src.CouponCode))
                .ForMember(dest => dest.DiscountAmount, opt => opt.MapFrom(src => src.DiscountAmount))
                .ForMember(dest => dest.Total, opt => opt.MapFrom(src => src.GetTotal()))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.FulfillmentStage, opt => opt.MapFrom(src => src.FulfillmentStage.ToString()))
                .ForMember(dest => dest.TrackingNumber, opt => opt.MapFrom(src => src.TrackingNumber))
                .ForMember(dest => dest.CarrierName, opt => opt.MapFrom(src => src.CarrierName))
                .ForMember(dest => dest.ProgressPercent, opt => opt.MapFrom(src => FulfillmentLabels.ProgressPercent(src.FulfillmentStage)))
                .ForMember(dest => dest.TrackingHeadline, opt => opt.MapFrom(src => FulfillmentLabels.Headline(src.FulfillmentStage)))
                .ForMember(
                    dest => dest.PaymentMethod,
                    opt => opt.MapFrom(src => OrderPaymentLabels.Format(src.PaymentMethod, src.PaymentIntentId))
                )
                .ForMember(dest => dest.CanCancel, opt => opt.MapFrom(src => OrderActionRules.CanCancel(src)))
                .ForMember(dest => dest.CanReturn, opt => opt.MapFrom(src => OrderActionRules.CanReturn(src)))
                .ForMember(dest => dest.CanSchedule, opt => opt.MapFrom(src => OrderActionRules.CanSchedule(src)));

            CreateMap<OrderItem, OrderItemDTO>()
                .ForMember(D => D.ProductName, O => O.MapFrom(S => S.Product.ProductName))
                .ForMember(D => D.PictureUrl, O => O.MapFrom<OrderItemPictureUrlResolver>());

            CreateMap<DeliveryMethod, DeliveryMethodDTO>();
        }
    }
}

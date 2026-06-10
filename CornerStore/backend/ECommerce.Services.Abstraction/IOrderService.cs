using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.OrderDTOs;

namespace ECommerce.Services.Abstraction
{
    public interface IOrderService
    {
        //Create Order (OrderDTO,string Email) => OrderToReturnDTO

        Task<Result<OrderToReturnDTO>> CreateOrderAsync(OrderDTO orderDTO, string email);

        //Get Delivery Methods

        Task<Result<IEnumerable<DeliveryMethodDTO>>> GetAllDeliveryMethodsAsync();

        Task<Result<DeliveryQuoteDTO>> GetDeliveryQuoteAsync(
            int deliveryMethodId,
            DateTimeOffset? scheduledDeliveryAt
        );

        //Get All OrdersForUser (string Email) => List<OrderToReturnDTO>
        Task<Result<IEnumerable<OrderToReturnDTO>>> GetAllOrdersAsync(string email);

        //Get OrderByIdForUser (string Email,Guid OrderId) => OrderToReturnDTO

        Task<Result<OrderToReturnDTO>> GetOrderByIdAsync(Guid Id, string email);

        Task<Result<OrderToReturnDTO>> CancelOrderAsync(Guid id, string email);

        Task<Result<OrderToReturnDTO>> RequestReturnAsync(Guid id, string email, ReturnOrderDTO dto);

        Task<Result<OrderToReturnDTO>> ScheduleOrderAsync(Guid id, string email, ScheduleOrderDTO dto);
    }
}

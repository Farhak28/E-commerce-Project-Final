using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.OrderDTOs;

namespace ECommerce.Services.Abstraction;

public interface IOrderFulfillmentService
{
    Task InitializeNewOrderAsync(Order order, CancellationToken ct = default);
    Task ConfirmPaymentAsync(Order order, CancellationToken ct = default);
    Task<Result<OrderTrackingDTO>> GetTrackingAsync(Guid orderId, string userEmail, CancellationToken ct = default);
    Task<Result<OrderTrackingDTO>> AdvanceTrackingAsync(Guid orderId, string userEmail, CancellationToken ct = default);
    Task<Result<OrderTrackingDTO>> GetTrackingByOrderIdAsync(Guid orderId, CancellationToken ct = default);
    Task<Result<OrderTrackingDTO>> AdvanceTrackingByOrderIdAsync(Guid orderId, CancellationToken ct = default);
    Task AdvanceDueOrdersAsync(CancellationToken ct = default);
    void MarkCancelled(Order order);
    void MarkReturnRequested(Order order);
    OrderTrackingDTO BuildTrackingDto(Order order);
}

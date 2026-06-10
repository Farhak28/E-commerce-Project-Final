using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Specifications.OrderSpecifications;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.OrderDTOs;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ECommerce.Services;

public sealed class OrderFulfillmentService : IOrderFulfillmentService
{
    private static readonly FulfillmentStage[] ForwardStages =
    [
        FulfillmentStage.OrderPlaced,
        FulfillmentStage.Confirmed,
        FulfillmentStage.Processing,
        FulfillmentStage.Shipped,
        FulfillmentStage.OutForDelivery,
        FulfillmentStage.Delivered,
    ];

    private readonly IUnitOfWork _unitOfWork;
    private readonly OrderFulfillmentOptions _options;
    private readonly ILogger<OrderFulfillmentService> _logger;

    public OrderFulfillmentService(
        IUnitOfWork unitOfWork,
        IOptions<OrderFulfillmentOptions> options,
        ILogger<OrderFulfillmentService> logger
    )
    {
        _unitOfWork = unitOfWork;
        _options = options.Value;
        _logger = logger;
    }

    public async Task InitializeNewOrderAsync(Order order, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        order.CarrierName = "Corner Store Logistics";

        if (order.Status == OrderStatus.PaymentReceived)
        {
            order.FulfillmentStage = FulfillmentStage.Confirmed;
            order.ConfirmedAt = now;
            await AddEventAsync(order, FulfillmentStage.OrderPlaced, "Order placed", "We received your order.", order.Address.City, now, ct);
            await AddEventAsync(
                order,
                FulfillmentStage.Confirmed,
                "Payment confirmed",
                "Your payment was successful and the order is confirmed.",
                "Corner Store — Cairo hub",
                now,
                ct
            );
        }
        else
        {
            order.FulfillmentStage = FulfillmentStage.OrderPlaced;
            await AddEventAsync(order, FulfillmentStage.OrderPlaced, "Order placed", "We received your order.", order.Address.City, now, ct);
        }
    }

    public async Task ConfirmPaymentAsync(Order order, CancellationToken ct = default)
    {
        if (order.FulfillmentStage >= FulfillmentStage.Confirmed)
            return;

        var now = DateTimeOffset.UtcNow;
        order.FulfillmentStage = FulfillmentStage.Confirmed;
        order.ConfirmedAt = now;
        await AddEventAsync(
            order,
            FulfillmentStage.Confirmed,
            "Payment confirmed",
            "Your payment was received. We're getting your items ready.",
            "Corner Store — Cairo hub",
            now,
            ct
        );
    }

    public async Task<Result<OrderTrackingDTO>> GetTrackingAsync(
        Guid orderId,
        string userEmail,
        CancellationToken ct = default
    )
    {
        var order = await LoadOrderAsync(orderId, ct);
        if (order is null)
            return Error.NotFound("Order.NotFound", "Order not found.");
        if (!order.UserEmail.Equals(userEmail, StringComparison.OrdinalIgnoreCase))
            return Error.Validation("Order.Forbidden", "You cannot view this order.");

        return BuildTrackingDto(order);
    }

    public async Task<Result<OrderTrackingDTO>> GetTrackingByOrderIdAsync(
        Guid orderId,
        CancellationToken ct = default
    )
    {
        var order = await LoadOrderAsync(orderId, ct);
        if (order is null)
            return Error.NotFound("Order.NotFound", "Order not found.");

        return BuildTrackingDto(order);
    }

    public async Task<Result<OrderTrackingDTO>> AdvanceTrackingByOrderIdAsync(
        Guid orderId,
        CancellationToken ct = default
    )
    {
        var order = await LoadOrderAsync(orderId, ct);
        if (order is null)
            return Error.NotFound("Order.NotFound", "Order not found.");

        if (!CanAutoAdvance(order))
            return Error.Validation("Tracking.NotActive", "This order is not eligible for tracking updates.");

        await AdvanceOneStageAsync(order, ct);
        _unitOfWork.GetRepository<Order, Guid>().Update(order);
        await _unitOfWork.SaveChangesAsync();

        return BuildTrackingDto(order);
    }

    public async Task<Result<OrderTrackingDTO>> AdvanceTrackingAsync(
        Guid orderId,
        string userEmail,
        CancellationToken ct = default
    )
    {
        var order = await LoadOrderAsync(orderId, ct);
        if (order is null)
            return Error.NotFound("Order.NotFound", "Order not found.");
        if (!order.UserEmail.Equals(userEmail, StringComparison.OrdinalIgnoreCase))
            return Error.Validation("Order.Forbidden", "You cannot update this order.");

        if (!CanAutoAdvance(order))
            return Error.Validation("Tracking.NotActive", "This order is not eligible for tracking updates.");

        await AdvanceOneStageAsync(order, ct);
        _unitOfWork.GetRepository<Order, Guid>().Update(order);
        await _unitOfWork.SaveChangesAsync();

        return BuildTrackingDto(order);
    }

    public async Task AdvanceDueOrdersAsync(CancellationToken ct = default)
    {
        if (!_options.DemoAutoAdvance)
            return;

        var repo = _unitOfWork.GetRepository<Order, Guid>();
        var orders = (await repo.GetAllAsync(new OrderSpecificationForFulfillment())).ToList();
        var interval = TimeSpan.FromMinutes(Math.Max(1, _options.StageIntervalMinutes));
        var changed = false;

        foreach (var order in orders)
        {
            if (!CanAutoAdvance(order))
                continue;

            if (DateTimeOffset.UtcNow - GetLastStageTimestamp(order) < interval)
                continue;

            await AdvanceOneStageAsync(order, ct);
            repo.Update(order);
            changed = true;
        }

        if (changed)
            await _unitOfWork.SaveChangesAsync();
    }

    public void MarkCancelled(Order order)
    {
        var now = DateTimeOffset.UtcNow;
        order.FulfillmentStage = FulfillmentStage.Cancelled;
        order.TrackingEvents.Add(
            new OrderTrackingEvent
            {
                OrderId = order.Id,
                Stage = FulfillmentStage.Cancelled,
                Title = "Order cancelled",
                Description = "This shipment was cancelled.",
                Location = order.Address.City,
                OccurredAt = now,
            }
        );
    }

    public void MarkReturnRequested(Order order)
    {
        var now = DateTimeOffset.UtcNow;
        order.FulfillmentStage = FulfillmentStage.ReturnRequested;
        order.TrackingEvents.Add(
            new OrderTrackingEvent
            {
                OrderId = order.Id,
                Stage = FulfillmentStage.ReturnRequested,
                Title = "Return requested",
                Description = "We received your return request and will arrange pickup.",
                Location = order.Address.City,
                OccurredAt = now,
            }
        );
    }

    public OrderTrackingDTO BuildTrackingDto(Order order)
    {
        var steps = BuildSteps(order);
        var current = order.FulfillmentStage;
        var progress = current switch
        {
            FulfillmentStage.Delivered => 100,
            FulfillmentStage.OutForDelivery => 85,
            FulfillmentStage.Shipped => 65,
            FulfillmentStage.Processing => 45,
            FulfillmentStage.Confirmed => 25,
            FulfillmentStage.OrderPlaced => 10,
            _ => 0,
        };

        var (headline, subheadline) = GetHeadlines(order);

        return new OrderTrackingDTO(
            order.Id,
            order.Status.ToString(),
            current.ToString(),
            order.TrackingNumber,
            order.CarrierName,
            progress,
            headline,
            subheadline,
            order.ScheduledDeliveryAt ?? order.DeliveredAt ?? EstimateDelivery(order),
            steps
        );
    }

    private async Task<Order?> LoadOrderAsync(Guid orderId, CancellationToken ct)
    {
        var spec = new OrderWithTrackingSpecification(orderId);
        return await _unitOfWork.GetRepository<Order, Guid>().GetByIdAsync(spec);
    }

    private static bool CanAutoAdvance(Order order) =>
        order.Status is not (OrderStatus.Cancelled or OrderStatus.PaymentFailed or OrderStatus.ReturnRequested or OrderStatus.Returned)
        && order.FulfillmentStage is not (
            FulfillmentStage.Delivered
            or FulfillmentStage.Cancelled
            or FulfillmentStage.ReturnRequested
            or FulfillmentStage.Returned
        );

    private async Task AdvanceOneStageAsync(Order order, CancellationToken ct)
    {
        var next = order.FulfillmentStage switch
        {
            FulfillmentStage.OrderPlaced => FulfillmentStage.Confirmed,
            FulfillmentStage.Confirmed => FulfillmentStage.Processing,
            FulfillmentStage.Processing => FulfillmentStage.Shipped,
            FulfillmentStage.Shipped => FulfillmentStage.OutForDelivery,
            FulfillmentStage.OutForDelivery => FulfillmentStage.Delivered,
            _ => order.FulfillmentStage,
        };

        if (next == order.FulfillmentStage)
            return;

        var now = DateTimeOffset.UtcNow;
        order.FulfillmentStage = next;

        switch (next)
        {
            case FulfillmentStage.Confirmed:
                order.ConfirmedAt = now;
                if (order.Status == OrderStatus.Pending)
                    order.Status = OrderStatus.PaymentReceived;
                await AddEventAsync(
                    order,
                    next,
                    "Order confirmed",
                    "Your order is confirmed and queued for fulfillment.",
                    "Corner Store — Cairo hub",
                    now,
                    ct
                );
                break;
            case FulfillmentStage.Processing:
                order.ProcessingAt = now;
                await AddEventAsync(
                    order,
                    next,
                    "Processing at warehouse",
                    "We're picking and packing your items.",
                    "Corner Store warehouse",
                    now,
                    ct
                );
                break;
            case FulfillmentStage.Shipped:
                order.ShippedAt = now;
                order.TrackingNumber ??= GenerateTrackingNumber(order.Id);
                await AddEventAsync(
                    order,
                    next,
                    "Shipped",
                    $"Package handed to {order.CarrierName}.",
                    "Cairo distribution center",
                    now,
                    ct
                );
                break;
            case FulfillmentStage.OutForDelivery:
                order.OutForDeliveryAt = now;
                await AddEventAsync(
                    order,
                    next,
                    "Out for delivery",
                    "Your package is on the delivery vehicle.",
                    order.Address.City,
                    now,
                    ct
                );
                break;
            case FulfillmentStage.Delivered:
                order.DeliveredAt = now;
                await AddEventAsync(
                    order,
                    next,
                    "Delivered",
                    "Package delivered. Enjoy your purchase!",
                    order.Address.City,
                    now,
                    ct
                );
                break;
        }

        _logger.LogInformation("Order {OrderId} advanced to {Stage}", order.Id, next);
    }

    private async Task AddEventAsync(
        Order order,
        FulfillmentStage stage,
        string title,
        string description,
        string? location,
        DateTimeOffset occurredAt,
        CancellationToken ct
    )
    {
        var trackingEvent = new OrderTrackingEvent
        {
            OrderId = order.Id,
            Stage = stage,
            Title = title,
            Description = description,
            Location = location,
            OccurredAt = occurredAt,
        };
        order.TrackingEvents.Add(trackingEvent);
        await Task.CompletedTask;
    }

    private static DateTimeOffset GetLastStageTimestamp(Order order) =>
        order.DeliveredAt
        ?? order.OutForDeliveryAt
        ?? order.ShippedAt
        ?? order.ProcessingAt
        ?? order.ConfirmedAt
        ?? order.OrderDate;

    private static string GenerateTrackingNumber(Guid orderId) =>
        $"CS{orderId.ToString("N")[..8].ToUpperInvariant()}{Random.Shared.Next(1000, 9999)}";

    private static DateTimeOffset? EstimateDelivery(Order order)
    {
        if (order.FulfillmentStage == FulfillmentStage.Delivered)
            return order.DeliveredAt;
        return order.OrderDate.AddDays(2);
    }

    private static (string headline, string subheadline) GetHeadlines(Order order)
    {
        return order.FulfillmentStage switch
        {
            FulfillmentStage.Delivered => ("Delivered", "Your package has been delivered."),
            FulfillmentStage.OutForDelivery => (
                "Arriving today",
                $"Out for delivery in {order.Address.City}."
            ),
            FulfillmentStage.Shipped => (
                "On the way",
                order.TrackingNumber is not null
                    ? $"Tracking ID {order.TrackingNumber}"
                    : "Your package left our warehouse."
            ),
            FulfillmentStage.Processing => ("Preparing your order", "We're packing your items."),
            FulfillmentStage.Confirmed => ("Order confirmed", "We'll notify you at each step."),
            FulfillmentStage.OrderPlaced => ("Order placed", "Waiting for confirmation."),
            FulfillmentStage.Cancelled => ("Cancelled", "This shipment was cancelled."),
            FulfillmentStage.ReturnRequested => ("Return in progress", "We've received your return request."),
            FulfillmentStage.Returned => ("Returned", "This order was returned."),
            _ => ("Tracking", "Follow your order below."),
        };
    }

    private static IReadOnlyList<OrderTrackingStepDTO> BuildSteps(Order order)
    {
        if (order.FulfillmentStage is FulfillmentStage.Cancelled or FulfillmentStage.ReturnRequested or FulfillmentStage.Returned)
        {
            return order.TrackingEvents
                .OrderBy(e => e.OccurredAt)
                .Select(e => new OrderTrackingStepDTO(
                    e.Stage.ToString(),
                    e.Title,
                    e.Description,
                    e.Location,
                    e.OccurredAt,
                    true,
                    false
                ))
                .ToList();
        }

        var eventsByStage = order.TrackingEvents.ToDictionary(e => e.Stage, e => e);
        var currentIndex = Array.IndexOf(ForwardStages, order.FulfillmentStage);

        return ForwardStages.Select((stage, index) =>
        {
            eventsByStage.TryGetValue(stage, out var ev);
            var (title, description, location) = ev is not null
                ? (ev.Title, ev.Description, ev.Location)
                : DefaultStepCopy(stage, order);

            return new OrderTrackingStepDTO(
                stage.ToString(),
                title,
                description,
                location,
                ev?.OccurredAt,
                index < currentIndex || order.FulfillmentStage == FulfillmentStage.Delivered,
                index == currentIndex && order.FulfillmentStage != FulfillmentStage.Delivered
            );
        }).ToList();
    }

    private static (string title, string description, string? location) DefaultStepCopy(
        FulfillmentStage stage,
        Order order
    ) =>
        stage switch
        {
            FulfillmentStage.OrderPlaced => ("Order placed", "We received your order.", order.Address.City),
            FulfillmentStage.Confirmed => ("Order confirmed", "Payment confirmed.", "Corner Store — Cairo hub"),
            FulfillmentStage.Processing => ("Processing", "Preparing your package.", "Corner Store warehouse"),
            FulfillmentStage.Shipped => ("Shipped", "In transit with carrier.", "Cairo distribution center"),
            FulfillmentStage.OutForDelivery => ("Out for delivery", "On the delivery vehicle.", order.Address.City),
            FulfillmentStage.Delivered => ("Delivered", "Package delivered.", order.Address.City),
            _ => (stage.ToString(), "", null),
        };
}

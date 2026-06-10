namespace ECommerce.Shared.DTOs.OrderDTOs;

public record OrderTrackingStepDTO(
    string Stage,
    string Title,
    string Description,
    string? Location,
    DateTimeOffset? OccurredAt,
    bool IsComplete,
    bool IsCurrent
);

public record OrderTrackingDTO(
    Guid OrderId,
    string Status,
    string FulfillmentStage,
    string? TrackingNumber,
    string CarrierName,
    int ProgressPercent,
    string Headline,
    string Subheadline,
    DateTimeOffset? EstimatedDeliveryAt,
    IReadOnlyList<OrderTrackingStepDTO> Steps
);

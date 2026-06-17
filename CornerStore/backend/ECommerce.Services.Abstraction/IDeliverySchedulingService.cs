using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.OrderDTOs;

namespace ECommerce.Services.Abstraction;

public interface IDeliverySchedulingService
{
    Task<DeliverySchedulingSettingsDTO> GetSettingsAsync(CancellationToken ct = default);

    Task<Result<IReadOnlyList<AvailableDeliveryDateDTO>>> GetAvailableDatesAsync(
        int deliveryMethodId,
        CancellationToken ct = default
    );

    Task<Result<IReadOnlyList<DeliveryTimeSlotDTO>>> GetTimeSlotsAsync(
        int deliveryMethodId,
        DateOnly date,
        CancellationToken ct = default
    );

    Task<Result<DeliveryQuoteDTO>> GetQuoteAsync(
        int deliveryMethodId,
        DeliveryTypeDto deliveryType,
        DateTimeOffset? scheduledAt,
        int? timeSlotId,
        CancellationToken ct = default
    );

    Task<Result<DateTimeOffset>> ResolveScheduledDateTimeAsync(
        DateOnly date,
        int timeSlotId,
        CancellationToken ct = default
    );

    Task<Result> ValidateScheduleAsync(DateTimeOffset scheduledAt, CancellationToken ct = default);

    Task<DateTimeOffset?> EstimateDeliveryDateAsync(
        int deliveryMethodId,
        DeliveryTypeDto deliveryType,
        DateTimeOffset? scheduledAt,
        CancellationToken ct = default
    );

    Task<Result<DeliveryOptionsDTO>> GetDeliveryOptionsAsync(CancellationToken ct = default);

    Task<Result<AdminShippingConfigDTO>> GetAdminConfigAsync(CancellationToken ct = default);

    Task<Result<DeliverySchedulingSettingsDTO>> UpdateSettingsAsync(
        UpdateDeliverySchedulingSettingsRequest request,
        CancellationToken ct = default
    );

    Task<Result<DeliveryTimeSlotAdminDTO>> UpsertTimeSlotAsync(
        int? id,
        UpsertDeliveryTimeSlotRequest request,
        CancellationToken ct = default
    );

    Task<Result> DeleteTimeSlotAsync(int id, CancellationToken ct = default);

    Task<Result<DeliveryHolidayDTO>> AddHolidayAsync(
        CreateDeliveryHolidayRequest request,
        CancellationToken ct = default
    );

    Task<Result> DeleteHolidayAsync(int id, CancellationToken ct = default);

    Task<Result<BlockedDeliveryDateDTO>> AddBlockedDateAsync(
        CreateBlockedDeliveryDateRequest request,
        CancellationToken ct = default
    );

    Task<Result> DeleteBlockedDateAsync(int id, CancellationToken ct = default);
}

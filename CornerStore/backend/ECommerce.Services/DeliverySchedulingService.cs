using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Services.Abstraction;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.OrderDTOs;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Services;

public sealed class DeliverySchedulingService : IDeliverySchedulingService
{
    private readonly IUnitOfWork _unitOfWork;

    public DeliverySchedulingService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DeliverySchedulingSettingsDTO> GetSettingsAsync(CancellationToken ct = default)
    {
        var settings = await LoadSettingsAsync(ct);
        return MapSettings(settings);
    }

    public async Task<Result<IReadOnlyList<AvailableDeliveryDateDTO>>> GetAvailableDatesAsync(
        int deliveryMethodId,
        CancellationToken ct = default
    )
    {
        var method = await _unitOfWork.GetRepository<DeliveryMethod, int>().GetByIdAsync(deliveryMethodId);
        if (method is null)
            return Error.NotFound("DeliveryMethod.NotFound", "Delivery method not found.");

        var settings = await LoadSettingsAsync(ct);
        if (!settings.SchedulingEnabled)
            return Result<IReadOnlyList<AvailableDeliveryDateDTO>>.Ok([]);

        var holidays = await LoadHolidaysAsync(ct);
        var blocked = await LoadBlockedDatesAsync(ct);
        var now = DateTimeOffset.UtcNow;
        var minDate = DateOnly.FromDateTime(now.AddHours(settings.MinLeadHours).UtcDateTime);
        var maxDate = DateOnly.FromDateTime(now.AddDays(settings.MaxScheduleDaysAhead).UtcDateTime);

        var slots = await LoadActiveSlotsAsync(ct);
        var booked = await LoadSlotBookingsAsync(minDate, maxDate, ct);

        var dates = new List<AvailableDeliveryDateDTO>();
        for (var d = minDate; d <= maxDate; d = d.AddDays(1))
        {
            if (holidays.Contains(d))
            {
                dates.Add(new AvailableDeliveryDateDTO { Date = d.ToString("yyyy-MM-dd"), IsAvailable = false, Reason = "Holiday" });
                continue;
            }

            if (blocked.TryGetValue(d, out var reason))
            {
                dates.Add(new AvailableDeliveryDateDTO { Date = d.ToString("yyyy-MM-dd"), IsAvailable = false, Reason = reason ?? "Blocked" });
                continue;
            }

            if (slots.Count == 0)
            {
                dates.Add(new AvailableDeliveryDateDTO
                {
                    Date = d.ToString("yyyy-MM-dd"),
                    IsAvailable = false,
                    Reason = "No delivery windows configured",
                });
                continue;
            }

            var hasCapacity = slots.Any(slot =>
            {
                var key = (d, slot.Id);
                booked.TryGetValue(key, out var count);
                return count < slot.Capacity;
            });

            dates.Add(new AvailableDeliveryDateDTO
            {
                Date = d.ToString("yyyy-MM-dd"),
                IsAvailable = hasCapacity,
                Reason = hasCapacity ? null : "Fully booked",
            });
        }

        return Result<IReadOnlyList<AvailableDeliveryDateDTO>>.Ok(dates);
    }

    public async Task<Result<IReadOnlyList<DeliveryTimeSlotDTO>>> GetTimeSlotsAsync(
        int deliveryMethodId,
        DateOnly date,
        CancellationToken ct = default
    )
    {
        var method = await _unitOfWork.GetRepository<DeliveryMethod, int>().GetByIdAsync(deliveryMethodId);
        if (method is null)
            return Error.NotFound("DeliveryMethod.NotFound", "Delivery method not found.");

        var settings = await LoadSettingsAsync(ct);
        var holidays = await LoadHolidaysAsync(ct);
        var blocked = await LoadBlockedDatesAsync(ct);

        if (!settings.SchedulingEnabled)
            return Result<IReadOnlyList<DeliveryTimeSlotDTO>>.Ok([]);

        if (holidays.Contains(date) || blocked.ContainsKey(date))
            return Result<IReadOnlyList<DeliveryTimeSlotDTO>>.Ok([]);

        var now = DateTimeOffset.UtcNow;
        var minInstant = now.AddHours(settings.MinLeadHours);
        var slots = await LoadActiveSlotsAsync(ct);
        var booked = await LoadSlotBookingsAsync(date, date, ct);

        var result = slots.Select(slot =>
        {
            booked.TryGetValue((date, slot.Id), out var count);
            var remaining = Math.Max(0, slot.Capacity - count);
            var slotStart = ToDateTimeOffset(date, slot.StartTime);
            var available = remaining > 0 && slotStart >= minInstant;
            return new DeliveryTimeSlotDTO
            {
                Id = slot.Id,
                Label = slot.Label,
                StartTime = slot.StartTime.ToString("HH:mm"),
                EndTime = slot.EndTime.ToString("HH:mm"),
                Capacity = slot.Capacity,
                RemainingCapacity = remaining,
                IsAvailable = available,
            };
        }).ToList();

        return Result<IReadOnlyList<DeliveryTimeSlotDTO>>.Ok(result);
    }

    public async Task<Result<DeliveryQuoteDTO>> GetQuoteAsync(
        int deliveryMethodId,
        DeliveryTypeDto deliveryType,
        DateTimeOffset? scheduledAt,
        int? timeSlotId,
        CancellationToken ct = default
    )
    {
        var method = await _unitOfWork.GetRepository<DeliveryMethod, int>().GetByIdAsync(deliveryMethodId);
        if (method is null)
            return Error.NotFound("DeliveryMethod.NotFound", "Delivery method not found.");

        DateTimeOffset? effectiveSchedule = scheduledAt;
        if (deliveryType == DeliveryTypeDto.Scheduled && timeSlotId.HasValue && scheduledAt is null)
        {
            var slot = await _unitOfWork.GetRepository<DeliveryTimeSlot, int>().GetByIdAsync(timeSlotId.Value);
            if (slot is null)
                return Error.NotFound("TimeSlot.NotFound", "Time slot not found.");
        }

        if (deliveryType == DeliveryTypeDto.Scheduled && effectiveSchedule.HasValue)
        {
            var validation = await ValidateScheduleAsync(effectiveSchedule.Value, ct);
            if (!validation.IsSuccess)
                return Result<DeliveryQuoteDTO>.Fail(validation.Errors.ToList());
        }

        var rules = await LoadActivePricingRulesAsync(ct);
        var quote = DeliveryPricingEngine.BuildQuote(
            method.Id,
            method.ShortName,
            method.Price,
            deliveryType == DeliveryTypeDto.Scheduled ? effectiveSchedule : null,
            rules
        );

        var estimated = await EstimateDeliveryDateAsync(
            deliveryMethodId,
            deliveryType,
            deliveryType == DeliveryTypeDto.Scheduled ? effectiveSchedule : null,
            ct
        );

        return quote with
        {
            DeliveryTime = method.DeliveryTime,
            EstimatedDeliveryDate = estimated,
        };
    }

    public async Task<Result<DateTimeOffset>> ResolveScheduledDateTimeAsync(
        DateOnly date,
        int timeSlotId,
        CancellationToken ct = default
    )
    {
        var slot = await _unitOfWork.GetRepository<DeliveryTimeSlot, int>().GetByIdAsync(timeSlotId);
        if (slot is null || !slot.IsActive)
            return Error.NotFound("TimeSlot.NotFound", "Time slot not found.");

        var scheduledAt = ToDateTimeOffset(date, slot.StartTime);
        var validation = await ValidateScheduleAsync(scheduledAt, ct);
        if (!validation.IsSuccess)
            return Result<DateTimeOffset>.Fail(validation.Errors.ToList());

        var availableSlots = await GetTimeSlotsForDateOnlyAsync(date, ct);
        if (!availableSlots.Any(s => s.Id == timeSlotId && s.IsAvailable))
            return Error.Validation("TimeSlot.Unavailable", "Selected time slot is not available.");

        return scheduledAt;
    }

    public async Task<Result> ValidateScheduleAsync(DateTimeOffset scheduledAt, CancellationToken ct = default)
    {
        var settings = await LoadSettingsAsync(ct);
        var now = DateTimeOffset.UtcNow;
        if (scheduledAt <= now.AddHours(settings.MinLeadHours))
            return Result.Fail(Error.Validation(
                "Schedule.TooSoon",
                $"Choose a delivery time at least {settings.MinLeadHours} hours from now."
            ));

        var scheduledDate = DateOnly.FromDateTime(scheduledAt.UtcDateTime);
        var maxDate = DateOnly.FromDateTime(now.AddDays(settings.MaxScheduleDaysAhead).UtcDateTime);
        if (scheduledDate > maxDate)
            return Result.Fail(Error.Validation(
                "Schedule.TooFar",
                $"Delivery can be scheduled up to {settings.MaxScheduleDaysAhead} days ahead."
            ));

        var date = scheduledDate;
        var holidays = await LoadHolidaysAsync(ct);
        if (holidays.Contains(date))
            return Result.Fail(Error.Validation("Schedule.Holiday", "Selected date is a holiday."));

        var blocked = await LoadBlockedDatesAsync(ct);
        if (blocked.ContainsKey(date))
            return Result.Fail(Error.Validation("Schedule.Blocked", blocked[date] ?? "Selected date is not available."));

        return Result.Ok();
    }

    public async Task<DateTimeOffset?> EstimateDeliveryDateAsync(
        int deliveryMethodId,
        DeliveryTypeDto deliveryType,
        DateTimeOffset? scheduledAt,
        CancellationToken ct = default
    )
    {
        if (deliveryType == DeliveryTypeDto.Scheduled && scheduledAt.HasValue)
            return scheduledAt.Value;

        var method = await _unitOfWork.GetRepository<DeliveryMethod, int>().GetByIdAsync(deliveryMethodId);
        if (method is null)
            return null;

        return ParseDeliveryWindow(method.DeliveryTime);
    }

    public async Task<Result<AdminShippingConfigDTO>> GetAdminConfigAsync(CancellationToken ct = default)
    {
        var settings = await LoadSettingsAsync(ct);
        var slots = await _unitOfWork.GetRepository<DeliveryTimeSlot, int>().GetAllAsync();
        var rules = await _unitOfWork.GetRepository<DeliveryPricingRule, int>().GetAllAsync();
        var holidays = await _unitOfWork.GetRepository<DeliveryHoliday, int>().GetAllAsync();
        var blocked = await _unitOfWork.GetRepository<BlockedDeliveryDate, int>().GetAllAsync();

        return Result<AdminShippingConfigDTO>.Ok(new AdminShippingConfigDTO
        {
            Settings = MapSettings(settings),
            TimeSlots = slots
                .OrderBy(s => s.SortOrder)
                .Select(s => new DeliveryTimeSlotAdminDTO
                {
                    Id = s.Id,
                    Label = s.Label,
                    StartTime = s.StartTime.ToString("HH:mm"),
                    EndTime = s.EndTime.ToString("HH:mm"),
                    Capacity = s.Capacity,
                    IsActive = s.IsActive,
                    SortOrder = s.SortOrder,
                })
                .ToList(),
            PricingRules = rules
                .OrderBy(r => r.SortOrder)
                .Select(r => new DeliveryPricingRuleDTO
                {
                    Id = r.Id,
                    RuleType = r.RuleType.ToString(),
                    Label = r.Label,
                    Amount = r.Amount,
                    IsActive = r.IsActive,
                })
                .ToList(),
            Holidays = holidays
                .OrderBy(h => h.Date)
                .Select(h => new DeliveryHolidayDTO
                {
                    Id = h.Id,
                    Date = h.Date.ToString("yyyy-MM-dd"),
                    Name = h.Name,
                })
                .ToList(),
            BlockedDates = blocked
                .OrderBy(b => b.Date)
                .Select(b => new BlockedDeliveryDateDTO
                {
                    Id = b.Id,
                    Date = b.Date.ToString("yyyy-MM-dd"),
                    Reason = b.Reason,
                })
                .ToList(),
        });
    }

    public async Task<Result<DeliverySchedulingSettingsDTO>> UpdateSettingsAsync(
        UpdateDeliverySchedulingSettingsRequest request,
        CancellationToken ct = default
    )
    {
        var repo = _unitOfWork.GetRepository<DeliverySchedulingSettings, int>();
        var settings = await repo.GetByIdAsync(1);
        if (settings is null)
        {
            settings = new DeliverySchedulingSettings { Id = 1 };
            await repo.AddAsync(settings);
        }

        settings.MinLeadHours = Math.Max(0, request.MinLeadHours);
        settings.MaxScheduleDaysAhead = Math.Max(1, request.MaxScheduleDaysAhead);
        settings.SchedulingEnabled = request.SchedulingEnabled;
        await _unitOfWork.SaveChangesAsync();
        return Result<DeliverySchedulingSettingsDTO>.Ok(MapSettings(settings));
    }

    public async Task<Result<DeliveryTimeSlotAdminDTO>> UpsertTimeSlotAsync(
        int? id,
        UpsertDeliveryTimeSlotRequest request,
        CancellationToken ct = default
    )
    {
        if (!TimeOnly.TryParse(request.StartTime, out var start) || !TimeOnly.TryParse(request.EndTime, out var end))
            return Error.Validation("TimeSlot.InvalidTime", "Start and end times must use HH:mm format.");

        var repo = _unitOfWork.GetRepository<DeliveryTimeSlot, int>();
        DeliveryTimeSlot slot;
        if (id.HasValue)
        {
            slot = await repo.GetByIdAsync(id.Value);
            if (slot is null)
                return Error.NotFound("TimeSlot.NotFound", "Time slot not found.");
        }
        else
        {
            slot = new DeliveryTimeSlot();
            await repo.AddAsync(slot);
        }

        slot.Label = request.Label.Trim();
        slot.StartTime = start;
        slot.EndTime = end;
        slot.Capacity = Math.Max(1, request.Capacity);
        slot.IsActive = request.IsActive;
        slot.SortOrder = request.SortOrder;
        await _unitOfWork.SaveChangesAsync();

        return new DeliveryTimeSlotAdminDTO
        {
            Id = slot.Id,
            Label = slot.Label,
            StartTime = slot.StartTime.ToString("HH:mm"),
            EndTime = slot.EndTime.ToString("HH:mm"),
            Capacity = slot.Capacity,
            IsActive = slot.IsActive,
            SortOrder = slot.SortOrder,
        };
    }

    public async Task<Result> DeleteTimeSlotAsync(int id, CancellationToken ct = default)
    {
        var repo = _unitOfWork.GetRepository<DeliveryTimeSlot, int>();
        var slot = await repo.GetByIdAsync(id);
        if (slot is null)
            return Result.Fail(Error.NotFound("TimeSlot.NotFound", "Time slot not found."));

        repo.Delete(slot);
        await _unitOfWork.SaveChangesAsync();
        return Result.Ok();
    }

    public async Task<Result<DeliveryHolidayDTO>> AddHolidayAsync(
        CreateDeliveryHolidayRequest request,
        CancellationToken ct = default
    )
    {
        if (!DateOnly.TryParse(request.Date, out var date))
            return Error.Validation("Holiday.InvalidDate", "Date must use yyyy-MM-dd format.");

        var holiday = new DeliveryHoliday { Date = date, Name = request.Name.Trim() };
        await _unitOfWork.GetRepository<DeliveryHoliday, int>().AddAsync(holiday);
        await _unitOfWork.SaveChangesAsync();

        return new DeliveryHolidayDTO
        {
            Id = holiday.Id,
            Date = holiday.Date.ToString("yyyy-MM-dd"),
            Name = holiday.Name,
        };
    }

    public async Task<Result> DeleteHolidayAsync(int id, CancellationToken ct = default)
    {
        var repo = _unitOfWork.GetRepository<DeliveryHoliday, int>();
        var item = await repo.GetByIdAsync(id);
        if (item is null)
            return Result.Fail(Error.NotFound("Holiday.NotFound", "Holiday not found."));

        repo.Delete(item);
        await _unitOfWork.SaveChangesAsync();
        return Result.Ok();
    }

    public async Task<Result<BlockedDeliveryDateDTO>> AddBlockedDateAsync(
        CreateBlockedDeliveryDateRequest request,
        CancellationToken ct = default
    )
    {
        if (!DateOnly.TryParse(request.Date, out var date))
            return Error.Validation("BlockedDate.InvalidDate", "Date must use yyyy-MM-dd format.");

        var blocked = new BlockedDeliveryDate { Date = date, Reason = request.Reason?.Trim() };
        await _unitOfWork.GetRepository<BlockedDeliveryDate, int>().AddAsync(blocked);
        await _unitOfWork.SaveChangesAsync();

        return new BlockedDeliveryDateDTO
        {
            Id = blocked.Id,
            Date = blocked.Date.ToString("yyyy-MM-dd"),
            Reason = blocked.Reason,
        };
    }

    public async Task<Result> DeleteBlockedDateAsync(int id, CancellationToken ct = default)
    {
        var repo = _unitOfWork.GetRepository<BlockedDeliveryDate, int>();
        var item = await repo.GetByIdAsync(id);
        if (item is null)
            return Result.Fail(Error.NotFound("BlockedDate.NotFound", "Blocked date not found."));

        repo.Delete(item);
        await _unitOfWork.SaveChangesAsync();
        return Result.Ok();
    }

    public async Task<Result<DeliveryOptionsDTO>> GetDeliveryOptionsAsync(CancellationToken ct = default)
    {
        var methods = await _unitOfWork.GetRepository<DeliveryMethod, int>().GetAllAsync();
        var settings = await LoadSettingsAsync(ct);
        return Result<DeliveryOptionsDTO>.Ok(new DeliveryOptionsDTO
        {
            DeliveryMethods = methods.Select(m => new DeliveryMethodDTO
            {
                Id = m.Id,
                ShortName = m.ShortName,
                Description = m.Description,
                DeliveryTime = m.DeliveryTime,
                Price = m.Price,
            }),
            Settings = MapSettings(settings),
            SchedulingEnabled = settings.SchedulingEnabled,
        });
    }

    private async Task<List<DeliveryTimeSlotDTO>> GetTimeSlotsForDateOnlyAsync(DateOnly date, CancellationToken ct)
    {
        var slots = await LoadActiveSlotsAsync(ct);
        var booked = await LoadSlotBookingsAsync(date, date, ct);
        var settings = await LoadSettingsAsync(ct);
        var now = DateTimeOffset.UtcNow;
        var minInstant = now.AddHours(settings.MinLeadHours);

        return slots.Select(slot =>
        {
            booked.TryGetValue((date, slot.Id), out var count);
            var remaining = Math.Max(0, slot.Capacity - count);
            var slotStart = ToDateTimeOffset(date, slot.StartTime);
            return new DeliveryTimeSlotDTO
            {
                Id = slot.Id,
                Label = slot.Label,
                StartTime = slot.StartTime.ToString("HH:mm"),
                EndTime = slot.EndTime.ToString("HH:mm"),
                Capacity = slot.Capacity,
                RemainingCapacity = remaining,
                IsAvailable = remaining > 0 && slotStart >= minInstant,
            };
        }).ToList();
    }

    private async Task<DeliverySchedulingSettings> LoadSettingsAsync(CancellationToken ct)
    {
        var repo = _unitOfWork.GetRepository<DeliverySchedulingSettings, int>();
        var settings = await repo.GetByIdAsync(1);
        if (settings is not null)
            return settings;

        return new DeliverySchedulingSettings
        {
            Id = 1,
            MinLeadHours = 2,
            MaxScheduleDaysAhead = 14,
            SchedulingEnabled = true,
        };
    }

    private async Task<HashSet<DateOnly>> LoadHolidaysAsync(CancellationToken ct)
    {
        var items = await _unitOfWork.GetRepository<DeliveryHoliday, int>().GetAllAsync();
        return items.Select(h => h.Date).ToHashSet();
    }

    private async Task<Dictionary<DateOnly, string?>> LoadBlockedDatesAsync(CancellationToken ct)
    {
        var items = await _unitOfWork.GetRepository<BlockedDeliveryDate, int>().GetAllAsync();
        return items.ToDictionary(b => b.Date, b => b.Reason);
    }

    private async Task<List<DeliveryTimeSlot>> LoadActiveSlotsAsync(CancellationToken ct)
    {
        var items = await _unitOfWork.GetRepository<DeliveryTimeSlot, int>().GetAllAsync();
        return items.Where(s => s.IsActive).OrderBy(s => s.SortOrder).ToList();
    }

    private async Task<List<DeliveryPricingRule>> LoadActivePricingRulesAsync(CancellationToken ct)
    {
        var items = await _unitOfWork.GetRepository<DeliveryPricingRule, int>().GetAllAsync();
        return items.Where(r => r.IsActive).OrderBy(r => r.SortOrder).ToList();
    }

    private async Task<Dictionary<(DateOnly Date, int SlotId), int>> LoadSlotBookingsAsync(
        DateOnly from,
        DateOnly to,
        CancellationToken ct
    )
    {
        var orders = await _unitOfWork.GetRepository<Order, Guid>().GetAllAsync();
        return orders
            .Where(o =>
                o.DeliveryType == DeliveryType.Scheduled
                && o.ScheduledDeliveryDate.HasValue
                && o.DeliveryTimeSlotId.HasValue
                && o.ScheduledDeliveryDate.Value >= from
                && o.ScheduledDeliveryDate.Value <= to
                && o.Status is not OrderStatus.Cancelled and not OrderStatus.PaymentFailed
            )
            .GroupBy(o => (o.ScheduledDeliveryDate!.Value, o.DeliveryTimeSlotId!.Value))
            .ToDictionary(g => g.Key, g => g.Count());
    }

    private static DeliverySchedulingSettingsDTO MapSettings(DeliverySchedulingSettings s) =>
        new()
        {
            MinLeadHours = s.MinLeadHours,
            MaxScheduleDaysAhead = s.MaxScheduleDaysAhead,
            SchedulingEnabled = s.SchedulingEnabled,
        };

    private static DateTimeOffset ToDateTimeOffset(DateOnly date, TimeOnly time) =>
        new(date.ToDateTime(time), TimeSpan.Zero);

    private static DateTimeOffset? ParseDeliveryWindow(string deliveryTime)
    {
        if (string.IsNullOrWhiteSpace(deliveryTime))
            return DateTimeOffset.UtcNow.AddDays(5);

        var digits = deliveryTime
            .Split('-', ' ')
            .Select(s => int.TryParse(new string(s.Where(char.IsDigit).ToArray()), out var n) ? n : (int?)null)
            .Where(n => n.HasValue)
            .Select(n => n!.Value)
            .ToList();

        var days = digits.Count > 0 ? digits.Max() : 5;
        return DateTimeOffset.UtcNow.AddDays(days);
    }
}

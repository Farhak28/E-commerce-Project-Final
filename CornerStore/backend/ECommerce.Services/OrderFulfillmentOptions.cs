namespace ECommerce.Services;

public sealed class OrderFulfillmentOptions
{
    public const string SectionName = "OrderFulfillment";

    /// <summary>Automatically advance shipment stages for live demo presentations.</summary>
    public bool DemoAutoAdvance { get; set; } = true;

    /// <summary>Minutes between automatic stage transitions.</summary>
    public int StageIntervalMinutes { get; set; } = 2;

    /// <summary>How often the background worker checks orders.</summary>
    public int WorkerIntervalSeconds { get; set; } = 45;
}

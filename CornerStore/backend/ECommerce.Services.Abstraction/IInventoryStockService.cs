namespace ECommerce.Services.Abstraction;

public interface IInventoryStockService
{
    /// <summary>
    /// Deducts stock for existing non-cancelled orders that were placed before stock tracking was enabled.
    /// </summary>
    Task ReconcileHistoricalOrdersAsync(CancellationToken ct = default);
}

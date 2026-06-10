using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Domain.Entities.ProductModule;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Specifications.OrderSpecifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ECommerce.Services;

public sealed class InventoryStockService : IInventoryStockService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<InventoryStockService> _logger;

    public InventoryStockService(IUnitOfWork unitOfWork, ILogger<InventoryStockService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task ReconcileHistoricalOrdersAsync(CancellationToken ct = default)
    {
        var orderRepo = _unitOfWork.GetRepository<Order, Guid>();
        var orders = await orderRepo.GetAllAsync(new OrderSpecification());
        var pending = orders
            .Where(o => !o.StockDeducted && o.Status != OrderStatus.Cancelled)
            .OrderBy(o => o.OrderDate)
            .ToList();

        if (pending.Count == 0)
            return;

        var productRepo = _unitOfWork.GetRepository<Product, int>();
        var adjustedProducts = 0;

        foreach (var order in pending)
        {
            foreach (var item in order.Items)
            {
                var product = await productRepo.GetByIdAsync(item.Product.ProductId);
                if (product is null)
                    continue;

                product.StockQuantity = Math.Max(0, product.StockQuantity - item.Quantity);
                productRepo.Update(product);
                adjustedProducts++;
            }

            order.StockDeducted = true;
            orderRepo.Update(order);
        }

        await _unitOfWork.SaveChangesAsync();
        _logger.LogInformation(
            "Reconciled stock for {OrderCount} historical orders ({LineCount} product lines).",
            pending.Count,
            adjustedProducts
        );
    }
}

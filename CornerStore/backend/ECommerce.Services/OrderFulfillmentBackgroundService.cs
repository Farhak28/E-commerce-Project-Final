using ECommerce.Services.Abstraction;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ECommerce.Services;

public sealed class OrderFulfillmentBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly OrderFulfillmentOptions _options;
    private readonly ILogger<OrderFulfillmentBackgroundService> _logger;

    public OrderFulfillmentBackgroundService(
        IServiceScopeFactory scopeFactory,
        IOptions<OrderFulfillmentOptions> options,
        ILogger<OrderFulfillmentBackgroundService> logger
    )
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.DemoAutoAdvance)
        {
            _logger.LogInformation("Order fulfillment auto-advance is disabled.");
            return;
        }

        var delay = TimeSpan.FromSeconds(Math.Max(15, _options.WorkerIntervalSeconds));
        _logger.LogInformation(
            "Order fulfillment worker started (every {Seconds}s, stage interval {Minutes}m).",
            delay.TotalSeconds,
            _options.StageIntervalMinutes
        );

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(delay, stoppingToken);
                using var scope = _scopeFactory.CreateScope();
                var fulfillment = scope.ServiceProvider.GetRequiredService<IOrderFulfillmentService>();
                await fulfillment.AdvanceDueOrdersAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Order fulfillment worker iteration failed.");
            }
        }
    }
}

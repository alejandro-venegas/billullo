using Billullo.Api.Services.Interfaces;

namespace Billullo.Api.Services;

public class CurrencyRateSyncService(
    IServiceScopeFactory scopeFactory,
    ILogger<CurrencyRateSyncService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(4);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = scopeFactory.CreateScope();
            var currencyService = scope.ServiceProvider.GetRequiredService<ICurrencyService>();

            try
            {
                await currencyService.FetchAndStoreRatesAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to fetch exchange rates. Will retry in {Interval}.", Interval);
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }
}

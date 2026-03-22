using Billullo.Api.Models;

namespace Billullo.Api.Services.Interfaces;

public interface ICurrencyService
{
    /// <summary>
    /// Fetches the latest USD/CRC exchange rates from ExchangeRate-API and persists them to the database.
    /// </summary>
    Task FetchAndStoreRatesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the most recently stored rate for the given currency pair, or null if none exists.
    /// </summary>
    Task<ExchangeRate?> GetLatestRateAsync(string baseCurrency, string quoteCurrency);

    /// <summary>
    /// Returns the exchange rate closest to the given date, falling back to the latest rate if none found.
    /// </summary>
    Task<ExchangeRate?> GetRateNearestToDateAsync(string baseCurrency, string quoteCurrency, DateTime targetDate);
}

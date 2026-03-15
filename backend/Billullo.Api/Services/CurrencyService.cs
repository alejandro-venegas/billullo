using System.Text.Json;
using System.Text.Json.Serialization;
using Billullo.Api.Data;
using Billullo.Api.Models;
using Billullo.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Billullo.Api.Services;

public class CurrencyService(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    AppDbContext db,
    ILogger<CurrencyService> logger) : ICurrencyService
{
    private static readonly string[] TrackedCurrencies = ["CRC"];
    private const string BaseCurrency = "USD";

    public async Task FetchAndStoreRatesAsync(CancellationToken cancellationToken = default)
    {
        var apiKey = configuration["FreeCurrencyApi:ApiKey"]!;
        var currencies = string.Join(",", TrackedCurrencies);

        var client = httpClientFactory.CreateClient("FreeCurrencyApi");
        var url = $"latest?apikey={apiKey}&base_currency={BaseCurrency}&currencies={currencies}";

        var response = await client.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var result = JsonSerializer.Deserialize<FreeCurrencyApiResponse>(json);

        if (result?.Data is null)
        {
            logger.LogWarning("FreeCurrencyAPI returned an empty or unexpected response.");
            return;
        }

        var fetchedAt = DateTime.UtcNow;

        var rates = result.Data.Select(kvp => new ExchangeRate
        {
            BaseCurrency = BaseCurrency,
            QuoteCurrency = kvp.Key,
            Rate = kvp.Value.Value,
            FetchedAt = fetchedAt
        });

        db.ExchangeRates.AddRange(rates);
        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Exchange rates updated at {FetchedAt}: {Rates}",
            fetchedAt,
            string.Join(", ", result.Data.Select(kvp => $"{BaseCurrency}/{kvp.Key}={kvp.Value.Value}")));
    }

    public async Task<ExchangeRate?> GetLatestRateAsync(string baseCurrency, string quoteCurrency)
    {
        return await db.ExchangeRates
            .Where(er => er.BaseCurrency == baseCurrency && er.QuoteCurrency == quoteCurrency)
            .OrderByDescending(er => er.FetchedAt)
            .FirstOrDefaultAsync();
    }

    private sealed class FreeCurrencyApiResponse
    {
        [JsonPropertyName("data")]
        public Dictionary<string, CurrencyValue>? Data { get; set; }
    }

    private sealed class CurrencyValue
    {
        [JsonPropertyName("value")]
        public decimal Value { get; set; }
    }
}

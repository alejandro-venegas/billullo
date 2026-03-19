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
    private string BaseCurrency => configuration["ExchangeRateApi:BaseCurrency"] ?? "USD";
    private string[] TrackedCurrencies => configuration.GetSection("ExchangeRateApi:TrackedCurrencies").Get<string[]>() ?? ["CRC"];

    public async Task FetchAndStoreRatesAsync(CancellationToken cancellationToken = default)
    {
        var apiKey = configuration["ExchangeRateApi:ApiKey"]!;

        var client = httpClientFactory.CreateClient("ExchangeRateApi");
        var url = $"{apiKey}/latest/{BaseCurrency}";

        var response = await client.GetAsync(url, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            logger.LogError(
                "ExchangeRate-API returned {StatusCode}: {Body}",
                (int)response.StatusCode,
                errorBody);
            response.EnsureSuccessStatusCode();
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var result = JsonSerializer.Deserialize<ExchangeRateApiResponse>(json);

        if (result?.ConversionRates is null || result.Result != "success")
        {
            logger.LogWarning("ExchangeRate-API returned an empty or unsuccessful response.");
            return;
        }

        var fetchedAt = DateTime.UtcNow;

        var rates = result.ConversionRates
            .Where(kvp => TrackedCurrencies.Contains(kvp.Key))
            .Select(kvp => new ExchangeRate
            {
                BaseCurrency = BaseCurrency,
                QuoteCurrency = kvp.Key,
                Rate = kvp.Value,
                FetchedAt = fetchedAt
            });

        db.ExchangeRates.AddRange(rates);
        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Exchange rates updated at {FetchedAt}: {Rates}",
            fetchedAt,
            string.Join(", ", result.ConversionRates
                .Where(kvp => TrackedCurrencies.Contains(kvp.Key))
                .Select(kvp => $"{BaseCurrency}/{kvp.Key}={kvp.Value}")));
    }

    public async Task<ExchangeRate?> GetLatestRateAsync(string baseCurrency, string quoteCurrency)
    {
        return await db.ExchangeRates
            .Where(er => er.BaseCurrency == baseCurrency && er.QuoteCurrency == quoteCurrency)
            .OrderByDescending(er => er.FetchedAt)
            .FirstOrDefaultAsync();
    }

    private sealed class ExchangeRateApiResponse
    {
        [JsonPropertyName("result")]
        public string? Result { get; set; }

        [JsonPropertyName("conversion_rates")]
        public Dictionary<string, decimal>? ConversionRates { get; set; }
    }
}

namespace Billullo.Api.Models;

public class ExchangeRate
{
    public long Id { get; set; }
    public string BaseCurrency { get; set; } = "USD";
    public string QuoteCurrency { get; set; } = default!;
    public decimal Rate { get; set; }
    public DateTime FetchedAt { get; set; }
}

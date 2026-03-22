using System.ComponentModel.DataAnnotations;

namespace Billullo.Api.Models;

public class Account
{
    public long Id { get; set; }

    [Required]
    public string UserId { get; set; } = default!;
    public AppUser User { get; set; } = default!;

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>Regex pattern to match against email body for auto-assigning transactions.</summary>
    [MaxLength(500)]
    public string? Identifier { get; set; }

    [Required, MaxLength(7)]
    public string Color { get; set; } = "#9E9E9E";

    /// <summary>
    /// Comma-separated list of allowed Currency enum values (e.g. "USD,CRC").
    /// Null means multi-currency (any currency accepted).
    /// </summary>
    [MaxLength(100)]
    public string? Currencies { get; set; }

    /// <summary>
    /// Required when Currencies has 2+ values. Must be one of the listed currencies.
    /// Used as the target currency when converting transactions in non-listed currencies.
    /// </summary>
    public Currency? FallbackCurrency { get; set; }

    public bool IsDefault { get; set; }

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}

using System.ComponentModel.DataAnnotations;

namespace Billullo.Api.Models;

public class Transaction
{
    public long Id { get; set; }

    [Required]
    public string UserId { get; set; } = default!;
    public AppUser User { get; set; } = default!;

    public DateTime Date { get; set; }

    [Required, MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    public long? CategoryId { get; set; }
    public Category? Category { get; set; }

    public decimal Amount { get; set; }

    public Currency Currency { get; set; }

    public TransactionType Type { get; set; }

    public TransactionSource Source { get; set; } = TransactionSource.Manual;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace Billullo.Api.Models;

public class EmailParsingRule
{
    public long Id { get; set; }

    [Required]
    public string UserId { get; set; } = default!;
    public AppUser User { get; set; } = default!;

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>Filter: match emails from this sender address. At least one of SenderAddress or SubjectPattern must be set.</summary>
    [MaxLength(255)]
    public string? SenderAddress { get; set; }

    /// <summary>Filter: regex pattern to match against email subject.</summary>
    [MaxLength(500)]
    public string? SubjectPattern { get; set; }

    /// <summary>Fixed currency value. If set, overrides AI-extracted currency.</summary>
    public Currency? CurrencyFixed { get; set; }

    /// <summary>Fixed description for transactions created by this rule. If set, overrides AI-extracted description.</summary>
    [MaxLength(500)]
    public string? DescriptionFixed { get; set; }

    public TransactionType TransactionType { get; set; } = TransactionType.Expense;

    /// <summary>Optional category to assign to transactions created by this rule.</summary>
    public long? CategoryId { get; set; }
    public Category? Category { get; set; }

    /// <summary>Priority for rule matching. Lower values are matched first.</summary>
    public int Priority { get; set; } = 0;
}

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

    /// <summary>Regex to extract the transaction amount from the email body.</summary>
    [Required, MaxLength(500)]
    public string AmountRegex { get; set; } = string.Empty;

    /// <summary>Regex to extract the transaction date from the email body. If empty, uses email sent date.</summary>
    [MaxLength(500)]
    public string? DateRegex { get; set; }

    /// <summary>The date format string used to parse the extracted date (e.g. "dd/MM/yyyy"). Required if DateRegex is set.</summary>
    [MaxLength(50)]
    public string? DateFormat { get; set; }

    /// <summary>Fixed currency value. If set, CurrencyRegex is ignored.</summary>
    public Currency? CurrencyFixed { get; set; }

    /// <summary>Regex to extract currency from the email body. Used only if CurrencyFixed is null.</summary>
    [MaxLength(500)]
    public string? CurrencyRegex { get; set; }

    /// <summary>Fixed description for transactions created by this rule. If set, DescriptionRegex is ignored.</summary>
    [MaxLength(500)]
    public string? DescriptionFixed { get; set; }

    /// <summary>Regex to extract description from the email body. Used only if DescriptionFixed is null.</summary>
    [MaxLength(500)]
    public string? DescriptionRegex { get; set; }

    public TransactionType TransactionType { get; set; } = TransactionType.Expense;

    /// <summary>Optional category to assign to transactions created by this rule.</summary>
    public long? CategoryId { get; set; }
    public Category? Category { get; set; }

    /// <summary>Priority for rule matching. Lower values are matched first.</summary>
    public int Priority { get; set; } = 0;
}

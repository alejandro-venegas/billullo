using System.ComponentModel.DataAnnotations;

namespace Billullo.Api.DTOs;

// ── Auth ──

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record RefreshRequest(
    [Required] string RefreshToken
);

public record AuthResponse(
    string Token,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User
);

public record UserDto
{
    public string Id { get; init; } = default!;
    public string Email { get; init; } = default!;
}

// ── Transaction ──

public record TransactionDto
{
    public long Id { get; init; }
    public DateTime Date { get; init; }
    public string Description { get; init; } = default!;
    public long? CategoryId { get; init; }
    public string? CategoryName { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = default!;
    public string Type { get; init; } = default!;
    public string Source { get; init; } = default!;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record CreateTransactionRequest(
    [Required] DateTime Date,
    [Required, MaxLength(500)] string Description,
    long? CategoryId,
    [Required] decimal Amount,
    [Required] string Currency,
    [Required] string Type
);

public record UpdateTransactionRequest(
    [Required] DateTime Date,
    [Required, MaxLength(500)] string Description,
    long? CategoryId,
    [Required] decimal Amount,
    [Required] string Currency,
    [Required] string Type
);

public record TransactionFilterParams(
    string? Type = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    string? Search = null,
    int Page = 1,
    int PageSize = 25
);

public record PaginatedResponse<T>(
    IEnumerable<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

// ── Category ──

public record CategoryDto
{
    public long Id { get; init; }
    public string Name { get; init; } = default!;
    public long? ParentCategoryId { get; init; }
    public string? Color { get; init; }
    public int RuleCount { get; init; }
    public int TransactionCount { get; init; }
}

public record CreateCategoryRequest(
    [Required, MaxLength(100)] string Name,
    long? ParentCategoryId,
    [MaxLength(7)] string? Color
);

public record UpdateCategoryRequest(
    [Required, MaxLength(100)] string Name,
    [MaxLength(7)] string? Color
);

// ── CategoryRule ──

public record CategoryRuleDto
{
    public long Id { get; init; }
    public string Pattern { get; init; } = default!;
    public long CategoryId { get; init; }
    public string? CategoryName { get; init; }
}

public record CreateCategoryRuleRequest(
    [Required, MaxLength(500)] string Pattern,
    [Required] long CategoryId
);

public record UpdateCategoryRuleRequest(
    [Required, MaxLength(500)] string Pattern,
    [Required] long CategoryId
);

public record RuleMatchResult(
    long? CategoryId,
    string? CategoryName,
    bool Conflicts,
    IEnumerable<CategoryRuleDto> Matches
);

// ── EmailConfig ──

public record EmailConfigDto
{
    public long Id { get; init; }
    public string ImapHost { get; init; } = default!;
    public int ImapPort { get; init; }
    public string EmailAddress { get; init; } = default!;
    public bool HasPassword { get; init; }
    public bool UseSsl { get; init; }
    public bool Enabled { get; init; }
}

public record UpsertEmailConfigRequest(
    [Required, MaxLength(255)] string ImapHost,
    [Required] int ImapPort,
    [Required, EmailAddress, MaxLength(255)] string EmailAddress,
    [MaxLength(500)] string? Password, // null means keep existing
    bool UseSsl = true,
    bool Enabled = false
);

public record TestEmailConfigRequest(
    [Required, MaxLength(255)] string ImapHost,
    [Required] int ImapPort,
    [Required, EmailAddress, MaxLength(255)] string EmailAddress,
    [Required, MaxLength(500)] string Password,
    bool UseSsl = true
);

public record TestConnectionResult(
    bool Success,
    string? Error
);

// ── EmailParsingRule ──

public record EmailParsingRuleDto
{
    public long Id { get; init; }
    public string Name { get; init; } = default!;
    public string? SenderAddress { get; init; }
    public string? SubjectPattern { get; init; }
    public string AmountRegex { get; init; } = default!;
    public string? DateRegex { get; init; }
    public string? DateFormat { get; init; }
    public string? CurrencyFixed { get; init; }
    public string? CurrencyRegex { get; init; }
    public string? DescriptionFixed { get; init; }
    public string? DescriptionRegex { get; init; }
    public string TransactionType { get; init; } = default!;
    public long? CategoryId { get; init; }
    public string? CategoryName { get; init; }
    public int Priority { get; init; }
}

public record CreateEmailParsingRuleRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(255)] string? SenderAddress,
    [MaxLength(500)] string? SubjectPattern,
    [Required, MaxLength(500)] string AmountRegex,
    [MaxLength(500)] string? DateRegex,
    [MaxLength(50)] string? DateFormat,
    string? CurrencyFixed,
    [MaxLength(500)] string? CurrencyRegex,
    [MaxLength(500)] string? DescriptionFixed,
    [MaxLength(500)] string? DescriptionRegex,
    [Required] string TransactionType,
    long? CategoryId,
    int Priority = 0
);

public record UpdateEmailParsingRuleRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(255)] string? SenderAddress,
    [MaxLength(500)] string? SubjectPattern,
    [Required, MaxLength(500)] string AmountRegex,
    [MaxLength(500)] string? DateRegex,
    [MaxLength(50)] string? DateFormat,
    string? CurrencyFixed,
    [MaxLength(500)] string? CurrencyRegex,
    [MaxLength(500)] string? DescriptionFixed,
    [MaxLength(500)] string? DescriptionRegex,
    [Required] string TransactionType,
    long? CategoryId,
    int Priority = 0
);

public record TestEmailParsingRuleRequest(
    [Required] string EmailBody,
    [Required] string EmailSubject,
    [Required] string SenderAddress,
    [Required, MaxLength(500)] string AmountRegex,
    [MaxLength(500)] string? DateRegex,
    [MaxLength(50)] string? DateFormat,
    string? CurrencyFixed,
    string? CurrencyRegex,
    string? DescriptionFixed,
    string? DescriptionRegex
);

public record TestEmailParsingResult(
    bool Matched,
    decimal? Amount,
    DateTime? Date,
    string? Currency,
    string? Description,
    string? Error
);

// ── Test Scrape ──

public record TestScrapeResult(
    bool Success,
    List<ScrapedEmail>? Emails,
    string? Error
);

public record ScrapedEmail(
    uint Uid,
    string From,
    DateTimeOffset Date,
    string Subject,
    string BodyPreview,
    ParsedTransactionPreview? ParsedTransaction,
    List<string>? MatchLog
);

public record ParsedTransactionPreview(
    decimal? Amount,
    DateTime? Date,
    string? Currency,
    string? Description,
    string MatchedRuleName
);

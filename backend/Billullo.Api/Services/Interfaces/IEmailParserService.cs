using Billullo.Api.DTOs;
using Billullo.Api.Models;

namespace Billullo.Api.Services.Interfaces;

public interface IEmailParserService
{
    /// <summary>
    /// Parses an email body using AI and returns extracted transaction fields
    /// (amount, date/time, currency, description) and optionally matches an account.
    /// </summary>
    Task<TestEmailParsingResult> ParseEmailAsync(
        string emailBody,
        DateTime? fallbackDate = null,
        IReadOnlyList<Account>? candidateAccounts = null
    );
}

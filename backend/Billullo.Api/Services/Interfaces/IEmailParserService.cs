using Billullo.Api.DTOs;

namespace Billullo.Api.Services.Interfaces;

public interface IEmailParserService
{
    /// <summary>
    /// Parses an email body using AI and returns extracted transaction fields
    /// (amount, date/time, currency, description).
    /// </summary>
    Task<TestEmailParsingResult> ParseEmailAsync(
        string emailBody,
        DateTime? fallbackDate = null
    );
}

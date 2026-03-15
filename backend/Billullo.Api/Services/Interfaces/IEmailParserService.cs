using Billullo.Api.DTOs;

namespace Billullo.Api.Services.Interfaces;

public interface IEmailParserService
{
    /// <summary>
    /// Parses an email body using the provided regex patterns and returns extracted transaction fields.
    /// </summary>
    TestEmailParsingResult ParseEmail(
        string emailBody,
        string amountRegex,
        string? dateRegex,
        string? dateFormat,
        string? currencyFixed,
        string? currencyRegex,
        string? descriptionFixed,
        string? descriptionRegex,
        DateTime? fallbackDate = null
    );
}

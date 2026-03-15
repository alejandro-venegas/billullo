using System.Globalization;
using System.Text.RegularExpressions;
using Billullo.Api.DTOs;
using Billullo.Api.Models;
using Billullo.Api.Services.Interfaces;

namespace Billullo.Api.Services;

public class EmailParserService : IEmailParserService
{
    public TestEmailParsingResult ParseEmail(
        string emailBody,
        string amountRegex,
        string? dateRegex,
        string? dateFormat,
        string? currencyFixed,
        string? currencyRegex,
        string? descriptionFixed,
        string? descriptionRegex,
        DateTime? fallbackDate = null)
    {
        try
        {
            // Extract amount
            var amountMatch = Regex.Match(emailBody, amountRegex, RegexOptions.IgnoreCase, TimeSpan.FromSeconds(1));
            if (!amountMatch.Success)
                return new TestEmailParsingResult(false, null, null, null, null, "Amount regex did not match.");

            var amountStr = amountMatch.Groups.Count > 1 ? amountMatch.Groups[1].Value : amountMatch.Value;
            amountStr = amountStr.Replace(",", "").Trim();
            if (!decimal.TryParse(amountStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount))
                return new TestEmailParsingResult(false, null, null, null, null, $"Could not parse amount: '{amountStr}'");

            // Extract date
            DateTime? date = null;
            if (!string.IsNullOrEmpty(dateRegex) && !string.IsNullOrEmpty(dateFormat))
            {
                var dateMatch = Regex.Match(emailBody, dateRegex, RegexOptions.IgnoreCase, TimeSpan.FromSeconds(1));
                if (!dateMatch.Success)
                    return new TestEmailParsingResult(false, amount, null, null, null, "Date regex did not match.");

                var dateStr = dateMatch.Groups.Count > 1 ? dateMatch.Groups[1].Value : dateMatch.Value;
                if (!DateTime.TryParseExact(dateStr.Trim(), dateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
                    return new TestEmailParsingResult(false, amount, null, null, null, $"Could not parse date '{dateStr}' with format '{dateFormat}'");

                date = parsedDate;
            }
            else if (fallbackDate.HasValue)
            {
                date = fallbackDate.Value;
            }

            // Extract currency
            string? currency = null;
            if (!string.IsNullOrEmpty(currencyFixed))
            {
                currency = currencyFixed;
            }
            else if (!string.IsNullOrEmpty(currencyRegex))
            {
                var currMatch = Regex.Match(emailBody, currencyRegex, RegexOptions.IgnoreCase, TimeSpan.FromSeconds(1));
                if (currMatch.Success)
                    currency = (currMatch.Groups.Count > 1 ? currMatch.Groups[1].Value : currMatch.Value).Trim();
            }

            // Extract description
            string? description = null;
            if (!string.IsNullOrEmpty(descriptionFixed))
            {
                description = descriptionFixed;
            }
            else if (!string.IsNullOrEmpty(descriptionRegex))
            {
                var descMatch = Regex.Match(emailBody, descriptionRegex, RegexOptions.IgnoreCase, TimeSpan.FromSeconds(1));
                if (descMatch.Success)
                    description = (descMatch.Groups.Count > 1 ? descMatch.Groups[1].Value : descMatch.Value).Trim();
            }

            return new TestEmailParsingResult(true, amount, date, currency, description, null);
        }
        catch (RegexMatchTimeoutException)
        {
            return new TestEmailParsingResult(false, null, null, null, null, "Regex timed out — pattern may be too complex.");
        }
        catch (ArgumentException ex)
        {
            return new TestEmailParsingResult(false, null, null, null, null, $"Invalid regex: {ex.Message}");
        }
    }
}

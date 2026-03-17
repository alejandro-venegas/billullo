using System.Globalization;
using System.Text.Json;
using Billullo.Api.DTOs;
using Billullo.Api.Services.Interfaces;
using OpenAI.Chat;

namespace Billullo.Api.Services;

public class AiEmailParserService : IEmailParserService
{
    private readonly ChatClient _chatClient;
    private readonly ILogger<AiEmailParserService> _logger;

    private static readonly ChatCompletionOptions CompletionOptions = new()
    {
        ResponseFormat = ChatResponseFormat.CreateJsonSchemaFormat(
            jsonSchemaFormatName: "email_transaction",
            jsonSchema: BinaryData.FromBytes("""
                {
                    "type": "object",
                    "properties": {
                        "found": {
                            "type": "boolean",
                            "description": "Whether a financial transaction was found in the email"
                        },
                        "amount": {
                            "type": ["number", "null"],
                            "description": "The transaction amount as a decimal number (e.g. 1234.56)"
                        },
                        "currency": {
                            "type": ["string", "null"],
                            "description": "ISO 4217 three-letter currency code (e.g. USD, CRC, EUR)"
                        },
                        "date_time": {
                            "type": ["string", "null"],
                            "description": "Transaction date and time in ISO 8601 format. Include time if available (e.g. 2025-03-16T14:30:00), otherwise date only (e.g. 2025-03-16)"
                        },
                        "description": {
                            "type": ["string", "null"],
                            "description": "Merchant name, payee, or short transaction description"
                        }
                    },
                    "required": ["found", "amount", "currency", "date_time", "description"],
                    "additionalProperties": false
                }
                """u8.ToArray()),
            jsonSchemaIsStrict: true),
    };

    private static readonly SystemChatMessage SystemPrompt = new(
        """
        You are a financial email parser. Given the text body of a bank or financial notification email,
        extract the transaction details. Return:
        - found: true if this email contains a financial transaction, false otherwise
        - amount: the transaction amount as a number (no currency symbols, no thousand separators)
        - currency: the ISO 4217 three-letter currency code (e.g. USD, CRC, EUR)
        - date_time: the transaction date and time in ISO 8601 format; include time if present in the email
        - description: the merchant name, payee, or a short description of the transaction

        If the email does not contain transaction information, set found to false and all other fields to null.
        """);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    public AiEmailParserService(ChatClient chatClient, ILogger<AiEmailParserService> logger)
    {
        _chatClient = chatClient;
        _logger = logger;
    }

    public async Task<TestEmailParsingResult> ParseEmailAsync(string emailBody, DateTime? fallbackDate = null)
    {
        try
        {
            ChatCompletion completion = await _chatClient.CompleteChatAsync(
                [SystemPrompt, new UserChatMessage(emailBody)],
                CompletionOptions);

            if (!string.IsNullOrEmpty(completion.Refusal))
                return new TestEmailParsingResult(false, null, null, null, null,
                    $"AI refused: {completion.Refusal}");

            var json = completion.Content[0].Text;

            _logger.LogDebug("AI extraction response: {Json}", json);

            var parsed = JsonSerializer.Deserialize<AiExtractionResult>(json, JsonOptions);

            if (parsed is null)
                return new TestEmailParsingResult(false, null, null, null, null, "AI returned unparseable response.");

            if (!parsed.Found)
                return new TestEmailParsingResult(false, null, null, null, null, "No transaction found in email.");

            DateTime? date = null;
            if (!string.IsNullOrEmpty(parsed.DateTime))
            {
                if (System.DateTime.TryParse(parsed.DateTime, CultureInfo.InvariantCulture,
                        DateTimeStyles.None, out var parsedDate))
                    date = parsedDate;
            }
            date ??= fallbackDate;

            return new TestEmailParsingResult(
                true,
                parsed.Amount,
                date,
                parsed.Currency,
                parsed.Description,
                null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI email parsing failed");
            return new TestEmailParsingResult(false, null, null, null, null, $"AI parsing error: {ex.Message}");
        }
    }

    private sealed class AiExtractionResult
    {
        public bool Found { get; set; }
        public decimal? Amount { get; set; }
        public string? Currency { get; set; }
        public string? DateTime { get; set; }
        public string? Description { get; set; }
    }
}

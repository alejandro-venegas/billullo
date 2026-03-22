using System.Globalization;
using System.Text.Json;
using Billullo.Api.DTOs;
using Billullo.Api.Models;
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
                        },
                        "account_id": {
                            "type": ["integer", "null"],
                            "description": "The ID of the matched account from the provided list, or null if no account matches"
                        }
                    },
                    "required": ["found", "amount", "currency", "date_time", "description", "account_id"],
                    "additionalProperties": false
                }
                """u8.ToArray()),
            jsonSchemaIsStrict: true),
    };

    private const string BaseSystemPrompt =
        """
        You are a financial email parser. Given the text body of a bank or financial notification email,
        extract the transaction details. Return:
        - found: true if this email contains a financial transaction, false otherwise
        - amount: the transaction amount as a number (no currency symbols, no thousand separators)
        - currency: the ISO 4217 three-letter currency code (e.g. USD, CRC, EUR)
        - date_time: the transaction date and time in ISO 8601 format; include time if present in the email
        - description: the merchant name, payee, or a short description of the transaction

        If the email does not contain transaction information, set found to false and all other fields to null.
        """;

    private const string AccountMatchingInstructions =
        """

        You will also be given a list of accounts, each with an "Identifier" that may be a card number
        (full or partial), bank account number, bank name, institution name, or any other identifying text.
        Determine which account the email belongs to by checking whether the email references the account's
        identifier. The match does not need to be exact — partial card numbers (e.g. last 4 digits),
        variations of a bank name, or other fuzzy matches should still count. Use your best judgement.
        If no account is a clear match, return null for account_id.
        """;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    public AiEmailParserService(ChatClient chatClient, ILogger<AiEmailParserService> logger)
    {
        _chatClient = chatClient;
        _logger = logger;
    }

    public async Task<TestEmailParsingResult> ParseEmailAsync(
        string emailBody, DateTime? fallbackDate = null, IReadOnlyList<Account>? candidateAccounts = null)
    {
        try
        {
            var systemPrompt = BaseSystemPrompt;
            var userMessage = emailBody;

            if (candidateAccounts is { Count: > 0 })
            {
                systemPrompt += AccountMatchingInstructions;
                var accountList = string.Join("\n",
                    candidateAccounts.Select(a => $"- ID: {a.Id}, Name: \"{a.Name}\", Identifier: \"{a.Identifier}\""));
                userMessage = $"Accounts:\n{accountList}\n\nEmail body:\n{emailBody}";
            }

            ChatCompletion completion = await _chatClient.CompleteChatAsync(
                [new SystemChatMessage(systemPrompt), new UserChatMessage(userMessage)],
                CompletionOptions);

            if (!string.IsNullOrEmpty(completion.Refusal))
                return new TestEmailParsingResult(false, null, null, null, null, null,
                    $"AI refused: {completion.Refusal}");

            var json = completion.Content[0].Text;

            _logger.LogDebug("AI extraction response: {Json}", json);

            var parsed = JsonSerializer.Deserialize<AiExtractionResult>(json, JsonOptions);

            if (parsed is null)
                return new TestEmailParsingResult(false, null, null, null, null, null, "AI returned unparseable response.");

            if (!parsed.Found)
                return new TestEmailParsingResult(false, null, null, null, null, null, "No transaction found in email.");

            DateTime? date = null;
            if (!string.IsNullOrEmpty(parsed.DateTime))
            {
                if (System.DateTime.TryParse(parsed.DateTime, CultureInfo.InvariantCulture,
                        DateTimeStyles.None, out var parsedDate))
                    date = parsedDate;
            }
            date ??= fallbackDate;

            // Validate that the returned account ID is actually in the candidate list
            long? accountId = null;
            if (parsed.AccountId != null && candidateAccounts != null)
            {
                if (candidateAccounts.Any(a => a.Id == parsed.AccountId))
                    accountId = parsed.AccountId;
                else
                    _logger.LogWarning("AI returned account ID {AccountId} not in candidate list", parsed.AccountId);
            }

            return new TestEmailParsingResult(
                true,
                parsed.Amount,
                date,
                parsed.Currency,
                parsed.Description,
                accountId,
                null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI email parsing failed");
            return new TestEmailParsingResult(false, null, null, null, null, null, $"AI parsing error: {ex.Message}");
        }
    }

    private sealed class AiExtractionResult
    {
        public bool Found { get; set; }
        public decimal? Amount { get; set; }
        public string? Currency { get; set; }
        public string? DateTime { get; set; }
        public string? Description { get; set; }
        public long? AccountId { get; set; }
    }
}

using System.Text.RegularExpressions;
using AutoMapper;
using Billullo.Api.Data;
using Billullo.Api.DTOs;
using Billullo.Api.Models;
using Billullo.Api.Services.Interfaces;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using MailKit.Security;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;

namespace Billullo.Api.Services;

public class EmailConfigService : IEmailConfigService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IDataProtector _protector;
    private readonly IEmailParserService _parserService;
    private readonly IEmailScrapingControl _scrapingControl;
    private readonly ILogger<EmailConfigService> _logger;

    public EmailConfigService(
        AppDbContext db,
        IMapper mapper,
        IDataProtectionProvider dataProtection,
        IEmailParserService parserService,
        IEmailScrapingControl scrapingControl,
        ILogger<EmailConfigService> logger)
    {
        _db = db;
        _mapper = mapper;
        _protector = dataProtection.CreateProtector("EmailConfig.Password");
        _parserService = parserService;
        _scrapingControl = scrapingControl;
        _logger = logger;
    }

    public async Task<EmailConfigDto?> GetAsync(string userId)
    {
        var config = await _db.EmailConfigs
            .FirstOrDefaultAsync(ec => ec.UserId == userId);

        return config == null ? null : _mapper.Map<EmailConfigDto>(config);
    }

    public async Task<EmailConfigDto> UpsertAsync(string userId, UpsertEmailConfigRequest request)
    {
        var existing = await _db.EmailConfigs
            .FirstOrDefaultAsync(ec => ec.UserId == userId);

        if (existing == null)
        {
            existing = new EmailConfig
            {
                UserId = userId
            };
            _db.EmailConfigs.Add(existing);
        }

        existing.ImapHost = request.ImapHost;
        existing.ImapPort = request.ImapPort;
        existing.EmailAddress = request.EmailAddress;
        existing.UseSsl = request.UseSsl;
        existing.Enabled = request.Enabled;

        // Only update password if provided (null means keep existing)
        if (!string.IsNullOrEmpty(request.Password))
        {
            existing.EncryptedPassword = _protector.Protect(request.Password);
        }

        await _db.SaveChangesAsync();
        _scrapingControl.NotifyConfigChanged(userId);
        return _mapper.Map<EmailConfigDto>(existing);
    }

    public async Task<bool> DeleteAsync(string userId)
    {
        var config = await _db.EmailConfigs
            .FirstOrDefaultAsync(ec => ec.UserId == userId);

        if (config == null) return false;

        _db.EmailConfigs.Remove(config);
        await _db.SaveChangesAsync();
        _scrapingControl.NotifyConfigChanged(userId);
        return true;
    }

    public async Task<TestConnectionResult> TestConnectionAsync(TestEmailConfigRequest request)
    {
        try
        {
            using var client = new ImapClient();
            var secureSocketOptions = request.UseSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable;

            await client.ConnectAsync(request.ImapHost, request.ImapPort, secureSocketOptions);

            await client.AuthenticateAsync(request.EmailAddress, request.Password);
            await client.DisconnectAsync(true);

            return new TestConnectionResult(true, null);
        }
        catch (Exception ex)
        {
            return new TestConnectionResult(false, ex.Message);
        }
    }

    public async Task<TestScrapeResult> TestScrapeAsync(string userId)
    {
        try
        {
            var config = await _db.EmailConfigs
                .FirstOrDefaultAsync(ec => ec.UserId == userId);

            if (config == null)
                return new TestScrapeResult(false, null, "No email configuration found");

            if (string.IsNullOrEmpty(config.EncryptedPassword))
                return new TestScrapeResult(false, null, "No password configured");

            var password = _protector.Unprotect(config.EncryptedPassword);

            using var client = new ImapClient();
            var sslOptions = config.UseSsl
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.StartTlsWhenAvailable;

            await client.ConnectAsync(config.ImapHost, config.ImapPort, sslOptions);
            await client.AuthenticateAsync(config.EmailAddress, password);

            var inbox = client.Inbox;
            await inbox.OpenAsync(FolderAccess.ReadOnly);

            // Fetch the last 10 emails
            var allUids = await inbox.SearchAsync(SearchQuery.All);
            var recentUids = allUids.OrderByDescending(u => u.Id).Take(10).ToList();

            // Load parsing rules for this user
            var parsingRules = await _db.EmailParsingRules
                .Where(r => r.UserId == userId)
                .OrderBy(r => r.Priority)
                .ToListAsync();

            var emails = new List<ScrapedEmail>();

            foreach (var uid in recentUids)
            {
                var message = await inbox.GetMessageAsync(uid);
                var sender = message.From.Mailboxes.FirstOrDefault()?.Address ?? string.Empty;
                var subject = message.Subject ?? string.Empty;
                var body = message.TextBody ?? message.HtmlBody ?? string.Empty;

                var bodyPreview = body.Length > 500 ? body[..500] + "..." : body;

                ParsedTransactionPreview? parsed = null;
                var matchLog = new List<string>();

                if (parsingRules.Count == 0)
                {
                    matchLog.Add("No parsing rules configured");
                }

                foreach (var rule in parsingRules)
                {
                    if (!string.IsNullOrEmpty(rule.SenderAddress) &&
                        !sender.Contains(rule.SenderAddress, StringComparison.OrdinalIgnoreCase))
                    {
                        matchLog.Add($"Rule '{rule.Name}': sender '{sender}' doesn't contain '{rule.SenderAddress}'");
                        continue;
                    }

                    if (!string.IsNullOrEmpty(rule.SubjectPattern))
                    {
                        try
                        {
                            if (!Regex.IsMatch(subject, rule.SubjectPattern,
                                RegexOptions.IgnoreCase, TimeSpan.FromSeconds(1)))
                            {
                                matchLog.Add($"Rule '{rule.Name}': subject '{subject}' didn't match pattern '{rule.SubjectPattern}'");
                                continue;
                            }
                        }
                        catch (Exception ex)
                        {
                            matchLog.Add($"Rule '{rule.Name}': subject regex error: {ex.Message}");
                            continue;
                        }
                    }

                    matchLog.Add($"Rule '{rule.Name}': sender/subject filters passed, running AI parser...");

                    var result = await _parserService.ParseEmailAsync(body, fallbackDate: message.Date.UtcDateTime);

                    if (result.Matched)
                    {
                        var currency = rule.CurrencyFixed?.ToString() ?? result.Currency;
                        var description = rule.DescriptionFixed ?? result.Description;

                        matchLog.Add($"Rule '{rule.Name}': MATCHED — amount={result.Amount}, date={result.Date}, currency={currency}, desc={description}");
                        parsed = new ParsedTransactionPreview(
                            Amount: result.Amount,
                            Date: result.Date,
                            Currency: currency,
                            Description: description,
                            MatchedRuleName: rule.Name
                        );
                        break;
                    }
                    else
                    {
                        matchLog.Add($"Rule '{rule.Name}': AI parser failed — {result.Error}");
                    }
                }

                emails.Add(new ScrapedEmail(
                    Uid: uid.Id,
                    From: sender,
                    Date: message.Date,
                    Subject: subject,
                    BodyPreview: bodyPreview,
                    ParsedTransaction: parsed,
                    MatchLog: matchLog
                ));
            }

            await client.DisconnectAsync(true);

            _logger.LogInformation(
                "Test scrape for user {UserId}: fetched {Count} emails, {Parsed} matched rules",
                userId, emails.Count, emails.Count(e => e.ParsedTransaction != null));

            return new TestScrapeResult(true, emails, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Test scrape failed for user {UserId}", userId);
            return new TestScrapeResult(false, null, ex.Message);
        }
    }

    /// <summary>
    /// Decrypts the stored password for a given EmailConfig. Used internally by the email scraping service.
    /// </summary>
    public string DecryptPassword(string encryptedPassword)
    {
        return _protector.Unprotect(encryptedPassword);
    }
}

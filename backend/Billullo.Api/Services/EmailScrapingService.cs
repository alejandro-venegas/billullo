using System.Text.RegularExpressions;
using System.Threading.Channels;
using Billullo.Api.Data;
using Billullo.Api.Hubs;
using Billullo.Api.Models;
using Billullo.Api.Services.Interfaces;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using MailKit.Security;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MimeKit;

namespace Billullo.Api.Services;

/// <summary>
/// Background service that monitors email inboxes via IMAP IDLE for new bank transaction emails.
/// For each user with an enabled EmailConfig, it maintains an IMAP connection and creates
/// transactions automatically when matching emails arrive.
/// </summary>
public class EmailScrapingService : BackgroundService, IEmailScrapingControl
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<BillulloHub> _hubContext;
    private readonly ILogger<EmailScrapingService> _logger;

    // Track active connections per user
    private readonly Dictionary<string, CancellationTokenSource> _userConnections = new();
    private readonly object _lock = new();

    // Channel used to wake the main loop immediately when a config changes,
    // instead of waiting for the next 60-second periodic tick.
    private readonly Channel<string> _configChangedChannel =
        Channel.CreateBounded<string>(new BoundedChannelOptions(256) { FullMode = BoundedChannelFullMode.DropOldest });

    public void NotifyConfigChanged(string userId) =>
        _configChangedChannel.Writer.TryWrite(userId);

    public EmailScrapingService(IServiceScopeFactory scopeFactory, IHubContext<BillulloHub> hubContext, ILogger<EmailScrapingService> logger)
    {
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Email scraping service starting...");

        // Wait briefly for app startup to complete
        await Task.Delay(5000, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RefreshConnectionsAsync(stoppingToken);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Error refreshing email connections.");
            }

            // Wait up to 60 seconds, but wake immediately if a config-change
            // notification arrives via NotifyConfigChanged().
            try
            {
                using var tickCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                tickCts.CancelAfter(TimeSpan.FromSeconds(60));
                await _configChangedChannel.Reader.ReadAsync(tickCts.Token);
                // Drain any additional signals that queued up during processing.
                while (_configChangedChannel.Reader.TryRead(out _)) { }
            }
            catch (OperationCanceledException)
            {
                if (stoppingToken.IsCancellationRequested) break;
                // 60-second tick expired — normal periodic refresh.
            }
        }

        // Cleanup
        lock (_lock)
        {
            foreach (var cts in _userConnections.Values)
                cts.Cancel();
            _userConnections.Clear();
        }
    }

    private async Task RefreshConnectionsAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var enabledConfigs = await db.EmailConfigs
            .Where(ec => ec.Enabled)
            .ToListAsync(stoppingToken);

        var enabledUserIds = enabledConfigs.Select(c => c.UserId).ToHashSet();

        lock (_lock)
        {
            // Stop connections for users who disabled their config
            var toRemove = _userConnections.Keys.Except(enabledUserIds).ToList();
            foreach (var userId in toRemove)
            {
                _logger.LogInformation("Stopping email monitoring for user {UserId}", userId);
                _userConnections[userId].Cancel();
                _userConnections.Remove(userId);
            }
        }

        // Start connections for new enabled configs
        foreach (var config in enabledConfigs)
        {
            bool alreadyRunning;
            lock (_lock)
            {
                alreadyRunning = _userConnections.ContainsKey(config.UserId);
            }

            if (!alreadyRunning)
            {
                var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                lock (_lock)
                {
                    _userConnections[config.UserId] = cts;
                }

                _ = Task.Run(() => MonitorMailboxAsync(config.UserId, cts.Token), cts.Token);
            }
        }
    }

    private async Task MonitorMailboxAsync(string userId, CancellationToken cancellationToken)
    {
        var retryDelay = TimeSpan.FromSeconds(10);
        const int maxRetryDelay = 300; // 5 minutes max

        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var dataProtection = scope.ServiceProvider.GetRequiredService<IDataProtectionProvider>();
                var protector = dataProtection.CreateProtector("EmailConfig.Password");
                var parser = scope.ServiceProvider.GetRequiredService<IEmailParserService>();
                var accountService = scope.ServiceProvider.GetRequiredService<IAccountService>();
                var currencyService = scope.ServiceProvider.GetRequiredService<ICurrencyService>();

                var config = await db.EmailConfigs
                    .FirstOrDefaultAsync(ec => ec.UserId == userId && ec.Enabled, cancellationToken);

                if (config == null)
                {
                    _logger.LogInformation("Email config disabled or removed for user {UserId}, stopping monitor.", userId);
                    break;
                }

                string password;
                try
                {
                    password = protector.Unprotect(config.EncryptedPassword);
                }
                catch
                {
                    _logger.LogError("Failed to decrypt password for user {UserId}", userId);
                    break;
                }

                using var imapClient = new ImapClient();
                var secureSocketOptions = config.UseSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable;

                await imapClient.ConnectAsync(config.ImapHost, config.ImapPort, secureSocketOptions, cancellationToken);

                await imapClient.AuthenticateAsync(config.EmailAddress, password, cancellationToken);

                _logger.LogInformation("Connected to IMAP for user {UserId} at {Host}", userId, config.ImapHost);
                retryDelay = TimeSpan.FromSeconds(10); // Reset retry delay on successful connection

                var inbox = imapClient.Inbox;
                await inbox.OpenAsync(FolderAccess.ReadOnly, cancellationToken);

                // Process any unread emails since last check
                await ProcessNewEmailsAsync(db, parser, accountService, currencyService, inbox, config, cancellationToken);

                // Enter IDLE loop
                while (!cancellationToken.IsCancellationRequested)
                {
                    // Use IDLE if supported, otherwise poll
                    if (imapClient.Capabilities.HasFlag(ImapCapabilities.Idle))
                    {
                        using var idleDone = new CancellationTokenSource();
                        var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, idleDone.Token);

                        // Register for count changes
                        var countChanged = false;
                        inbox.CountChanged += (s, e) =>
                        {
                            countChanged = true;
                            idleDone.Cancel();
                        };

                        try
                        {
                            // IDLE for up to 9 minutes (IMAP servers often timeout at 30 min, we re-idle frequently)
                            _ = Task.Delay(TimeSpan.FromMinutes(9), cancellationToken).ContinueWith(_ => idleDone.Cancel(), TaskScheduler.Default);
                            await imapClient.IdleAsync(linkedCts.Token);
                        }
                        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
                        {
                            // IDLE was cancelled due to timeout or new message — normal flow
                        }

                        if (countChanged)
                        {
                            // Re-open scope for fresh DB context
                            using var innerScope = _scopeFactory.CreateScope();
                            var innerDb = innerScope.ServiceProvider.GetRequiredService<AppDbContext>();
                            var innerParser = innerScope.ServiceProvider.GetRequiredService<IEmailParserService>();
                            var innerAccountService = innerScope.ServiceProvider.GetRequiredService<IAccountService>();
                            var innerCurrencyService = innerScope.ServiceProvider.GetRequiredService<ICurrencyService>();

                            // Reload config for latest LastCheckedUid
                            var freshConfig = await innerDb.EmailConfigs
                                .FirstOrDefaultAsync(ec => ec.UserId == userId, cancellationToken);

                            if (freshConfig != null)
                                await ProcessNewEmailsAsync(innerDb, innerParser, innerAccountService, innerCurrencyService, inbox, freshConfig, cancellationToken);
                        }
                    }
                    else
                    {
                        // Fallback: poll every 2 minutes
                        await Task.Delay(TimeSpan.FromMinutes(2), cancellationToken);

                        using var innerScope = _scopeFactory.CreateScope();
                        var innerDb = innerScope.ServiceProvider.GetRequiredService<AppDbContext>();
                        var innerParser = innerScope.ServiceProvider.GetRequiredService<IEmailParserService>();
                        var innerAccountService = innerScope.ServiceProvider.GetRequiredService<IAccountService>();
                        var innerCurrencyService = innerScope.ServiceProvider.GetRequiredService<ICurrencyService>();

                        var freshConfig = await innerDb.EmailConfigs
                            .FirstOrDefaultAsync(ec => ec.UserId == userId, cancellationToken);

                        if (freshConfig != null)
                            await ProcessNewEmailsAsync(innerDb, innerParser, innerAccountService, innerCurrencyService, inbox, freshConfig, cancellationToken);
                    }
                }

                await imapClient.DisconnectAsync(true, cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Email connection error for user {UserId}, retrying in {Delay}s", userId, retryDelay.TotalSeconds);
                try
                {
                    await Task.Delay(retryDelay, cancellationToken);
                }
                catch (TaskCanceledException) { break; }

                // Exponential backoff
                retryDelay = TimeSpan.FromSeconds(Math.Min(retryDelay.TotalSeconds * 2, maxRetryDelay));
            }
        }

        lock (_lock)
        {
            _userConnections.Remove(userId);
        }
    }

    private async Task ProcessNewEmailsAsync(
        AppDbContext db,
        IEmailParserService parser,
        IAccountService accountService,
        ICurrencyService currencyService,
        IMailFolder inbox,
        EmailConfig config,
        CancellationToken cancellationToken)
    {
        try
        {
            var parsingRules = await db.EmailParsingRules
                .Where(r => r.UserId == config.UserId)
                .OrderBy(r => r.Priority)
                .ToListAsync(cancellationToken);

            if (parsingRules.Count == 0) return;

            // Find new messages since last check
            var allUids = await inbox.SearchAsync(SearchQuery.All, cancellationToken);
            IList<UniqueId> uids;
            if (config.LastCheckedUid.HasValue)
            {
                // Filter to only UIDs newer than the last processed one.
                // We avoid using UID range search with * because IMAP's * resolves to the
                // current max UID — if no new emails exist, the server swaps the range bounds
                // and returns the already-processed email (RFC 3501 §6.4.8).
                uids = allUids.Where(u => u.Id > config.LastCheckedUid.Value).ToList();
            }
            else
            {
                // First run: only process last 50 emails to avoid backfilling entire inbox
                uids = allUids;
                if (uids.Count > 50)
                    uids = uids.Skip(uids.Count - 50).ToList();
            }

            if (uids.Count == 0)
            {
                _logger.LogInformation("No new emails for user {UserId}", config.UserId);
                return;
            }

            _logger.LogInformation("Processing {Count} new emails for user {UserId}", uids.Count, config.UserId);

            uint maxUid = config.LastCheckedUid ?? 0;

            foreach (var uid in uids)
            {
                if (cancellationToken.IsCancellationRequested) break;

                try
                {
                    var message = await inbox.GetMessageAsync(uid, cancellationToken);
                    await TryCreateTransactionFromEmailAsync(db, parser, accountService, currencyService, config.UserId, message, parsingRules, cancellationToken);

                    if (uid.Id > maxUid)
                        maxUid = uid.Id;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error processing email UID {Uid} for user {UserId}", uid, config.UserId);
                }
            }

            // Update last checked UID
            if (maxUid > (config.LastCheckedUid ?? 0))
            {
                config.LastCheckedUid = maxUid;
                await db.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing emails for user {UserId}", config.UserId);
        }
    }

    private async Task<bool> TryCreateTransactionFromEmailAsync(
        AppDbContext db,
        IEmailParserService parser,
        IAccountService accountService,
        ICurrencyService currencyService,
        string userId,
        MimeMessage message,
        List<EmailParsingRule> parsingRules,
        CancellationToken cancellationToken)
    {
        var sender = message.From.Mailboxes.FirstOrDefault()?.Address ?? string.Empty;
        var subject = message.Subject ?? string.Empty;
        var body = message.TextBody ?? message.HtmlBody ?? string.Empty;

        foreach (var rule in parsingRules)
        {
            // Check sender match
            if (!string.IsNullOrEmpty(rule.SenderAddress) &&
                !sender.Contains(rule.SenderAddress, StringComparison.OrdinalIgnoreCase))
                continue;

            // Check subject match
            if (!string.IsNullOrEmpty(rule.SubjectPattern))
            {
                try
                {
                    if (!Regex.IsMatch(subject, rule.SubjectPattern, RegexOptions.IgnoreCase, TimeSpan.FromSeconds(1)))
                        continue;
                }
                catch
                {
                    continue;
                }
            }

            // Rule matched — parse the email and match account with AI in a single call
            var candidateAccounts = await db.Accounts
                .Where(a => a.UserId == userId && !a.IsDefault && a.Identifier != null)
                .OrderBy(a => a.Name)
                .ToListAsync();

            var result = await parser.ParseEmailAsync(body,
                fallbackDate: message.Date.UtcDateTime,
                candidateAccounts: candidateAccounts);

            if (!result.Matched || !result.Amount.HasValue || !result.Date.HasValue) continue;

            // Apply rule-level overrides, then parse currency
            var currencyStr = rule.CurrencyFixed?.ToString() ?? result.Currency;
            var currency = Currency.USD;
            if (!string.IsNullOrEmpty(currencyStr) && Enum.TryParse<Currency>(currencyStr, true, out var parsedCurrency))
                currency = parsedCurrency;

            var description = rule.DescriptionFixed ?? result.Description ?? subject;
            var amount = result.Amount.Value;

            // Use AI-matched account, or fall back to default
            var accountId = result.AccountId
                ?? (await db.Accounts.FirstAsync(a => a.UserId == userId && a.IsDefault)).Id;
            var account = await db.Accounts.FindAsync(accountId);

            // If account restricts currencies and transaction currency is not allowed, convert
            if (account != null && !string.IsNullOrEmpty(account.Currencies))
            {
                var allowed = account.Currencies
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(c => Enum.Parse<Currency>(c.Trim(), true))
                    .ToList();

                if (!allowed.Contains(currency))
                {
                    var targetCurrency = allowed.Count == 1
                        ? allowed[0]
                        : account.FallbackCurrency ?? allowed[0];

                    var from = currency.ToString();
                    var to = targetCurrency.ToString();

                    var rate = await currencyService.GetRateNearestToDateAsync(from, to, result.Date.Value)
                        ?? await currencyService.GetLatestRateAsync(from, to);

                    if (rate != null)
                    {
                        amount = Math.Round(amount * rate.Rate, 2);
                    }
                    else
                    {
                        var inverse = await currencyService.GetRateNearestToDateAsync(to, from, result.Date.Value)
                            ?? await currencyService.GetLatestRateAsync(to, from);
                        if (inverse != null && inverse.Rate != 0)
                            amount = Math.Round(amount / inverse.Rate, 2);
                    }

                    currency = targetCurrency;
                }
            }

            var transaction = new Transaction
            {
                UserId = userId,
                AccountId = accountId,
                Date = result.Date.Value,
                Description = description,
                CategoryId = rule.CategoryId,
                Amount = amount,
                Currency = currency,
                Type = rule.TransactionType,
                Source = TransactionSource.Email,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            db.Transactions.Add(transaction);
            await db.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Created transaction from email for user {UserId}: {Amount} {Currency} - {Description} (Account: {AccountId})",
                userId, transaction.Amount, transaction.Currency, transaction.Description, transaction.AccountId);

            await _hubContext.Clients.Group(userId).SendAsync("TransactionCreated", cancellationToken);

            return true; // Only first matching rule creates a transaction
        }

        return false;
    }

    public async Task ScrapeAsync(string userId, int count, CancellationToken ct = default)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var dataProtection = scope.ServiceProvider.GetRequiredService<IDataProtectionProvider>();
            var protector = dataProtection.CreateProtector("EmailConfig.Password");
            var parser = scope.ServiceProvider.GetRequiredService<IEmailParserService>();
            var accountService = scope.ServiceProvider.GetRequiredService<IAccountService>();
            var currencyService = scope.ServiceProvider.GetRequiredService<ICurrencyService>();

            var config = await db.EmailConfigs
                .FirstOrDefaultAsync(ec => ec.UserId == userId, ct);

            if (config == null)
            {
                await _hubContext.Clients.Group(userId).SendAsync("ScrapeError", new { message = "No email configuration found." }, ct);
                return;
            }

            string password;
            try { password = protector.Unprotect(config.EncryptedPassword); }
            catch
            {
                await _hubContext.Clients.Group(userId).SendAsync("ScrapeError", new { message = "Failed to decrypt email password." }, ct);
                return;
            }

            var parsingRules = await db.EmailParsingRules
                .Where(r => r.UserId == userId)
                .OrderBy(r => r.Priority)
                .ToListAsync(ct);

            if (parsingRules.Count == 0)
            {
                await _hubContext.Clients.Group(userId).SendAsync("ScrapeError", new { message = "No parsing rules configured." }, ct);
                return;
            }

            using var imapClient = new ImapClient();
            var sslOptions = config.UseSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable;
            await imapClient.ConnectAsync(config.ImapHost, config.ImapPort, sslOptions, ct);
            await imapClient.AuthenticateAsync(config.EmailAddress, password, ct);

            var inbox = imapClient.Inbox;
            await inbox.OpenAsync(FolderAccess.ReadOnly, ct);

            var allUids = await inbox.SearchAsync(SearchQuery.All, ct);
            var uids = allUids.Count > count
                ? allUids.Skip(allUids.Count - count).ToList()
                : allUids.ToList();

            var total = uids.Count;
            var processed = 0;
            var created = 0;
            uint maxUid = config.LastCheckedUid ?? 0;

            await _hubContext.Clients.Group(userId).SendAsync("ScrapeProgress", new { processed, total, created }, ct);

            foreach (var uid in uids)
            {
                if (ct.IsCancellationRequested) break;

                try
                {
                    var message = await inbox.GetMessageAsync(uid, ct);
                    var wasCreated = await TryCreateTransactionFromEmailAsync(
                        db, parser, accountService, currencyService, userId, message, parsingRules, ct);

                    processed++;
                    if (wasCreated) created++;
                    if (uid.Id > maxUid) maxUid = uid.Id;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error processing email UID {Uid} during scrape for user {UserId}", uid, userId);
                    processed++;
                }

                await _hubContext.Clients.Group(userId).SendAsync("ScrapeProgress", new { processed, total, created }, ct);
            }

            if (maxUid > (config.LastCheckedUid ?? 0))
            {
                config.LastCheckedUid = maxUid;
                await db.SaveChangesAsync(ct);
            }

            await imapClient.DisconnectAsync(true, ct);

            _logger.LogInformation("Backfill scrape for user {UserId}: processed={Processed}, created={Created}", userId, processed, created);
            await _hubContext.Clients.Group(userId).SendAsync("ScrapeDone", new { processed, created }, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Backfill scrape failed for user {UserId}", userId);
            await _hubContext.Clients.Group(userId).SendAsync("ScrapeError", new { message = ex.Message });
        }
    }
}

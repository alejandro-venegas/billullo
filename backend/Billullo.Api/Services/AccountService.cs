using AutoMapper;
using Billullo.Api.Data;
using Billullo.Api.DTOs;
using Billullo.Api.Models;
using Billullo.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Billullo.Api.Services;

public class AccountService : IAccountService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly ICurrencyService _currencyService;
    private readonly ILogger<AccountService> _logger;

    private static readonly Random _random = new();

    public AccountService(AppDbContext db, IMapper mapper, ICurrencyService currencyService, ILogger<AccountService> logger)
    {
        _db = db;
        _mapper = mapper;
        _currencyService = currencyService;
        _logger = logger;
    }

    public async Task<IEnumerable<AccountDto>> GetAllAsync(string userId)
    {
        var accounts = await _db.Accounts
            .Include(a => a.Transactions)
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenBy(a => a.Name)
            .ToListAsync();

        return _mapper.Map<List<AccountDto>>(accounts);
    }

    public async Task<AccountDto?> GetByIdAsync(string userId, long id)
    {
        var account = await _db.Accounts
            .Include(a => a.Transactions)
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        return account == null ? null : _mapper.Map<AccountDto>(account);
    }

    public async Task<AccountDto> CreateAsync(string userId, CreateAccountRequest request)
    {
        ValidateCurrencies(request.Currencies, request.FallbackCurrency);

        var account = new Account
        {
            UserId = userId,
            Name = request.Name,
            Description = request.Description,
            Identifier = request.Identifier,
            Color = request.Color ?? GenerateRandomColor(),
            Currencies = JoinCurrencies(request.Currencies),
            FallbackCurrency = ParseFallbackCurrency(request.FallbackCurrency),
            IsDefault = false
        };

        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Account '{Name}' created for user {UserId}", account.Name, userId);

        var created = await _db.Accounts
            .Include(a => a.Transactions)
            .FirstAsync(a => a.Id == account.Id);

        return _mapper.Map<AccountDto>(created);
    }

    public async Task<AccountDto?> UpdateAsync(string userId, long id, UpdateAccountRequest request)
    {
        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (account == null) return null;

        ValidateCurrencies(request.Currencies, request.FallbackCurrency);

        account.Name = request.Name;
        account.Description = request.Description;
        account.Identifier = request.Identifier;
        account.Color = request.Color ?? account.Color;
        account.Currencies = JoinCurrencies(request.Currencies);
        account.FallbackCurrency = ParseFallbackCurrency(request.FallbackCurrency);

        await _db.SaveChangesAsync();

        var updated = await _db.Accounts
            .Include(a => a.Transactions)
            .FirstAsync(a => a.Id == account.Id);

        return _mapper.Map<AccountDto>(updated);
    }

    public async Task<bool> DeleteAsync(string userId, long id, DeleteAccountRequest request)
    {
        var account = await _db.Accounts
            .Include(a => a.Transactions)
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (account == null) return false;
        if (account.IsDefault)
            throw new InvalidOperationException("Cannot delete the default account.");

        if (request.DeleteTransactions)
        {
            _db.Transactions.RemoveRange(account.Transactions);
        }
        else
        {
            // Move transactions to target account or default
            var targetId = request.TargetAccountId;
            if (targetId == null)
            {
                var defaultAccount = await _db.Accounts
                    .FirstAsync(a => a.UserId == userId && a.IsDefault);
                targetId = defaultAccount.Id;
            }

            var targetAccount = await _db.Accounts
                .FirstOrDefaultAsync(a => a.Id == targetId && a.UserId == userId);

            if (targetAccount == null)
                throw new InvalidOperationException("Target account not found.");

            var allowedCurrencies = GetAllowedCurrencies(targetAccount);

            foreach (var transaction in account.Transactions)
            {
                transaction.AccountId = targetAccount.Id;

                if (allowedCurrencies != null && !allowedCurrencies.Contains(transaction.Currency))
                {
                    var targetCurrency = GetConversionTarget(targetAccount);
                    var converted = await ConvertAmountAsync(
                        transaction.Amount, transaction.Currency, targetCurrency, transaction.Date);
                    transaction.Amount = converted;
                    transaction.Currency = targetCurrency;
                }
            }
        }

        _db.Accounts.Remove(account);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Account '{Name}' (id={Id}) deleted for user {UserId}", account.Name, id, userId);
        return true;
    }

    public async Task<TransactionDto> AdjustBalanceAsync(string userId, long accountId, AdjustBalanceRequest request)
    {
        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

        if (account == null)
            throw new InvalidOperationException("Account not found.");

        if (!Enum.TryParse<Currency>(request.Currency, true, out var currency))
            throw new ArgumentException($"Invalid currency: '{request.Currency}'");

        // Calculate current balance for this account and currency
        var currentBalance = await _db.Transactions
            .Where(t => t.AccountId == accountId && t.Currency == currency)
            .SumAsync(t => t.Type == TransactionType.Income ? t.Amount : -t.Amount);

        var diff = request.NewBalance - currentBalance;
        if (diff == 0)
            throw new InvalidOperationException("Balance is already at the requested value.");

        var transaction = new Transaction
        {
            UserId = userId,
            AccountId = accountId,
            Date = DateTime.UtcNow,
            Description = "Balance adjustment",
            Amount = Math.Abs(diff),
            Currency = currency,
            Type = diff > 0 ? TransactionType.Income : TransactionType.Expense,
            Source = request.Visible ? TransactionSource.Manual : TransactionSource.Adjustment,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();

        var created = await _db.Transactions
            .Include(t => t.Category)
            .Include(t => t.Account)
            .FirstAsync(t => t.Id == transaction.Id);

        return _mapper.Map<TransactionDto>(created);
    }

    public async Task<TransactionBalanceDto> GetAccountBalanceAsync(string userId, long accountId, string targetCurrency)
    {
        var transactions = await _db.Transactions
            .Where(t => t.UserId == userId && t.AccountId == accountId)
            .Select(t => new { t.Currency, t.Amount, t.Type })
            .ToListAsync();

        var breakdown = transactions
            .GroupBy(t => t.Currency.ToString())
            .Select(g => new CurrencyBalance(
                g.Key,
                g.Sum(t => t.Type == TransactionType.Income ? t.Amount : -t.Amount)
            ))
            .ToList();

        var rates = await GetConversionRatesAsync(targetCurrency);
        var total = 0m;

        foreach (var b in breakdown)
        {
            total += ConvertAmount(b.OriginalAmount, b.Currency, targetCurrency, rates);
        }

        return new TransactionBalanceDto(
            Math.Round(total, 2),
            targetCurrency,
            breakdown
        );
    }

    public async Task SeedDefaultAccountAsync(string userId)
    {
        var exists = await _db.Accounts.AnyAsync(a => a.UserId == userId && a.IsDefault);
        if (exists) return;

        var account = new Account
        {
            UserId = userId,
            Name = "Default",
            Description = "Default account",
            Color = "#9E9E9E",
            IsDefault = true
        };

        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();
    }

    // ── Helpers ──

    private static List<Currency>? GetAllowedCurrencies(Account account)
    {
        if (string.IsNullOrEmpty(account.Currencies)) return null;

        return account.Currencies
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(c => Enum.Parse<Currency>(c.Trim(), true))
            .ToList();
    }

    private static Currency GetConversionTarget(Account account)
    {
        var allowed = GetAllowedCurrencies(account);
        if (allowed == null) throw new InvalidOperationException("Account accepts any currency, no conversion needed.");

        if (allowed.Count == 1) return allowed[0];

        return account.FallbackCurrency
            ?? throw new InvalidOperationException("Account has multiple currencies but no fallback currency set.");
    }

    private async Task<decimal> ConvertAmountAsync(decimal amount, Currency fromCurrency, Currency toCurrency, DateTime transactionDate)
    {
        if (fromCurrency == toCurrency) return amount;

        var from = fromCurrency.ToString();
        var to = toCurrency.ToString();

        // Try direct rate nearest to date
        var rate = await _currencyService.GetRateNearestToDateAsync(from, to, transactionDate);
        if (rate != null) return Math.Round(amount * rate.Rate, 2);

        // Try inverse
        var inverse = await _currencyService.GetRateNearestToDateAsync(to, from, transactionDate);
        if (inverse != null && inverse.Rate != 0) return Math.Round(amount / inverse.Rate, 2);

        _logger.LogWarning("No exchange rate found for {From}->{To}, returning original amount", from, to);
        return amount;
    }

    private async Task<Dictionary<string, decimal>> GetConversionRatesAsync(string targetCurrency)
    {
        var rates = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

        foreach (var currency in Enum.GetNames<Currency>())
        {
            if (string.Equals(currency, targetCurrency, StringComparison.OrdinalIgnoreCase))
                continue;

            var direct = await _currencyService.GetLatestRateAsync(currency, targetCurrency);
            if (direct != null)
            {
                rates[currency] = direct.Rate;
                continue;
            }

            var inverse = await _currencyService.GetLatestRateAsync(targetCurrency, currency);
            if (inverse != null && inverse.Rate != 0)
                rates[currency] = 1m / inverse.Rate;
        }

        return rates;
    }

    private static decimal ConvertAmount(decimal amount, string fromCurrency, string targetCurrency, Dictionary<string, decimal> rates)
    {
        if (string.Equals(fromCurrency, targetCurrency, StringComparison.OrdinalIgnoreCase))
            return amount;

        return rates.TryGetValue(fromCurrency, out var rate) ? amount * rate : amount;
    }

    private static void ValidateCurrencies(string[]? currencies, string? fallbackCurrency)
    {
        if (currencies == null || currencies.Length == 0) return;

        foreach (var c in currencies)
        {
            if (!Enum.TryParse<Currency>(c, true, out _))
                throw new ArgumentException($"Invalid currency: '{c}'. Valid values: {string.Join(", ", Enum.GetNames<Currency>())}");
        }

        if (currencies.Length >= 2)
        {
            if (string.IsNullOrEmpty(fallbackCurrency))
                throw new ArgumentException("FallbackCurrency is required when multiple currencies are selected.");

            if (!currencies.Any(c => string.Equals(c, fallbackCurrency, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("FallbackCurrency must be one of the selected currencies.");
        }
    }

    private static string? JoinCurrencies(string[]? currencies)
    {
        if (currencies == null || currencies.Length == 0) return null;
        return string.Join(",", currencies.Select(c => c.ToUpperInvariant()));
    }

    private static Currency? ParseFallbackCurrency(string? fallbackCurrency)
    {
        if (string.IsNullOrEmpty(fallbackCurrency)) return null;
        return Enum.Parse<Currency>(fallbackCurrency, true);
    }

    private static string GenerateRandomColor()
    {
        return $"#{_random.Next(0x1000000):X6}";
    }
}

using AutoMapper;
using Billullo.Api.Data;
using Billullo.Api.DTOs;
using Billullo.Api.Models;
using Billullo.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Billullo.Api.Services;

public class TransactionService : ITransactionService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly ICurrencyService _currencyService;
    private readonly ILogger<TransactionService> _logger;

    public TransactionService(AppDbContext db, IMapper mapper, ICurrencyService currencyService, ILogger<TransactionService> logger)
    {
        _db = db;
        _mapper = mapper;
        _currencyService = currencyService;
        _logger = logger;
    }

    private IQueryable<Transaction> BuildFilteredQuery(string userId, TransactionFilterParams filters)
    {
        var query = _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filters.Type) && filters.Type != "all")
        {
            if (Enum.TryParse<TransactionType>(filters.Type, true, out var type))
                query = query.Where(t => t.Type == type);
        }

        if (filters.StartDate.HasValue)
            query = query.Where(t => t.Date >= filters.StartDate.Value);

        if (filters.EndDate.HasValue)
            query = query.Where(t => t.Date <= filters.EndDate.Value);

        if (!string.IsNullOrWhiteSpace(filters.Search))
            query = query.Where(t => t.Description.ToLower().Contains(filters.Search.ToLower()));

        return query;
    }

    /// <summary>
    /// Builds a rate table for converting any known currency to <paramref name="targetCurrency"/>.
    /// For each currency, first tries a direct rate; falls back to the inverse if not found.
    /// Returns only pairs for which a rate exists.
    /// </summary>
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

    public async Task<PaginatedResponse<TransactionDto>> GetAllAsync(string userId, TransactionFilterParams filters, string? targetCurrency = null)
    {
        filters = filters with
        {
            Page = Math.Max(1, filters.Page),
            PageSize = Math.Clamp(filters.PageSize, 1, 100),
        };

        var query = BuildFilteredQuery(userId, filters);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)filters.PageSize);

        var items = await query
            .OrderByDescending(t => t.Date)
            .Skip((filters.Page - 1) * filters.PageSize)
            .Take(filters.PageSize)
            .ToListAsync();

        var dtos = _mapper.Map<List<TransactionDto>>(items);

        if (!string.IsNullOrEmpty(targetCurrency))
        {
            var rates = await GetConversionRatesAsync(targetCurrency);
            dtos = dtos.Select(d => d with
            {
                ConvertedAmount = ConvertAmount(d.Amount, d.Currency, targetCurrency, rates),
                TargetCurrency = targetCurrency
            }).ToList();
        }

        return new PaginatedResponse<TransactionDto>(
            Items: dtos,
            TotalCount: totalCount,
            Page: filters.Page,
            PageSize: filters.PageSize,
            TotalPages: totalPages
        );
    }

    public async Task<TransactionBalanceDto> GetBalanceAsync(string userId, TransactionFilterParams filters, string targetCurrency)
    {
        var query = BuildFilteredQuery(userId, filters);

        var transactions = await query
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

    public async Task<TransactionDto?> GetByIdAsync(string userId, long id)
    {
        var transaction = await _db.Transactions
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        return transaction == null ? null : _mapper.Map<TransactionDto>(transaction);
    }

    public async Task<TransactionDto> CreateAsync(string userId, CreateTransactionRequest request)
    {
        ValidateEnums(request.Currency, request.Type);
        await ValidateCategoryOwnership(userId, request.CategoryId);

        var transaction = _mapper.Map<Transaction>(request);
        transaction.UserId = userId;
        transaction.Source = TransactionSource.Manual;
        transaction.CreatedAt = DateTime.UtcNow;
        transaction.UpdatedAt = DateTime.UtcNow;

        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Transaction created for user {UserId}: {Amount} {Currency}", userId, transaction.Amount, transaction.Currency);

        // Reload with navigation properties
        var created = await _db.Transactions
            .Include(t => t.Category)
            .FirstAsync(t => t.Id == transaction.Id);

        return _mapper.Map<TransactionDto>(created);
    }

    public async Task<TransactionDto?> UpdateAsync(string userId, long id, UpdateTransactionRequest request)
    {
        ValidateEnums(request.Currency, request.Type);
        await ValidateCategoryOwnership(userId, request.CategoryId);

        var transaction = await _db.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (transaction == null) return null;

        _mapper.Map(request, transaction);
        transaction.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Reload with navigation properties
        var updated = await _db.Transactions
            .Include(t => t.Category)
            .FirstAsync(t => t.Id == transaction.Id);

        return _mapper.Map<TransactionDto>(updated);
    }

    public async Task<bool> DeleteAsync(string userId, long id)
    {
        var transaction = await _db.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (transaction == null) return false;

        _db.Transactions.Remove(transaction);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Transaction {Id} deleted for user {UserId}", id, userId);
        return true;
    }

    public async Task<int> DeleteManyAsync(string userId, long[] ids)
    {
        var transactions = await _db.Transactions
            .Where(t => t.UserId == userId && ids.Contains(t.Id))
            .ToListAsync();

        if (transactions.Count == 0) return 0;

        _db.Transactions.RemoveRange(transactions);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Deleted {Count} transactions for user {UserId}", transactions.Count, userId);
        return transactions.Count;
    }

    private static void ValidateEnums(string currency, string type)
    {
        if (!Enum.TryParse<Currency>(currency, true, out _))
            throw new ArgumentException($"Invalid currency: '{currency}'. Valid values: {string.Join(", ", Enum.GetNames<Currency>())}");

        if (!Enum.TryParse<TransactionType>(type, true, out _))
            throw new ArgumentException($"Invalid transaction type: '{type}'. Valid values: {string.Join(", ", Enum.GetNames<TransactionType>())}");
    }

    private async Task ValidateCategoryOwnership(string userId, long? categoryId)
    {
        if (categoryId == null) return;

        var exists = await _db.Categories
            .AnyAsync(c => c.Id == categoryId && c.UserId == userId);

        if (!exists)
            throw new InvalidOperationException("Category not found.");
    }
}

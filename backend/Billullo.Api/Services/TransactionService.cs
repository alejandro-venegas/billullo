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

    public TransactionService(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<PaginatedResponse<TransactionDto>> GetAllAsync(string userId, TransactionFilterParams filters)
    {
        filters = filters with
        {
            Page = Math.Max(1, filters.Page),
            PageSize = Math.Clamp(filters.PageSize, 1, 100),
        };

        var query = _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId)
            .AsQueryable();

        // Filter by type
        if (!string.IsNullOrEmpty(filters.Type) && filters.Type != "all")
        {
            if (Enum.TryParse<TransactionType>(filters.Type, true, out var type))
                query = query.Where(t => t.Type == type);
        }

        // Filter by date range
        if (filters.StartDate.HasValue)
            query = query.Where(t => t.Date >= filters.StartDate.Value);

        if (filters.EndDate.HasValue)
            query = query.Where(t => t.Date <= filters.EndDate.Value);

        // Search by description
        if (!string.IsNullOrWhiteSpace(filters.Search))
            query = query.Where(t => t.Description.ToLower().Contains(filters.Search.ToLower()));

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)filters.PageSize);

        var items = await query
            .OrderByDescending(t => t.Date)
            .Skip((filters.Page - 1) * filters.PageSize)
            .Take(filters.PageSize)
            .ToListAsync();

        return new PaginatedResponse<TransactionDto>(
            Items: _mapper.Map<IEnumerable<TransactionDto>>(items),
            TotalCount: totalCount,
            Page: filters.Page,
            PageSize: filters.PageSize,
            TotalPages: totalPages
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
        return true;
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

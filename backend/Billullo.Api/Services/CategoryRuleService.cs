using System.Text.RegularExpressions;
using AutoMapper;
using Billullo.Api.Data;
using Billullo.Api.DTOs;
using Billullo.Api.Models;
using Billullo.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Billullo.Api.Services;

public class CategoryRuleService : ICategoryRuleService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public CategoryRuleService(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IEnumerable<CategoryRuleDto>> GetAllAsync(string userId)
    {
        var rules = await _db.CategoryRules
            .Include(r => r.Category)
            .Where(r => r.UserId == userId)
            .ToListAsync();

        return _mapper.Map<IEnumerable<CategoryRuleDto>>(rules);
    }

    public async Task<CategoryRuleDto?> GetByIdAsync(string userId, long id)
    {
        var rule = await _db.CategoryRules
            .Include(r => r.Category)
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        return rule == null ? null : _mapper.Map<CategoryRuleDto>(rule);
    }

    public async Task<CategoryRuleDto> CreateAsync(string userId, CreateCategoryRuleRequest request)
    {
        // Validate regex
        ValidateRegex(request.Pattern);

        // Verify category exists and belongs to user
        var categoryExists = await _db.Categories
            .AnyAsync(c => c.Id == request.CategoryId && c.UserId == userId);

        if (!categoryExists)
            throw new InvalidOperationException("Category not found.");

        var rule = _mapper.Map<CategoryRule>(request);
        rule.UserId = userId;

        _db.CategoryRules.Add(rule);
        await _db.SaveChangesAsync();

        var created = await _db.CategoryRules
            .Include(r => r.Category)
            .FirstAsync(r => r.Id == rule.Id);

        return _mapper.Map<CategoryRuleDto>(created);
    }

    public async Task<CategoryRuleDto?> UpdateAsync(string userId, long id, UpdateCategoryRuleRequest request)
    {
        ValidateRegex(request.Pattern);

        var rule = await _db.CategoryRules
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        if (rule == null) return null;

        // Verify category exists and belongs to user
        var categoryExists = await _db.Categories
            .AnyAsync(c => c.Id == request.CategoryId && c.UserId == userId);

        if (!categoryExists)
            throw new InvalidOperationException("Category not found.");

        _mapper.Map(request, rule);
        await _db.SaveChangesAsync();

        var updated = await _db.CategoryRules
            .Include(r => r.Category)
            .FirstAsync(r => r.Id == rule.Id);

        return _mapper.Map<CategoryRuleDto>(updated);
    }

    public async Task<bool> DeleteAsync(string userId, long id)
    {
        var rule = await _db.CategoryRules
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        if (rule == null) return false;

        _db.CategoryRules.Remove(rule);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<int> DeleteByCategoryIdAsync(string userId, long categoryId)
    {
        var rules = await _db.CategoryRules
            .Where(r => r.UserId == userId && r.CategoryId == categoryId)
            .ToListAsync();

        _db.CategoryRules.RemoveRange(rules);
        await _db.SaveChangesAsync();
        return rules.Count;
    }

    public async Task<RuleMatchResult> MatchAsync(string userId, string description)
    {
        var rules = await _db.CategoryRules
            .Include(r => r.Category)
            .Where(r => r.UserId == userId)
            .ToListAsync();

        var matches = new List<CategoryRule>();

        foreach (var rule in rules)
        {
            try
            {
                if (Regex.IsMatch(description, rule.Pattern, RegexOptions.IgnoreCase, TimeSpan.FromMilliseconds(200)))
                    matches.Add(rule);
            }
            catch (RegexMatchTimeoutException)
            {
                // Skip rules that take too long (potential ReDoS)
            }
            catch (ArgumentException)
            {
                // Skip invalid regex patterns
            }
        }

        if (matches.Count == 0)
        {
            return new RuleMatchResult(null, null, false, Enumerable.Empty<CategoryRuleDto>());
        }

        var distinctCategories = matches.Select(m => m.CategoryId).Distinct().ToList();
        var conflicts = distinctCategories.Count > 1;
        var firstMatch = matches.First();

        return new RuleMatchResult(
            CategoryId: firstMatch.CategoryId,
            CategoryName: firstMatch.Category?.Name,
            Conflicts: conflicts,
            Matches: _mapper.Map<IEnumerable<CategoryRuleDto>>(matches)
        );
    }

    private static void ValidateRegex(string pattern)
    {
        try
        {
            _ = new Regex(pattern, RegexOptions.None, TimeSpan.FromMilliseconds(200));
        }
        catch (ArgumentException ex)
        {
            throw new InvalidOperationException($"Invalid regex pattern: {ex.Message}");
        }
    }
}

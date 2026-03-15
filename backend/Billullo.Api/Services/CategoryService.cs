using AutoMapper;
using Billullo.Api.Data;
using Billullo.Api.DTOs;
using Billullo.Api.Models;
using Billullo.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Billullo.Api.Services;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public CategoryService(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IEnumerable<CategoryDto>> GetAllAsync(string userId)
    {
        return await _db.Categories
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.ParentCategoryId == null ? 0 : 1)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                ParentCategoryId = c.ParentCategoryId,
                Color = c.Color,
                RuleCount = c.Rules.Count,
                TransactionCount = c.Transactions.Count,
            })
            .ToListAsync();
    }

    public async Task<CategoryDto?> GetByIdAsync(string userId, long id)
    {
        return await _db.Categories
            .Where(c => c.Id == id && c.UserId == userId)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                ParentCategoryId = c.ParentCategoryId,
                Color = c.Color,
                RuleCount = c.Rules.Count,
                TransactionCount = c.Transactions.Count,
            })
            .FirstOrDefaultAsync();
    }

    public async Task<CategoryDto> CreateAsync(string userId, CreateCategoryRequest request)
    {
        if (request.ParentCategoryId.HasValue)
        {
            var parentExists = await _db.Categories
                .AnyAsync(c => c.Id == request.ParentCategoryId.Value && c.UserId == userId);
            if (!parentExists)
                throw new InvalidOperationException("Parent category not found.");
        }

        var exists = await _db.Categories
            .AnyAsync(c => c.UserId == userId
                && c.ParentCategoryId == request.ParentCategoryId
                && c.Name.ToLower() == request.Name.ToLower());

        if (exists)
            throw new InvalidOperationException($"Category '{request.Name}' already exists.");

        var category = _mapper.Map<Category>(request);
        category.UserId = userId;

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return (await GetByIdAsync(userId, category.Id))!;
    }

    public async Task<CategoryDto?> UpdateAsync(string userId, long id, UpdateCategoryRequest request)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (category == null) return null;

        var exists = await _db.Categories
            .AnyAsync(c => c.UserId == userId
                && c.Id != id
                && c.ParentCategoryId == category.ParentCategoryId
                && c.Name.ToLower() == request.Name.ToLower());

        if (exists)
            throw new InvalidOperationException($"Category '{request.Name}' already exists.");

        _mapper.Map(request, category);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(userId, id);
    }

    public async Task<bool> DeleteAsync(string userId, long id)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (category == null) return false;

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task SeedDefaultsAsync(string userId)
    {
        var hasCategories = await _db.Categories.AnyAsync(c => c.UserId == userId);
        if (hasCategories) return;

        var defaults = new (string Name, string Color, string[] Children)[]
        {
            ("Food & Drinks", "#FF9800", ["Groceries", "Restaurant, fast-food", "Bar, cafe"]),
            ("Shopping", "#E91E63", [
                "Clothes & shoes", "Drug-store, chemist", "Electronics, accessories",
                "Free time", "Gifts, joy", "Health and beauty", "Home, garden",
                "Jewels, accessories", "Kids", "Pets, animals", "Stationery, tools"
            ]),
            ("Housing", "#2196F3", [
                "Energy, utilities", "Maintenance, repairs", "Mortgage",
                "Property insurance", "Rent", "Services"
            ]),
            ("Transportation", "#009688", ["Business trips", "Long distance", "Public transport", "Taxi"]),
            ("Vehicle", "#607D8B", [
                "Fuel", "Leasing", "Parking", "Rentals",
                "Vehicle insurance", "Vehicle maintenance"
            ]),
            ("Life & Entertainment", "#9C27B0", [
                "Active sport, fitness", "Alcohol, tobacco", "Books, audio, subscriptions",
                "Charity, gifts", "Culture, sport events", "Education, development",
                "Health care, doctor", "Hobbies", "Holiday, trips, hotels",
                "Life events", "Lottery, gambling", "TV, Streaming", "Wellness, beauty"
            ]),
            ("Communication, PC", "#00BCD4", [
                "Internet", "Phone, cell phone", "Postal services", "Software, apps, games"
            ]),
            ("Financial expenses", "#F44336", [
                "Advisory", "Charges, Fees", "Child Support", "Fines",
                "Insurances", "Loan, interests", "Taxes"
            ]),
            ("Investments", "#4CAF50", [
                "Collections", "Financial investments", "Realty",
                "Savings", "Vehicles, chattels"
            ]),
            ("Income", "#8BC34A", [
                "Checks, coupons", "Child support", "Dues & grants", "Gifts",
                "Interest, dividends", "Lending, renting", "Lottery, gambling",
                "Refunds", "Rental income", "Sale", "Salary, wage"
            ]),
            ("Others", "#795548", ["Missing"]),
        };

        foreach (var (name, color, children) in defaults)
        {
            var parent = new Category { UserId = userId, Name = name, Color = color };
            _db.Categories.Add(parent);

            foreach (var childName in children)
            {
                _db.Categories.Add(new Category
                {
                    UserId = userId,
                    Name = childName,
                    ParentCategory = parent,
                });
            }
        }
        await _db.SaveChangesAsync();
    }
}

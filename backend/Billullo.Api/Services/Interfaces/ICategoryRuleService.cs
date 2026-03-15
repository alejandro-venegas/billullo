using Billullo.Api.DTOs;

namespace Billullo.Api.Services.Interfaces;

public interface ICategoryRuleService
{
    Task<IEnumerable<CategoryRuleDto>> GetAllAsync(string userId);
    Task<CategoryRuleDto?> GetByIdAsync(string userId, long id);
    Task<CategoryRuleDto> CreateAsync(string userId, CreateCategoryRuleRequest request);
    Task<CategoryRuleDto?> UpdateAsync(string userId, long id, UpdateCategoryRuleRequest request);
    Task<bool> DeleteAsync(string userId, long id);
    Task<int> DeleteByCategoryIdAsync(string userId, long categoryId);
    Task<RuleMatchResult> MatchAsync(string userId, string description);
}

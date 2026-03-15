using Billullo.Api.DTOs;

namespace Billullo.Api.Services.Interfaces;

public interface ICategoryService
{
    Task<IEnumerable<CategoryDto>> GetAllAsync(string userId);
    Task<CategoryDto?> GetByIdAsync(string userId, long id);
    Task<CategoryDto> CreateAsync(string userId, CreateCategoryRequest request);
    Task<CategoryDto?> UpdateAsync(string userId, long id, UpdateCategoryRequest request);
    Task<bool> DeleteAsync(string userId, long id);
    Task SeedDefaultsAsync(string userId);
}

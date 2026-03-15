using Billullo.Api.DTOs;

namespace Billullo.Api.Services.Interfaces;

public interface IEmailParsingRuleService
{
    Task<IEnumerable<EmailParsingRuleDto>> GetAllAsync(string userId);
    Task<EmailParsingRuleDto?> GetByIdAsync(string userId, long id);
    Task<EmailParsingRuleDto> CreateAsync(string userId, CreateEmailParsingRuleRequest request);
    Task<EmailParsingRuleDto?> UpdateAsync(string userId, long id, UpdateEmailParsingRuleRequest request);
    Task<bool> DeleteAsync(string userId, long id);
    Task<TestEmailParsingResult> TestRuleAsync(TestEmailParsingRuleRequest request);
    Task SeedDefaultsAsync(string userId);
}

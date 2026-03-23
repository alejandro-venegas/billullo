using Billullo.Api.DTOs;

namespace Billullo.Api.Services.Interfaces;

public interface IEmailConfigService
{
    Task<EmailConfigDto?> GetAsync(string userId);
    Task<EmailConfigDto> UpsertAsync(string userId, UpsertEmailConfigRequest request);
    Task<bool> DeleteAsync(string userId);
    Task<TestConnectionResult> TestConnectionAsync(TestEmailConfigRequest request);
    Task<TestScrapeResult> TestScrapeAsync(string userId);
    Task ScrapeAsync(string userId, int count);
}

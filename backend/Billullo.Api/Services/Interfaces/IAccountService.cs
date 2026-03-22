using Billullo.Api.DTOs;

namespace Billullo.Api.Services.Interfaces;

public interface IAccountService
{
    Task<IEnumerable<AccountDto>> GetAllAsync(string userId);
    Task<AccountDto?> GetByIdAsync(string userId, long id);
    Task<AccountDto> CreateAsync(string userId, CreateAccountRequest request);
    Task<AccountDto?> UpdateAsync(string userId, long id, UpdateAccountRequest request);
    Task<bool> DeleteAsync(string userId, long id, DeleteAccountRequest request);
    Task<TransactionDto> AdjustBalanceAsync(string userId, long accountId, AdjustBalanceRequest request);
    Task<TransactionBalanceDto> GetAccountBalanceAsync(string userId, long accountId, string targetCurrency);
    Task SeedDefaultAccountAsync(string userId);
}

using Billullo.Api.DTOs;

namespace Billullo.Api.Services.Interfaces;

public interface ITransactionService
{
    Task<PaginatedResponse<TransactionDto>> GetAllAsync(string userId, TransactionFilterParams filters, string? targetCurrency = null);
    Task<TransactionDto?> GetByIdAsync(string userId, long id);
    Task<TransactionDto> CreateAsync(string userId, CreateTransactionRequest request);
    Task<TransactionDto?> UpdateAsync(string userId, long id, UpdateTransactionRequest request);
    Task<bool> DeleteAsync(string userId, long id);
    Task<int> DeleteManyAsync(string userId, long[] ids);
    Task<TransactionBalanceDto> GetBalanceAsync(string userId, TransactionFilterParams filters, string targetCurrency);
}

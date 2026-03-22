using Billullo.Api.DTOs;
using Billullo.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Billullo.Api.Controllers;

[Route("api/[controller]")]
public class TransactionsController : AuthorizedControllerBase
{
    private readonly ITransactionService _service;

    public TransactionsController(ITransactionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<TransactionDto>>> GetAll(
        [FromQuery] string? type,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? search,
        [FromQuery] long[]? accountIds,
        [FromQuery] string? targetCurrency,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var filters = new TransactionFilterParams(type, startDate, endDate, search, accountIds, page, pageSize);
        var result = await _service.GetAllAsync(UserId, filters, targetCurrency);
        return Ok(result);
    }

    [HttpGet("balance")]
    public async Task<ActionResult<TransactionBalanceDto>> GetBalance(
        [FromQuery] string targetCurrency = "USD",
        [FromQuery] string? type = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? search = null,
        [FromQuery] long[]? accountIds = null)
    {
        var filters = new TransactionFilterParams(type, startDate, endDate, search, accountIds);
        var result = await _service.GetBalanceAsync(UserId, filters, targetCurrency);
        return Ok(result);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<TransactionDto>> GetById(long id)
    {
        var result = await _service.GetByIdAsync(UserId, id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TransactionDto>> Create([FromBody] CreateTransactionRequest request)
    {
        var result = await _service.CreateAsync(UserId, request);
        return Ok(result);
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<TransactionDto>> Update(long id, [FromBody] UpdateTransactionRequest request)
    {
        var result = await _service.UpdateAsync(UserId, id, request);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var deleted = await _service.DeleteAsync(UserId, id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpDelete("bulk")]
    public async Task<IActionResult> DeleteMany([FromBody] DeleteManyRequest request)
    {
        var count = await _service.DeleteManyAsync(UserId, request.Ids);
        return Ok(new { Deleted = count });
    }
}

using Billullo.Api.DTOs;
using Billullo.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Billullo.Api.Controllers;

[Route("api/[controller]")]
public class AccountsController : AuthorizedControllerBase
{
    private readonly IAccountService _service;

    public AccountsController(IAccountService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AccountDto>>> GetAll()
    {
        var result = await _service.GetAllAsync(UserId);
        return Ok(result);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<AccountDto>> GetById(long id)
    {
        var result = await _service.GetByIdAsync(UserId, id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<AccountDto>> Create([FromBody] CreateAccountRequest request)
    {
        var result = await _service.CreateAsync(UserId, request);
        return Ok(result);
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<AccountDto>> Update(long id, [FromBody] UpdateAccountRequest request)
    {
        var result = await _service.UpdateAsync(UserId, id, request);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id, [FromBody] DeleteAccountRequest request)
    {
        var deleted = await _service.DeleteAsync(UserId, id, request);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("{id:long}/balance")]
    public async Task<ActionResult<TransactionBalanceDto>> GetBalance(long id, [FromQuery] string targetCurrency = "USD")
    {
        var result = await _service.GetAccountBalanceAsync(UserId, id, targetCurrency);
        return Ok(result);
    }

    [HttpPost("{id:long}/adjust")]
    public async Task<ActionResult<TransactionDto>> AdjustBalance(long id, [FromBody] AdjustBalanceRequest request)
    {
        var result = await _service.AdjustBalanceAsync(UserId, id, request);
        return Ok(result);
    }
}

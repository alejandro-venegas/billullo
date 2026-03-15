using Billullo.Api.DTOs;
using Billullo.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Billullo.Api.Controllers;

[Route("api/[controller]")]
public class EmailParsingRulesController : AuthorizedControllerBase
{
    private readonly IEmailParsingRuleService _service;

    public EmailParsingRulesController(IEmailParsingRuleService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmailParsingRuleDto>>> GetAll()
    {
        var result = await _service.GetAllAsync(UserId);
        return Ok(result);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<EmailParsingRuleDto>> GetById(long id)
    {
        var result = await _service.GetByIdAsync(UserId, id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<EmailParsingRuleDto>> Create([FromBody] CreateEmailParsingRuleRequest request)
    {
        var result = await _service.CreateAsync(UserId, request);
        return Ok(result);
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<EmailParsingRuleDto>> Update(long id, [FromBody] UpdateEmailParsingRuleRequest request)
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

    [HttpPost("test")]
    public async Task<ActionResult<TestEmailParsingResult>> TestRule([FromBody] TestEmailParsingRuleRequest request)
    {
        var result = await _service.TestRuleAsync(request);
        return Ok(result);
    }
}

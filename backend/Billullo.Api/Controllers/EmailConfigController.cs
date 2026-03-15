using Billullo.Api.DTOs;
using Billullo.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Billullo.Api.Controllers;

[Route("api/[controller]")]
public class EmailConfigController : AuthorizedControllerBase
{
    private readonly IEmailConfigService _service;

    public EmailConfigController(IEmailConfigService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<EmailConfigDto>> Get()
    {
        var result = await _service.GetAsync(UserId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPut]
    public async Task<ActionResult<EmailConfigDto>> Upsert([FromBody] UpsertEmailConfigRequest request)
    {
        var result = await _service.UpsertAsync(UserId, request);
        return Ok(result);
    }

    [HttpDelete]
    public async Task<IActionResult> Delete()
    {
        var deleted = await _service.DeleteAsync(UserId);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("test")]
    public async Task<ActionResult<TestConnectionResult>> TestConnection([FromBody] TestEmailConfigRequest request)
    {
        var result = await _service.TestConnectionAsync(request);
        return Ok(result);
    }

    [HttpPost("test-scrape")]
    public async Task<ActionResult<TestScrapeResult>> TestScrape()
    {
        var result = await _service.TestScrapeAsync(UserId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
}

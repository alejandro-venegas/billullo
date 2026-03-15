using Billullo.Api.DTOs;
using Billullo.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Billullo.Api.Controllers;

[Route("api/[controller]")]
public class RulesController : AuthorizedControllerBase
{
    private readonly ICategoryRuleService _service;

    public RulesController(ICategoryRuleService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryRuleDto>>> GetAll()
    {
        var result = await _service.GetAllAsync(UserId);
        return Ok(result);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<CategoryRuleDto>> GetById(long id)
    {
        var result = await _service.GetByIdAsync(UserId, id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("match")]
    public async Task<ActionResult<RuleMatchResult>> Match([FromQuery] string description)
    {
        var result = await _service.MatchAsync(UserId, description);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryRuleDto>> Create([FromBody] CreateCategoryRuleRequest request)
    {
        var result = await _service.CreateAsync(UserId, request);
        return Ok(result);
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<CategoryRuleDto>> Update(long id, [FromBody] UpdateCategoryRuleRequest request)
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

    [HttpDelete("by-category/{categoryId:long}")]
    public async Task<ActionResult<object>> DeleteByCategoryId(long categoryId)
    {
        var count = await _service.DeleteByCategoryIdAsync(UserId, categoryId);
        return Ok(new { deleted = count });
    }
}

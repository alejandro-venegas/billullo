using Billullo.Api.DTOs;
using Billullo.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Billullo.Api.Controllers;

[Route("api/[controller]")]
public class CategoriesController : AuthorizedControllerBase
{
    private readonly ICategoryService _service;

    public CategoriesController(ICategoryService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll()
    {
        var result = await _service.GetAllAsync(UserId);
        return Ok(result);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<CategoryDto>> GetById(long id)
    {
        var result = await _service.GetByIdAsync(UserId, id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryRequest request)
    {
        var result = await _service.CreateAsync(UserId, request);
        return Ok(result);
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<CategoryDto>> Update(long id, [FromBody] UpdateCategoryRequest request)
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
}

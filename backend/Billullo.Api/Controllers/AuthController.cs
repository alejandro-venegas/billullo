using AutoMapper;
using Billullo.Api.DTOs;
using Billullo.Api.Models;
using Billullo.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Billullo.Api.Controllers;

[Route("api/[controller]")]
public class AuthController : AuthorizedControllerBase
{
    private readonly IAuthService _authService;
    private readonly UserManager<AppUser> _userManager;
    private readonly IMapper _mapper;

    public AuthController(IAuthService authService, UserManager<AppUser> userManager, IMapper mapper)
    {
        _authService = authService;
        _userManager = userManager;
        _mapper = mapper;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        var response = await _authService.RegisterAsync(request);
        return Ok(response);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        return Ok(response);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest request)
    {
        var response = await _authService.RefreshTokenAsync(request.RefreshToken);
        return Ok(response);
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest request)
    {
        await _authService.RevokeRefreshTokenAsync(request.RefreshToken);
        return NoContent();
    }

    [HttpGet("preferences")]
    public async Task<ActionResult<UserDto>> GetPreferences()
    {
        var user = await _userManager.FindByIdAsync(UserId);
        if (user == null) return Unauthorized();
        return Ok(_mapper.Map<UserDto>(user));
    }

    [HttpPatch("preferences")]
    public async Task<ActionResult<UserDto>> UpdatePreferences([FromBody] UpdatePreferencesRequest request)
    {
        var user = await _userManager.FindByIdAsync(UserId);
        if (user == null) return Unauthorized();

        user.PreferredCurrency = request.PreferredCurrency;
        await _userManager.UpdateAsync(user);

        return Ok(_mapper.Map<UserDto>(user));
    }
}

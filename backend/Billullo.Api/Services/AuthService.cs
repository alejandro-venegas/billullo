using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using Billullo.Api.Data;
using Billullo.Api.DTOs;
using Billullo.Api.Models;
using Billullo.Api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Billullo.Api.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly IMapper _mapper;
    private readonly ICategoryService _categoryService;
    private readonly IEmailParsingRuleService _emailParsingRuleService;
    private readonly IAccountService _accountService;

    public AuthService(
        UserManager<AppUser> userManager,
        AppDbContext db,
        IConfiguration config,
        IMapper mapper,
        ICategoryService categoryService,
        IEmailParsingRuleService emailParsingRuleService,
        IAccountService accountService)
    {
        _userManager = userManager;
        _db = db;
        _config = config;
        _mapper = mapper;
        _categoryService = categoryService;
        _emailParsingRuleService = emailParsingRuleService;
        _accountService = accountService;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
            throw new InvalidOperationException("A user with this email already exists.");

        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Registration failed: {errors}");
        }

        await _categoryService.SeedDefaultsAsync(user.Id);
        await _emailParsingRuleService.SeedDefaultsAsync(user.Id);
        await _accountService.SeedDefaultAccountAsync(user.Id);

        return await GenerateAuthResponseAsync(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            throw new UnauthorizedAccessException("Invalid email or password.");

        return await GenerateAuthResponseAsync(user);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (storedToken == null || !storedToken.IsActive)
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");

        // Revoke old token
        storedToken.RevokedAt = DateTime.UtcNow;

        // Generate new pair
        var response = await GenerateAuthResponseAsync(storedToken.User);
        await _db.SaveChangesAsync();

        return response;
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (storedToken != null && storedToken.IsActive)
        {
            storedToken.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    public string GenerateJwtToken(AppUser user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Secret"]
                ?? throw new InvalidOperationException("JWT secret not configured.")));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresMinutes = int.Parse(_config["Jwt:ExpiresMinutes"] ?? "15");

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<AuthResponse> GenerateAuthResponseAsync(AppUser user)
    {
        var jwt = GenerateJwtToken(user);
        var expiresMinutes = int.Parse(_config["Jwt:ExpiresMinutes"] ?? "15");

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        return new AuthResponse(
            Token: jwt,
            RefreshToken: refreshToken.Token,
            ExpiresAt: DateTime.UtcNow.AddMinutes(expiresMinutes),
            User: _mapper.Map<UserDto>(user)
        );
    }
}

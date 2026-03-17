using AutoMapper;
using Billullo.Api.Data;
using Billullo.Api.DTOs;
using Billullo.Api.Models;
using Billullo.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Billullo.Api.Services;

public class EmailParsingRuleService : IEmailParsingRuleService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IEmailParserService _parser;

    public EmailParsingRuleService(AppDbContext db, IMapper mapper, IEmailParserService parser)
    {
        _db = db;
        _mapper = mapper;
        _parser = parser;
    }

    public async Task<IEnumerable<EmailParsingRuleDto>> GetAllAsync(string userId)
    {
        var rules = await _db.EmailParsingRules
            .Include(r => r.Category)
            .Where(r => r.UserId == userId)
            .OrderBy(r => r.Priority)
            .ThenBy(r => r.Name)
            .ToListAsync();

        return _mapper.Map<IEnumerable<EmailParsingRuleDto>>(rules);
    }

    public async Task<EmailParsingRuleDto?> GetByIdAsync(string userId, long id)
    {
        var rule = await _db.EmailParsingRules
            .Include(r => r.Category)
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        return rule == null ? null : _mapper.Map<EmailParsingRuleDto>(rule);
    }

    public async Task<EmailParsingRuleDto> CreateAsync(string userId, CreateEmailParsingRuleRequest request)
    {
        ValidateRequest(request.SenderAddress, request.SubjectPattern);

        var rule = _mapper.Map<EmailParsingRule>(request);
        rule.UserId = userId;

        _db.EmailParsingRules.Add(rule);
        await _db.SaveChangesAsync();

        var created = await _db.EmailParsingRules
            .Include(r => r.Category)
            .FirstAsync(r => r.Id == rule.Id);

        return _mapper.Map<EmailParsingRuleDto>(created);
    }

    public async Task<EmailParsingRuleDto?> UpdateAsync(string userId, long id, UpdateEmailParsingRuleRequest request)
    {
        ValidateRequest(request.SenderAddress, request.SubjectPattern);

        var rule = await _db.EmailParsingRules
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        if (rule == null) return null;

        _mapper.Map(request, rule);
        await _db.SaveChangesAsync();

        var updated = await _db.EmailParsingRules
            .Include(r => r.Category)
            .FirstAsync(r => r.Id == rule.Id);

        return _mapper.Map<EmailParsingRuleDto>(updated);
    }

    public async Task<bool> DeleteAsync(string userId, long id)
    {
        var rule = await _db.EmailParsingRules
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        if (rule == null) return false;

        _db.EmailParsingRules.Remove(rule);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<TestEmailParsingResult> TestRuleAsync(TestEmailParsingRuleRequest request)
    {
        return await _parser.ParseEmailAsync(request.EmailBody);
    }

    public async Task SeedDefaultsAsync(string userId)
    {
        var hasRules = await _db.EmailParsingRules.AnyAsync(r => r.UserId == userId);
        if (hasRules) return;

        var defaults = new[]
        {
            new EmailParsingRule
            {
                UserId = userId,
                Name = "BAC",
                SubjectPattern = "Notificación de transacción",
                TransactionType = TransactionType.Expense,
            },
            new EmailParsingRule
            {
                UserId = userId,
                Name = "DaviBank",
                SubjectPattern = "Alerta Transacción",
                TransactionType = TransactionType.Expense,
            },
        };

        _db.EmailParsingRules.AddRange(defaults);
        await _db.SaveChangesAsync();
    }

    private static void ValidateRequest(string? senderAddress, string? subjectPattern)
    {
        if (string.IsNullOrWhiteSpace(senderAddress) && string.IsNullOrWhiteSpace(subjectPattern))
            throw new InvalidOperationException("At least one of SenderAddress or SubjectPattern must be provided.");
    }

}

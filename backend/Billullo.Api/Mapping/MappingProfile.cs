using AutoMapper;
using Billullo.Api.DTOs;
using Billullo.Api.Models;

namespace Billullo.Api.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // ── Transaction ──
        CreateMap<Transaction, TransactionDto>()
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category != null ? s.Category.Name : null))
            .ForMember(d => d.Currency, o => o.MapFrom(s => s.Currency.ToString()))
            .ForMember(d => d.Type, o => o.MapFrom(s => s.Type.ToString().ToLowerInvariant()))
            .ForMember(d => d.Source, o => o.MapFrom(s => s.Source.ToString().ToLowerInvariant()))
            .ForMember(d => d.ConvertedAmount, o => o.Ignore())
            .ForMember(d => d.TargetCurrency, o => o.Ignore());

        CreateMap<CreateTransactionRequest, Transaction>()
            .ForMember(d => d.Currency, o => o.MapFrom(s => Enum.Parse<Currency>(s.Currency, true)))
            .ForMember(d => d.Type, o => o.MapFrom(s => Enum.Parse<TransactionType>(s.Type, true)))
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.UserId, o => o.Ignore())
            .ForMember(d => d.User, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore())
            .ForMember(d => d.Source, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.UpdatedAt, o => o.Ignore());

        CreateMap<UpdateTransactionRequest, Transaction>()
            .ForMember(d => d.Currency, o => o.MapFrom(s => Enum.Parse<Currency>(s.Currency, true)))
            .ForMember(d => d.Type, o => o.MapFrom(s => Enum.Parse<TransactionType>(s.Type, true)))
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.UserId, o => o.Ignore())
            .ForMember(d => d.User, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore())
            .ForMember(d => d.Source, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.UpdatedAt, o => o.Ignore());

        // ── Category ──
        CreateMap<Category, CategoryDto>()
            .ForMember(d => d.RuleCount, o => o.MapFrom(s => s.Rules.Count))
            .ForMember(d => d.TransactionCount, o => o.MapFrom(s => s.Transactions.Count));

        CreateMap<CreateCategoryRequest, Category>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.UserId, o => o.Ignore())
            .ForMember(d => d.User, o => o.Ignore())
            .ForMember(d => d.ParentCategory, o => o.Ignore())
            .ForMember(d => d.Children, o => o.Ignore())
            .ForMember(d => d.Rules, o => o.Ignore())
            .ForMember(d => d.Transactions, o => o.Ignore());

        CreateMap<UpdateCategoryRequest, Category>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.UserId, o => o.Ignore())
            .ForMember(d => d.User, o => o.Ignore())
            .ForMember(d => d.ParentCategoryId, o => o.Ignore())
            .ForMember(d => d.ParentCategory, o => o.Ignore())
            .ForMember(d => d.Children, o => o.Ignore())
            .ForMember(d => d.Rules, o => o.Ignore())
            .ForMember(d => d.Transactions, o => o.Ignore());

        // ── CategoryRule ──
        CreateMap<CategoryRule, CategoryRuleDto>()
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category != null ? s.Category.Name : null));

        CreateMap<CreateCategoryRuleRequest, CategoryRule>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.UserId, o => o.Ignore())
            .ForMember(d => d.User, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore());

        CreateMap<UpdateCategoryRuleRequest, CategoryRule>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.UserId, o => o.Ignore())
            .ForMember(d => d.User, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore());

        // ── EmailConfig ──
        CreateMap<EmailConfig, EmailConfigDto>()
            .ForMember(d => d.HasPassword, o => o.MapFrom(s => !string.IsNullOrEmpty(s.EncryptedPassword)));

        // ── EmailParsingRule ──
        CreateMap<EmailParsingRule, EmailParsingRuleDto>()
            .ForMember(d => d.CurrencyFixed, o => o.MapFrom(s => s.CurrencyFixed.HasValue ? s.CurrencyFixed.Value.ToString() : null))
            .ForMember(d => d.TransactionType, o => o.MapFrom(s => s.TransactionType.ToString().ToLowerInvariant()))
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category != null ? s.Category.Name : null));

        CreateMap<CreateEmailParsingRuleRequest, EmailParsingRule>()
            .ForMember(d => d.CurrencyFixed, o => o.MapFrom(s => !string.IsNullOrEmpty(s.CurrencyFixed) ? Enum.Parse<Currency>(s.CurrencyFixed, true) : (Currency?)null))
            .ForMember(d => d.TransactionType, o => o.MapFrom(s => Enum.Parse<TransactionType>(s.TransactionType, true)))
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.UserId, o => o.Ignore())
            .ForMember(d => d.User, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore());

        CreateMap<UpdateEmailParsingRuleRequest, EmailParsingRule>()
            .ForMember(d => d.CurrencyFixed, o => o.MapFrom(s => !string.IsNullOrEmpty(s.CurrencyFixed) ? Enum.Parse<Currency>(s.CurrencyFixed, true) : (Currency?)null))
            .ForMember(d => d.TransactionType, o => o.MapFrom(s => Enum.Parse<TransactionType>(s.TransactionType, true)))
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.UserId, o => o.Ignore())
            .ForMember(d => d.User, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore());

        // ── AppUser → UserDto ──
        CreateMap<AppUser, UserDto>()
            .ForMember(d => d.Email, o => o.MapFrom(s => s.Email ?? string.Empty));
    }
}

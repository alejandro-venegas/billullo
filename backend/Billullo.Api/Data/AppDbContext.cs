using Billullo.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Billullo.Api.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<CategoryRule> CategoryRules => Set<CategoryRule>();
    public DbSet<EmailConfig> EmailConfigs => Set<EmailConfig>();
    public DbSet<EmailParsingRule> EmailParsingRules => Set<EmailParsingRule>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<ExchangeRate> ExchangeRates => Set<ExchangeRate>();

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        NormalizeDateTimesToUtc();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        NormalizeDateTimesToUtc();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    public override int SaveChanges()
    {
        NormalizeDateTimesToUtc();
        return base.SaveChanges();
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        NormalizeDateTimesToUtc();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    private void NormalizeDateTimesToUtc()
    {
        foreach (var entry in ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified))
        {
            foreach (var prop in entry.Properties
                .Where(p => p.CurrentValue is DateTime && p.Metadata.ClrType == typeof(DateTime)))
            {
                var dt = (DateTime)prop.CurrentValue!;
                if (dt.Kind == DateTimeKind.Unspecified)
                    prop.CurrentValue = DateTime.SpecifyKind(dt, DateTimeKind.Utc);
            }

            foreach (var prop in entry.Properties
                .Where(p => p.CurrentValue is DateTime? && p.Metadata.ClrType == typeof(DateTime?)))
            {
                var dt = (DateTime?)prop.CurrentValue;
                if (dt.HasValue && dt.Value.Kind == DateTimeKind.Unspecified)
                    prop.CurrentValue = DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc);
            }
        }
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ── Transaction ──
        builder.Entity<Transaction>(e =>
        {
            e.HasIndex(t => t.UserId);
            e.HasIndex(t => t.Date);
            e.Property(t => t.Currency).HasConversion<string>().HasMaxLength(10);
            e.Property(t => t.Type).HasConversion<string>().HasMaxLength(10);
            e.Property(t => t.Source).HasConversion<string>().HasMaxLength(10);
            e.Property(t => t.Amount).HasPrecision(18, 2);

            e.HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(t => t.Category)
                .WithMany(c => c.Transactions)
                .HasForeignKey(t => t.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ── Category ──
        builder.Entity<Category>(e =>
        {
            e.HasIndex(c => new { c.UserId, c.Name })
                .IsUnique()
                .HasFilter("\"ParentCategoryId\" IS NULL");

            e.HasIndex(c => new { c.UserId, c.ParentCategoryId, c.Name })
                .IsUnique()
                .HasFilter("\"ParentCategoryId\" IS NOT NULL");

            e.HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(c => c.ParentCategory)
                .WithMany(c => c.Children)
                .HasForeignKey(c => c.ParentCategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── CategoryRule ──
        builder.Entity<CategoryRule>(e =>
        {
            e.HasIndex(r => r.UserId);

            e.HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(r => r.Category)
                .WithMany(c => c.Rules)
                .HasForeignKey(r => r.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── EmailConfig ──
        builder.Entity<EmailConfig>(e =>
        {
            e.HasIndex(ec => ec.UserId).IsUnique(); // one config per user

            e.HasOne(ec => ec.User)
                .WithMany()
                .HasForeignKey(ec => ec.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── EmailParsingRule ──
        builder.Entity<EmailParsingRule>(e =>
        {
            e.HasIndex(r => r.UserId);
            e.Property(r => r.CurrencyFixed).HasConversion<string?>().HasMaxLength(10);
            e.Property(r => r.TransactionType).HasConversion<string>().HasMaxLength(10);

            e.HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(r => r.Category)
                .WithMany()
                .HasForeignKey(r => r.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ── RefreshToken ──
        builder.Entity<RefreshToken>(e =>
        {
            e.HasIndex(rt => rt.Token).IsUnique();
            e.HasIndex(rt => rt.UserId);

            e.HasOne(rt => rt.User)
                .WithMany()
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── ExchangeRate ──
        builder.Entity<ExchangeRate>(e =>
        {
            e.HasIndex(er => new { er.BaseCurrency, er.QuoteCurrency });
            e.HasIndex(er => er.FetchedAt);
            e.Property(er => er.BaseCurrency).HasMaxLength(10);
            e.Property(er => er.QuoteCurrency).HasMaxLength(10);
            e.Property(er => er.Rate).HasPrecision(18, 6);
        });
    }
}

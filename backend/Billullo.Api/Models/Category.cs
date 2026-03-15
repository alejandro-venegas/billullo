using System.ComponentModel.DataAnnotations;

namespace Billullo.Api.Models;

public class Category
{
    public long Id { get; set; }

    [Required]
    public string UserId { get; set; } = default!;
    public AppUser User { get; set; } = default!;

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public long? ParentCategoryId { get; set; }
    public Category? ParentCategory { get; set; }
    public ICollection<Category> Children { get; set; } = new List<Category>();

    [MaxLength(7)]
    public string? Color { get; set; }

    public ICollection<CategoryRule> Rules { get; set; } = new List<CategoryRule>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}

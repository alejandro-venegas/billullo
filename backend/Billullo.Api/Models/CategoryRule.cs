using System.ComponentModel.DataAnnotations;

namespace Billullo.Api.Models;

public class CategoryRule
{
    public long Id { get; set; }

    [Required]
    public string UserId { get; set; } = default!;
    public AppUser User { get; set; } = default!;

    [Required, MaxLength(500)]
    public string Pattern { get; set; } = string.Empty;

    public long CategoryId { get; set; }
    public Category Category { get; set; } = default!;
}

using System.ComponentModel.DataAnnotations;

namespace Billullo.Api.Models;

public class RefreshToken
{
    public long Id { get; set; }

    [Required]
    public string UserId { get; set; } = default!;
    public AppUser User { get; set; } = default!;

    [Required]
    public string Token { get; set; } = default!;

    public DateTime ExpiresAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public bool IsRevoked => RevokedAt != null;
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;
}

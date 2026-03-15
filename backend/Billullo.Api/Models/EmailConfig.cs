using System.ComponentModel.DataAnnotations;

namespace Billullo.Api.Models;

public class EmailConfig
{
    public long Id { get; set; }

    [Required]
    public string UserId { get; set; } = default!;
    public AppUser User { get; set; } = default!;

    [Required, MaxLength(255)]
    public string ImapHost { get; set; } = "imap.gmail.com";

    public int ImapPort { get; set; } = 993;

    [Required, MaxLength(255)]
    public string EmailAddress { get; set; } = string.Empty;

    [Required]
    public string EncryptedPassword { get; set; } = string.Empty;

    public bool UseSsl { get; set; } = true;

    public bool Enabled { get; set; } = false;

    /// <summary>
    /// Tracks the last processed email UID to avoid reprocessing on restart.
    /// </summary>
    public uint? LastCheckedUid { get; set; }
}

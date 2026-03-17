using Microsoft.AspNetCore.Identity;

namespace Billullo.Api.Models;

public class AppUser : IdentityUser
{
    public string PreferredCurrency { get; set; } = "USD";
}

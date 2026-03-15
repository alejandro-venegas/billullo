using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Billullo.Api.Controllers;

[Authorize]
[ApiController]
public abstract class AuthorizedControllerBase : ControllerBase
{
    protected string UserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User ID not found in token.");
}

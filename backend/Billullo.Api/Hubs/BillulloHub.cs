using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Billullo.Api.Hubs;

[Authorize]
public class BillulloHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        // Add connection to a group keyed by user ID so targeted messages work.
        await Groups.AddToGroupAsync(Context.ConnectionId, Context.UserIdentifier!);
        await base.OnConnectedAsync();
    }
}

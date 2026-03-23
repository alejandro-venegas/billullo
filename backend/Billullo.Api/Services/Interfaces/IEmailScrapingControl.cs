namespace Billullo.Api.Services.Interfaces;

public interface IEmailScrapingControl
{
    /// <summary>
    /// Signals the background scraping service that the email config for the given
    /// user has changed (enabled, disabled, or deleted), so it reacts immediately
    /// instead of waiting for the next periodic 60-second poll.
    /// </summary>
    void NotifyConfigChanged(string userId);

    /// <summary>
    /// Processes the last <paramref name="count"/> emails for the given user, regardless
    /// of <c>LastCheckedUid</c>. Progress is pushed to the user via SignalR events:
    /// <c>ScrapeProgress</c>, <c>ScrapeDone</c>, and <c>ScrapeError</c>.
    /// </summary>
    Task ScrapeAsync(string userId, int count, CancellationToken ct = default);
}

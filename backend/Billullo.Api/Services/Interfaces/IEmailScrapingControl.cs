namespace Billullo.Api.Services.Interfaces;

public interface IEmailScrapingControl
{
    /// <summary>
    /// Signals the background scraping service that the email config for the given
    /// user has changed (enabled, disabled, or deleted), so it reacts immediately
    /// instead of waiting for the next periodic 60-second poll.
    /// </summary>
    void NotifyConfigChanged(string userId);
}

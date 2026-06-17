namespace ECommerce.Services.Abstraction;

public interface IEmailService
{
    /// <summary>Sends a customer update email. No-op when email is disabled in configuration.</summary>
    Task SendCustomerUpdateAsync(
        string toEmail,
        string subject,
        string body,
        string category = "general",
        CancellationToken cancellationToken = default
    );
}

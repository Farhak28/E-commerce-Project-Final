using System.Net;
using System.Net.Mail;
using ECommerce.Services.Abstraction;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ECommerce.Services.Email;

public sealed class SmtpEmailService : IEmailService
{
    private readonly EmailOptions _options;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IOptions<EmailOptions> options, ILogger<SmtpEmailService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendCustomerUpdateAsync(
        string toEmail,
        string subject,
        string body,
        string category = "general",
        CancellationToken cancellationToken = default
    )
    {
        if (!_options.Enabled)
        {
            _logger.LogWarning(
                "Email disabled — skipped \"{Subject}\" to {Email}. Set Email:Enabled=true and configure SMTP.",
                subject,
                toEmail
            );
            return;
        }

        if (string.IsNullOrWhiteSpace(_options.SmtpHost))
        {
            _logger.LogWarning(
                "Email enabled but SmtpHost is empty — skipped \"{Subject}\" to {Email}.",
                subject,
                toEmail
            );
            return;
        }

        if (string.IsNullOrWhiteSpace(toEmail))
            return;

        var html = CustomerEmailTemplates.BuildHtml(
            subject,
            body,
            category,
            _options.StorefrontUrl,
            _options.FromName
        );
        var plainText = CustomerEmailTemplates.BuildPlainText(subject, body, _options.StorefrontUrl);

        using var message = new MailMessage
        {
            From = new MailAddress(_options.FromAddress, _options.FromName),
            Subject = subject,
            Body = plainText,
            IsBodyHtml = false,
        };
        message.To.Add(toEmail);
        message.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(html, null, "text/html"));

        using var client = new SmtpClient(_options.SmtpHost, _options.SmtpPort)
        {
            EnableSsl = _options.UseSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
        };

        if (!string.IsNullOrWhiteSpace(_options.Username))
            client.Credentials = new NetworkCredential(_options.Username, _options.Password);

        try
        {
            await client.SendMailAsync(message, cancellationToken);
            if (_options.IsCaptureDelivery)
            {
                _logger.LogInformation(
                    "Email captured for {Email}: \"{Subject}\" — read at {Inbox}",
                    toEmail,
                    subject,
                    _options.CaptureInboxUrl
                );
            }
            else
            {
                _logger.LogInformation(
                    "Email delivered to {Email}: \"{Subject}\" via {Host}",
                    toEmail,
                    subject,
                    _options.SmtpHost
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send \"{Subject}\" to {Email} via {Host}:{Port} (SSL={Ssl})",
                subject,
                toEmail,
                _options.SmtpHost,
                _options.SmtpPort,
                _options.UseSsl
            );
            throw;
        }
    }
}

namespace ECommerce.Services.Email;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    /// <summary>Capture = local Mailpit inbox. Live = real SMTP delivery.</summary>
    public string DeliveryMode { get; set; } = "Capture";

    public bool Enabled { get; set; }

    public string FromName { get; set; } = "Corner Store";

    public string FromAddress { get; set; } = "noreply@cornerstore.local";

    public string SmtpHost { get; set; } = "";

    public int SmtpPort { get; set; } = 587;

    public bool UseSsl { get; set; } = true;

    public string? Username { get; set; }

    public string? Password { get; set; }

    /// <summary>Link shown in emails (storefront base URL).</summary>
    public string StorefrontUrl { get; set; } = "http://localhost:3848";

    /// <summary>Where captured dev emails can be read (Mailpit UI).</summary>
    public string CaptureInboxUrl { get; set; } = "http://localhost:8025";

    public bool IsLiveDelivery =>
        DeliveryMode.Equals("Live", StringComparison.OrdinalIgnoreCase)
        || !string.IsNullOrWhiteSpace(Username);

    public bool IsCaptureDelivery => Enabled && !IsLiveDelivery;
}

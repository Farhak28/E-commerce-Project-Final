using System.Net;

namespace ECommerce.Services.Email;

internal static class CustomerEmailTemplates
{
    public static string BuildHtml(
        string title,
        string body,
        string category,
        string storefrontUrl,
        string fromName
    )
    {
        var safeTitle = WebUtility.HtmlEncode(title);
        var safeBody = WebUtility.HtmlEncode(body);
        var ordersUrl = $"{storefrontUrl.TrimEnd('/')}/account/orders";
        var notificationsUrl = $"{storefrontUrl.TrimEnd('/')}/notifications";
        var categoryLabel = WebUtility.HtmlEncode(category);

        return $"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>{safeTitle}</title>
            </head>
            <body style="margin:0;padding:0;background:#f4f4f5;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
                      <tr>
                        <td style="padding:24px 28px;background:#111827;color:#ffffff;">
                          <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.8;">{WebUtility.HtmlEncode(fromName)}</p>
                          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;font-weight:700;">{safeTitle}</h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:28px;">
                          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">{safeBody}</p>
                          <p style="margin:0 0 20px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;">{categoryLabel}</p>
                          <a href="{ordersUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 18px;border-radius:10px;margin-right:8px;">View orders</a>
                          <a href="{notificationsUrl}" style="display:inline-block;color:#2563eb;text-decoration:none;font-weight:600;font-size:14px;padding:12px 0;">Notifications</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 28px 24px;border-top:1px solid #f4f4f5;font-size:12px;line-height:1.5;color:#a1a1aa;">
                          You received this email because you have an account at {WebUtility.HtmlEncode(fromName)}.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
    }

    public static string BuildPlainText(string title, string body, string storefrontUrl)
    {
        var ordersUrl = $"{storefrontUrl.TrimEnd('/')}/account/orders";
        return $"{title}\n\n{body}\n\nView your orders: {ordersUrl}";
    }
}

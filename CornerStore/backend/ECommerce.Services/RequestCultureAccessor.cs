using ECommerce.Services.Abstraction;
using ECommerce.Shared.Localization;
using Microsoft.AspNetCore.Http;

namespace ECommerce.Services;

public sealed class RequestCultureAccessor(IHttpContextAccessor httpContextAccessor) : IRequestCultureAccessor
{
    public string Language
    {
        get
        {
            var header = httpContextAccessor.HttpContext?.Request.Headers.AcceptLanguage.ToString();
            return StoreLocale.Normalize(string.IsNullOrWhiteSpace(header) ? null : header);
        }
    }
}

namespace ECommerce.Services.MappingProfiles
{
    internal static class PictureUrlHelper
    {
        internal static string Combine(string? baseUrl, string? pictureUrl)
        {
            if (string.IsNullOrEmpty(pictureUrl))
                return string.Empty;

            if (pictureUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || pictureUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                return pictureUrl;

            if (string.IsNullOrEmpty(baseUrl))
                return pictureUrl;

            var normalizedPath = pictureUrl.TrimStart('/');
            var encodedPath = string.Join('/', normalizedPath.Split('/').Select(Uri.EscapeDataString));
            return $"{baseUrl.TrimEnd('/')}/{encodedPath}";
        }
    }
}

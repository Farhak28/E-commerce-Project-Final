namespace ECommerce.Shared.Localization;

public static class StoreLocale
{
    public const string English = "en";
    public const string Arabic = "ar";

    public static string Normalize(string? language)
    {
        if (string.IsNullOrWhiteSpace(language))
            return English;

        var primary = language.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault()
            ?.Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault();

        return string.Equals(primary, Arabic, StringComparison.OrdinalIgnoreCase) ? Arabic : English;
    }

    public static string Pick(string language, string english, string arabic) =>
        Normalize(language) == Arabic ? arabic : english;

    public static string Pick(string language, string english, string arabic, params (string Key, string Value)[] vars)
    {
        var text = Pick(language, english, arabic);
        foreach (var (key, value) in vars)
            text = text.Replace($"{{{key}}}", value, StringComparison.Ordinal);
        return text;
    }
}

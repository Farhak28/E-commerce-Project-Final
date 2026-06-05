using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using ECommerce.Shared.CommonResponses;

namespace ECommerce.Services;

public class ProductImageStorage
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif",
        ".svg",
    };

    private const long MaxBytes = 5 * 1024 * 1024;
    private readonly IWebHostEnvironment _environment;

    public ProductImageStorage(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<Result<string>> SaveAsync(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return Error.Validation("Image.Required", "Please choose an image file.");

        if (file.Length > MaxBytes)
            return Error.Validation("Image.TooLarge", "Image must be 5 MB or smaller.");

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
            return Error.Validation(
                "Image.InvalidType",
                "Allowed image types: JPG, PNG, WEBP, GIF, SVG."
            );

        var webRoot = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
            webRoot = Path.Combine(_environment.ContentRootPath, "wwwroot");

        var directory = Path.Combine(webRoot, "images", "products");
        Directory.CreateDirectory(directory);

        var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var fullPath = Path.Combine(directory, fileName);

        await using (var stream = File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        return $"/images/products/{fileName}";
    }

    public void DeleteLocalIfExists(string? pictureUrl)
    {
        if (string.IsNullOrWhiteSpace(pictureUrl))
            return;

        var path = pictureUrl;
        if (Uri.TryCreate(pictureUrl, UriKind.Absolute, out var absolute))
            path = absolute.AbsolutePath;

        if (!path.StartsWith("/images/products/", StringComparison.OrdinalIgnoreCase))
            return;

        var relative = path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var webRoot = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
            webRoot = Path.Combine(_environment.ContentRootPath, "wwwroot");

        var fullPath = Path.Combine(webRoot, relative);
        if (File.Exists(fullPath))
            File.Delete(fullPath);
    }
}

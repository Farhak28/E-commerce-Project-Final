using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities;
using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Domain.Entities.ProductModule;
using ECommerce.Persistence.Data.DbContexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace ECommerce.Persistence.Data.DataSeed
{
    public class DataIntializer : IDataIntializer
    {
        private readonly StoreDbContext _dbContext;
        private readonly IConfiguration _configuration;

        public DataIntializer(StoreDbContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _configuration = configuration;
        }

        public async Task IntializeAsync()
        {
            try
            {
                if (ShouldReloadSeedFromJson())
                {
                    await ReloadSeedDataFromJsonAsync();
                    return;
                }

                var hasProduct = await _dbContext.Products.AnyAsync();
                var hasBrands = await _dbContext.ProductBrands.AnyAsync();
                var hasTypes = await _dbContext.ProductTypes.AnyAsync();
                var hasDeliveryMethods = await _dbContext.Set<DeliveryMethod>().AnyAsync();

                if (hasProduct && hasBrands && hasTypes && hasDeliveryMethods)
                {
                    await BackfillBrandOfficialUrlsAsync();
                    await BackfillProductPictureUrlsFromJsonAsync();
                    await BackfillProductArabicFromJsonAsync();
                    await EnsureDeliverySchedulingSeedAsync();
                    return;
                }

                if (!hasBrands)
                {
                    await SeedDataFromJson<ProductBrand, int>(
                        "brands.json",
                        _dbContext.ProductBrands
                    );
                }

                if (!hasTypes)
                {
                    await SeedDataFromJson<ProductType, int>("types.json", _dbContext.ProductTypes);
                }

                await _dbContext.SaveChangesAsync();

                if (!hasProduct)
                    await SeedDataFromJson<Product, int>("products.json", _dbContext.Products);

                if (!hasDeliveryMethods)
                    await SeedDataFromJson<DeliveryMethod, int>(
                        "delivery.json",
                        _dbContext.Set<DeliveryMethod>()
                    );

                await _dbContext.SaveChangesAsync();
                await BackfillBrandOfficialUrlsAsync();
                await BackfillProductPictureUrlsFromJsonAsync();
                await BackfillProductArabicFromJsonAsync();
                await EnsureDeliverySchedulingSeedAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error occured during data intialization: {ex}");
            }
        }

        private async Task EnsureDeliverySchedulingSeedAsync()
        {
            if (!await _dbContext.Set<DeliverySchedulingSettings>().AnyAsync())
                await SeedDataFromJson<DeliverySchedulingSettings, int>(
                    "delivery-scheduling-settings.json",
                    _dbContext.Set<DeliverySchedulingSettings>()
                );

            if (!await _dbContext.Set<DeliveryPricingRule>().AnyAsync())
                await SeedPricingRulesFromJsonAsync();

            if (!await _dbContext.Set<DeliveryTimeSlot>().AnyAsync())
                await SeedTimeSlotsFromJsonAsync();

            if (!await _dbContext.Set<DeliveryHoliday>().AnyAsync())
                await SeedOptionalJsonArray<DeliveryHoliday, int>("delivery-holidays.json", _dbContext.Set<DeliveryHoliday>());

            if (!await _dbContext.Set<BlockedDeliveryDate>().AnyAsync())
                await SeedOptionalJsonArray<BlockedDeliveryDate, int>("blocked-delivery-dates.json", _dbContext.Set<BlockedDeliveryDate>());

            await _dbContext.SaveChangesAsync();
        }

        private async Task SeedTimeSlotsFromJsonAsync()
        {
            var filePath = ResolveSeedJsonPath("delivery-time-slots.json");
            if (!File.Exists(filePath))
                return;

            await using var dataStream = File.OpenRead(filePath);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var rows = await JsonSerializer.DeserializeAsync<List<DeliveryTimeSlotSeed>>(dataStream, options);
            if (rows is null || rows.Count == 0)
                return;

            foreach (var row in rows)
            {
                if (!TimeOnly.TryParse(row.StartTime, out var start) || !TimeOnly.TryParse(row.EndTime, out var end))
                    continue;

                await _dbContext.Set<DeliveryTimeSlot>().AddAsync(new DeliveryTimeSlot
                {
                    Label = row.Label,
                    StartTime = start,
                    EndTime = end,
                    Capacity = row.Capacity,
                    IsActive = row.IsActive,
                    SortOrder = row.SortOrder,
                });
            }
        }

        private async Task SeedPricingRulesFromJsonAsync()
        {
            var filePath = ResolveSeedJsonPath("delivery-pricing-rules.json");
            if (!File.Exists(filePath))
                return;

            await using var dataStream = File.OpenRead(filePath);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            options.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());

            var rows = await JsonSerializer.DeserializeAsync<List<DeliveryPricingRuleSeed>>(dataStream, options);
            if (rows is null)
                return;

            foreach (var row in rows)
            {
                await _dbContext.Set<DeliveryPricingRule>().AddAsync(new DeliveryPricingRule
                {
                    RuleType = row.RuleType,
                    Label = row.Label,
                    Amount = row.Amount,
                    MinLeadHours = row.MinLeadHours,
                    MaxLeadHours = row.MaxLeadHours,
                    MinLeadDays = row.MinLeadDays,
                    WindowStartHour = row.WindowStartHour,
                    WindowEndHour = row.WindowEndHour,
                    DayOfWeek = row.DayOfWeek,
                    PercentOfBaseCap = row.PercentOfBaseCap,
                    IsActive = row.IsActive,
                    SortOrder = row.SortOrder,
                });
            }
        }

        private async Task SeedOptionalJsonArray<T, TKey>(string fileName, DbSet<T> dbset)
            where T : BaseEntity<TKey>
        {
            var filePath = ResolveSeedJsonPath(fileName);
            if (!File.Exists(filePath))
                return;

            await using var dataStream = File.OpenRead(filePath);
            var data = await JsonSerializer.DeserializeAsync<List<T>>(
                dataStream,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );
            if (data is not null && data.Count > 0)
                await dbset.AddRangeAsync(data);
        }

        private sealed class DeliveryTimeSlotSeed
        {
            public string Label { get; set; } = "";
            public string StartTime { get; set; } = "";
            public string EndTime { get; set; } = "";
            public int Capacity { get; set; }
            public bool IsActive { get; set; } = true;
            public int SortOrder { get; set; }
        }

        private sealed class DeliveryPricingRuleSeed
        {
            public DeliveryPricingRuleType RuleType { get; set; }
            public string Label { get; set; } = "";
            public decimal Amount { get; set; }
            public int? MinLeadHours { get; set; }
            public int? MaxLeadHours { get; set; }
            public int? MinLeadDays { get; set; }
            public int? WindowStartHour { get; set; }
            public int? WindowEndHour { get; set; }
            public DayOfWeek? DayOfWeek { get; set; }
            public decimal? PercentOfBaseCap { get; set; }
            public bool IsActive { get; set; } = true;
            public int SortOrder { get; set; }
        }

        private bool ShouldReloadSeedFromJson()
        {
            // When true, wipes products/brands/types and re-imports JSON on every startup.
            // Leave false in normal use so admin-created products persist in the database.
            var v = _configuration["DataSeed:ReloadFromJsonOnStartup"];
            return string.Equals(v, "true", StringComparison.OrdinalIgnoreCase) || v == "1";
        }

        private async Task ReloadSeedDataFromJsonAsync()
        {
            _dbContext.Products.RemoveRange(_dbContext.Products);
            _dbContext.ProductBrands.RemoveRange(_dbContext.ProductBrands);
            _dbContext.ProductTypes.RemoveRange(_dbContext.ProductTypes);

            var hasOrders = await _dbContext.Set<Order>().AnyAsync();
            if (!hasOrders)
                _dbContext.Set<DeliveryMethod>().RemoveRange(_dbContext.Set<DeliveryMethod>());

            await _dbContext.SaveChangesAsync();

            // Reset identity so JSON 1-based ProductBrandId / ProductTypeId match inserted rows.
            await ReseedTableIdentityAsync("Products");
            await ReseedTableIdentityAsync("ProductBrands");
            await ReseedTableIdentityAsync("ProductTypes");
            if (!hasOrders)
                await ReseedTableIdentityAsync("DeliveryMethod");

            await SeedDataFromJson<ProductBrand, int>("brands.json", _dbContext.ProductBrands);
            await SeedDataFromJson<ProductType, int>("types.json", _dbContext.ProductTypes);
            await _dbContext.SaveChangesAsync();
            await SeedDataFromJson<Product, int>("products.json", _dbContext.Products);

            if (!hasOrders)
                await SeedDataFromJson<DeliveryMethod, int>(
                    "delivery.json",
                    _dbContext.Set<DeliveryMethod>()
                );
            else if (!await _dbContext.Set<DeliveryMethod>().AnyAsync())
                await SeedDataFromJson<DeliveryMethod, int>(
                    "delivery.json",
                    _dbContext.Set<DeliveryMethod>()
                );

            await _dbContext.SaveChangesAsync();
        }

        private async Task ReseedTableIdentityAsync(string tableName)
        {
            var sql = tableName switch
            {
                "Products" => "DBCC CHECKIDENT ('[Products]', RESEED, 0)",
                "ProductBrands" => "DBCC CHECKIDENT ('[ProductBrands]', RESEED, 0)",
                "ProductTypes" => "DBCC CHECKIDENT ('[ProductTypes]', RESEED, 0)",
                "DeliveryMethod" => "DBCC CHECKIDENT ('[DeliveryMethod]', RESEED, 0)",
                _ => throw new ArgumentException($"Invalid table name: {tableName}", nameof(tableName)),
            };

            await _dbContext.Database.ExecuteSqlRawAsync(sql);
        }

        private async Task BackfillProductPictureUrlsFromJsonAsync()
        {
            var filePath = ResolveSeedJsonPath("products.json");
            if (!File.Exists(filePath))
                return;

            await using var dataStream = File.OpenRead(filePath);
            var seedProducts = await JsonSerializer.DeserializeAsync<List<Product>>(
                dataStream,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );
            if (seedProducts is null || seedProducts.Count == 0)
                return;

            var pictureByName = seedProducts
                .Where(p => !string.IsNullOrWhiteSpace(p.PictureUrl))
                .ToDictionary(p => p.Name, p => p.PictureUrl.Trim(), StringComparer.OrdinalIgnoreCase);

            var products = await _dbContext.Products.ToListAsync();
            var changed = false;
            foreach (var product in products)
            {
                if (!pictureByName.TryGetValue(product.Name, out var pictureUrl))
                    continue;
                if (string.Equals(product.PictureUrl, pictureUrl, StringComparison.Ordinal))
                    continue;

                product.PictureUrl = pictureUrl;
                changed = true;
            }

            if (changed)
                await _dbContext.SaveChangesAsync();
        }

        private async Task BackfillProductArabicFromJsonAsync()
        {
            var filePath = ResolveSeedJsonPath("products.json");
            if (!File.Exists(filePath))
                return;

            await using var dataStream = File.OpenRead(filePath);
            using var doc = await JsonDocument.ParseAsync(dataStream);
            if (doc.RootElement.ValueKind != JsonValueKind.Array)
                return;

            var arabicByName = new Dictionary<string, (string? NameAr, string? DescriptionAr)>(
                StringComparer.OrdinalIgnoreCase
            );
            foreach (var item in doc.RootElement.EnumerateArray())
            {
                if (!item.TryGetProperty("Name", out var nameEl))
                    continue;
                var name = nameEl.GetString();
                if (string.IsNullOrWhiteSpace(name))
                    continue;

                string? nameAr = item.TryGetProperty("NameAr", out var nameArEl) ? nameArEl.GetString() : null;
                string? descriptionAr = item.TryGetProperty("DescriptionAr", out var descArEl)
                    ? descArEl.GetString()
                    : null;
                if (!string.IsNullOrWhiteSpace(nameAr) || !string.IsNullOrWhiteSpace(descriptionAr))
                    arabicByName[name] = (nameAr, descriptionAr);
            }

            if (arabicByName.Count == 0)
                return;

            var products = await _dbContext.Products.ToListAsync();
            var changed = false;
            foreach (var product in products)
            {
                if (!arabicByName.TryGetValue(product.Name, out var arabic))
                    continue;

                if (!string.IsNullOrWhiteSpace(arabic.NameAr) && product.NameAr != arabic.NameAr)
                {
                    product.NameAr = arabic.NameAr;
                    changed = true;
                }

                if (
                    !string.IsNullOrWhiteSpace(arabic.DescriptionAr)
                    && product.DescriptionAr != arabic.DescriptionAr
                )
                {
                    product.DescriptionAr = arabic.DescriptionAr;
                    changed = true;
                }
            }

            if (changed)
                await _dbContext.SaveChangesAsync();
        }

        private async Task BackfillBrandOfficialUrlsAsync()
        {
            var filePath = ResolveSeedJsonPath("brands.json");
            if (!File.Exists(filePath))
                return;

            await using var dataStream = File.OpenRead(filePath);
            var seedBrands = await JsonSerializer.DeserializeAsync<List<ProductBrand>>(
                dataStream,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );
            if (seedBrands is null || seedBrands.Count == 0)
                return;

            var urlByName = seedBrands
                .Where(b => !string.IsNullOrWhiteSpace(b.OfficialWebsiteUrl))
                .ToDictionary(b => b.Name, b => b.OfficialWebsiteUrl!, StringComparer.OrdinalIgnoreCase);

            var brands = await _dbContext.ProductBrands.ToListAsync();
            var changed = false;
            foreach (var brand in brands)
            {
                if (!string.IsNullOrWhiteSpace(brand.OfficialWebsiteUrl))
                    continue;
                if (urlByName.TryGetValue(brand.Name, out var url))
                {
                    brand.OfficialWebsiteUrl = url;
                    changed = true;
                }
            }

            if (changed)
                await _dbContext.SaveChangesAsync();
        }

        private async Task SeedDataFromJson<T, TKey>(string fileName, DbSet<T> dbset)
            where T : BaseEntity<TKey>
        {
            var filePath = ResolveSeedJsonPath(fileName);

            if (!File.Exists(filePath))
                throw new FileNotFoundException("Json file not found", filePath);

            try
            {
                await using var dataStream = File.OpenRead(filePath);

                var data = await JsonSerializer.DeserializeAsync<List<T>>(
                    dataStream,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (data is not null)
                {
                    await dbset.AddRangeAsync(data);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error while reading data from Json {ex} ");
            }
        }

        private static string ResolveSeedJsonPath(string fileName)
        {
            var candidates = new List<string>();

            foreach (var root in FindCornerStoreRoots())
            {
                candidates.Add(Path.Combine(root, "database", "seed-data", fileName));
            }

            candidates.Add(Path.Combine(AppContext.BaseDirectory, "Data", "DataSeed", "JsonFiles", fileName));

            var asmPath = typeof(DataIntializer).Assembly.Location;
            if (!string.IsNullOrEmpty(asmPath))
            {
                var asmDir = Path.GetDirectoryName(asmPath);
                if (asmDir is not null)
                    candidates.Add(Path.Combine(asmDir, "Data", "DataSeed", "JsonFiles", fileName));
            }

            candidates.Add(
                Path.GetFullPath(
                    Path.Combine(
                        AppContext.BaseDirectory,
                        "..",
                        "..",
                        "..",
                        "..",
                        "ECommerce.Persistence",
                        "Data",
                        "DataSeed",
                        "JsonFiles",
                        fileName
                    )
                )
            );

            foreach (var path in candidates)
            {
                if (File.Exists(path))
                    return path;
            }

            throw new FileNotFoundException(
                $"Seed JSON not found: {fileName}. Checked: {string.Join("; ", candidates)}"
            );
        }

        private static IEnumerable<string> FindCornerStoreRoots()
        {
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var roots = new List<string>();

            void TryAdd(string? path)
            {
                if (string.IsNullOrWhiteSpace(path))
                    return;

                var full = Path.GetFullPath(path);
                if (!seen.Add(full))
                    return;

                if (Directory.Exists(Path.Combine(full, "database", "seed-data")))
                    roots.Add(full);
            }

            var dir = AppContext.BaseDirectory;
            for (var i = 0; i < 8 && !string.IsNullOrEmpty(dir); i++)
            {
                TryAdd(dir);
                dir = Path.GetDirectoryName(dir);
            }

            return roots;
        }
    }
}

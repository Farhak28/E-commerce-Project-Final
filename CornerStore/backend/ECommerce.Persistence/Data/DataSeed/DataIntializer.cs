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
                    return;

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
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error occured during data intialization: {ex}");
            }
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
            var candidates = new List<string>
            {
                Path.Combine(AppContext.BaseDirectory, "Data", "DataSeed", "JsonFiles", fileName),
            };

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
    }
}

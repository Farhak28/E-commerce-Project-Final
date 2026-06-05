-- Corner Store / CornerStoreDb — manual SQL Server bootstrap (optional)
-- Prefer EF Core migrations from the backend project for schema creation.

-- Example: ensure databases exist (run as sa)
-- CREATE DATABASE ECommerceDBOnline;
-- GO
-- CREATE DATABASE [ECommerceDBOnline.Security];
-- GO

-- After databases exist, run from /backend:
-- dotnet ef database update -p ECommerce.Persistence/ECommerce.Persistence.csproj -s CornerStore.Api/CornerStore.Api.csproj --context StoreDbContext

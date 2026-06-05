# Corner Store — Database

This folder holds **supporting** database artifacts for the graduation project. Entity Framework Core migrations remain in the backend project:

`backend/ECommerce.Persistence/Data/Migrations/`

## Database names (Docker / local)

| Database | Purpose |
|----------|---------|
| `ECommerceDBOnline` | Catalog, orders, baskets |
| `ECommerceDBOnline.Security` | ASP.NET Identity users & roles |

> Names are kept for compatibility with existing EF migrations. The public store name is **Corner Store** (`CornerStore` in technical identifiers).

## Contents

- `seed-data/` — JSON seed files mirrored from the backend (`brands`, `types`, `products`, `delivery`)
- `scripts/` — optional SQL helpers
- `diagrams/` — place ERD exports (e.g. `erd.png`)
- `backups/` — optional `.bak` or export files
- `init.sql` — notes for manual SQL Server setup

## Product images

Seed data references `/images/products/...` under the API `wwwroot`. Place image files in:

`backend/CornerStore.Api/wwwroot/images/products/`

## Manual initialization

With SQL Server running locally:

```bash
cd backend
dotnet ef database update -p ECommerce.Persistence/ECommerce.Persistence.csproj -s CornerStore.Api/CornerStore.Api.csproj --context StoreDbContext
```

Identity database migrations are applied automatically when the API starts.

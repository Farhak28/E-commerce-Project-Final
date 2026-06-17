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

**Important:** The API reads `products.json` from this folder (`database/seed-data/`) on startup and **updates `PictureUrl` in the database** when product names match. Editing JSON alone is enough after you **restart the API** — you do not need to wipe the database.

`PictureUrl` can be:

- An external URL: `https://images.unsplash.com/...`
- A local API path: `/images/products/iphone-14.jpg`

For local files, place images in:

`backend/CornerStore.Api/wwwroot/images/products/`

Keep a copy in sync at `backend/ECommerce.Persistence/Data/DataSeed/JsonFiles/products.json` if you deploy with Docker (that file is baked into the image).

## Manual initialization

With SQL Server running locally:

```bash
cd backend
dotnet ef database update -p ECommerce.Persistence/ECommerce.Persistence.csproj -s CornerStore.Api/CornerStore.Api.csproj --context StoreDbContext
```

Identity database migrations are applied automatically when the API starts.

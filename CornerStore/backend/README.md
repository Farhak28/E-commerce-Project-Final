# Corner Store — Backend

ASP.NET Core 8 solution (`CornerStore.sln`) with layered projects:

| Project | Role |
|---------|------|
| `CornerStore.Api` | Host, Swagger, middleware, Docker entry |
| `ECommerce.Presentation` | API controllers |
| `ECommerce.Services` | Business logic |
| `ECommerce.Persistence` | EF Core, migrations, repositories |
| `ECommerce.Domain` | Entities |
| `ECommerce.Shared` | Shared DTOs |

## Run locally

```bash
dotnet restore
dotnet run --project CornerStore.Api/CornerStore.Api.csproj --urls "http://localhost:5141"
```

## Migrations

```bash
dotnet ef database update -p ECommerce.Persistence/ECommerce.Persistence.csproj -s CornerStore.Api/CornerStore.Api.csproj --context StoreDbContext
```

Migrations live in `ECommerce.Persistence/Data/Migrations/` (not in `/database`).

## Docker

Built from `CornerStore.Api/Dockerfile` with context `backend/`.

## Configuration

Copy `.env.example` values into `appsettings.Development.json` or user secrets. Docker uses `appsettings.Docker.json`.

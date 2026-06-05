# Corner Store — Project Deliverables

Full-stack e-commerce graduation project:

```
CornerStore/
├── frontend/
├── backend/
├── database/
├── docker-compose.yml
└── README.md
```

## Stack

- **Corner Store** (Next.js 16 + ASP.NET Core 8 + SQL Server + Redis)
- Docker Compose services: `frontend`, `backend`, `database`, `redis`

## Build status

- `npm run build` in `CornerStore/frontend/` — passes
- `dotnet build CornerStore/backend/CornerStore.sln` — passes

## Run

```bash
cd CornerStore
docker compose up --build
```

See `CornerStore/README.md` for manual setup, migrations, and demo accounts.

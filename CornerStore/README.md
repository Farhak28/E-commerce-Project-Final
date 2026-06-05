# Corner Store

**Corner Store** is a full-stack e-commerce graduation project with a Next.js storefront, ASP.NET Core Web API, SQL Server, Redis, and Docker Compose.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | ASP.NET Core 8, EF Core |
| Database | SQL Server 2022 |
| Cache | Redis 7 |
| Auth | JWT + ASP.NET Identity |

## Folder structure

Run all commands from this directory (`CornerStore/`):

```
CornerStore/
├── frontend/          # Next.js app (App Router)
├── backend/           # CornerStore.sln + API + domain layers
├── database/          # Seed JSON, SQL notes, diagrams, backups
├── docker-compose.yml
└── README.md
```

## Main features

- Product catalog with search, filters, and sorting
- Shopping cart, checkout, and Stripe-ready payment flow
- User registration, login, wishlist, and account orders
- **DB-backed notifications** (welcome seeds, order confirmations, unread badge)
- **Account dashboard** with loyalty tier, points, and profile completion from real data
- **Admin analytics** — revenue by month, orders by status, engagement metrics
- AI shopping assistant (floating + Help page), product compare, recommendations API
- Product reviews with live API and sentiment hints
- Visual search, EN/AR UI labels, and dark mode

## Quick start — Docker Compose

From this folder (`CornerStore/`):

```bash
cd CornerStore
docker compose up --build
```

Stop and remove containers:

```bash
docker compose down
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3848 |
| Backend API / Swagger | http://localhost:5141/swagger |
| SQL Server | localhost:1433 |
| Redis | localhost:6379 |

Override host ports with `.env` (copy from `.env.example`):

```env
FRONTEND_PORT=3848
API_PORT=5141
```

## Run frontend manually

```bash
cd CornerStore/frontend
# or from CornerStore/: cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3848

## Run backend manually

```bash
cd CornerStore/backend
# or from CornerStore/: cd backend
dotnet restore
dotnet run --project CornerStore.Api/CornerStore.Api.csproj --urls "http://localhost:5141"
```

Swagger: http://localhost:5141/swagger

## Database migrations

Run from `backend` (catalog database):

```bash
cd backend
dotnet ef database update -p ECommerce.Persistence/ECommerce.Persistence.csproj -s CornerStore.Api/CornerStore.Api.csproj --context StoreDbContext
```

The API also auto-applies migrations on startup. Identity schema is seeded when the API runs.

Latest store migration: `20260521120000_AddNotifications` (Notifications table).

After pulling updates, run (from `CornerStore/backend`):

```bash
cd CornerStore/backend
dotnet ef database update -p ECommerce.Persistence/ECommerce.Persistence.csproj -s CornerStore.Api/CornerStore.Api.csproj --context StoreDbContext
```

## Environment variables

**Frontend** (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:5141/api
```

**Backend** — see `backend/.env.example` for connection strings and JWT settings. Do not commit real secrets.

> This project uses Next.js (`NEXT_PUBLIC_*`), not Vite. The API base URL is `NEXT_PUBLIC_API_URL`.

## First admin account

No default login credentials are shipped. On a **new** identity database (no users yet), set these environment variables before the first API start (do not commit real passwords):

```env
BootstrapAdmin__Email=you@example.com
BootstrapAdmin__Password=your-secure-password
BootstrapAdmin__DisplayName=Store Admin
BootstrapAdmin__Role=SuperAdmin
```

If the database already contains the old demo users, remove them via **Admin → Users** or reset volumes: `docker compose down -v` (this deletes all data).

## Troubleshooting

- **Port in use** — set `FRONTEND_PORT` / `API_PORT` in `.env`, then `docker compose down` and restart.
- **Backend cannot reach SQL** — wait until the `database` service is healthy; connection host inside Compose is `database`, not `localhost`.
- **Empty product images** — a default `placeholder.svg` ships in `backend/CornerStore.Api/wwwroot/images/products/`. Replace or add files to match custom `PictureUrl` paths in seed JSON.
- **Stale containers** — `docker compose down` before `docker compose up --build`.

## API documentation

Swagger UI: http://localhost:5141/swagger (title: **Corner Store API**)

## Upgrade notes (polish pass)

| Area | What changed |
|------|----------------|
| Notifications | `GET/PUT /api/Notifications`, SQL persistence, nav unread badge |
| Account | `GET /api/Account/dashboard` — orders, loyalty, interests from purchase history |
| Admin | `GET /api/Admin/analytics` — charts on admin home |
| Help | Reuses `assistant-logic` (same as floating assistant) |
| Images | Seed paths point to `/images/products/placeholder.svg` |

## License

Academic / graduation project — use and adapt with attribution as required by your institution.

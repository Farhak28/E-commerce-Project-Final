# Corner Store — Frontend

Next.js 16 App Router storefront for **Corner Store**.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:5141/api`) |
| `API_INTERNAL_URL` | Used in Docker for server-side fetches to the `backend` service |

## Scripts

- `npm run dev` — development server on port 3848
- `npm run build` — production build
- `npm run start` — production server
- `npm run docker:up` / `docker:down` — shortcuts for root Compose (from repo root)

## Structure

- `app/` — routes (home, products, cart, checkout, admin, …)
- `components/` — UI and feature components
- `lib/` — API clients, contexts, types, utilities

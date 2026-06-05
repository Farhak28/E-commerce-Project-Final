#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if command -v docker >/dev/null 2>&1; then
  echo "Starting SQL Server + Redis (Docker)..."
  docker compose -f "$ROOT/docker-compose.yml" up -d database redis
  echo "Waiting for SQL Server (up to 60s)..."
  for i in $(seq 1 30); do
    if nc -z localhost 1433 2>/dev/null; then
      echo "SQL Server is up."
      break
    fi
    sleep 2
  done
  export ASPNETCORE_ENVIRONMENT=Docker
else
  echo "Docker not found — using Development settings (needs local SQL Server + Redis)."
  export ASPNETCORE_ENVIRONMENT=Development
fi

echo "Starting Corner Store API on http://localhost:5141 ..."
cd "$ROOT/backend"
exec dotnet run --project CornerStore.Api/CornerStore.Api.csproj --urls "http://localhost:5141"

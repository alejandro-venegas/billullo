# Billullo

A personal finance application for tracking transactions, categories, and automated email-based transaction parsing.

## Tech Stack

- **Frontend:** React 19, TypeScript, MUI (Material UI), MobX, Vite
- **Backend:** .NET (ASP.NET Core)

## Project Structure

```
billullo/
  backend/          # .NET API (Billullo.Api)
  frontend/         # React SPA
```

## Getting Started

### Backend

```bash
cd backend/Billullo.Api
dotnet run
```

The API starts at `http://localhost:5000` by default. In development, the database is auto-migrated on startup.

#### Required Secrets

Secrets are managed via `dotnet user-secrets` for local development. Run these once from `backend/Billullo.Api/`:

```bash
dotnet user-secrets init
```

Then set each required secret:

| Secret key | Description |
|---|---|
| `Jwt:Secret` | Long random string used to sign JWT tokens (≥ 32 chars) |
| `FreeCurrencyApi:ApiKey` | API key from [freecurrencyapi.com](https://freecurrencyapi.com) (free tier works) |

```bash
dotnet user-secrets set "Jwt:Secret" "<your-jwt-secret>"
dotnet user-secrets set "FreeCurrencyApi:ApiKey" "<your-api-key>"
```

#### Exchange Rate Sync

The backend automatically fetches USD/CRC exchange rates from FreeCurrencyAPI every 4 hours and stores them in the `ExchangeRates` table. Rates are fetched on startup and then on each 4-hour interval. This data will be used for currency conversion in balance calculations and reports.

### Frontend

```bash
cd frontend
npm install
npm run dev        # Start dev server (proxies /api to localhost:5000)
npm run build      # Production build (tsc + vite build)
npm run lint       # ESLint
```

### API Client Generation

The frontend API client is auto-generated from the backend Swagger spec:

```bash
cd frontend
npm run generate-api
```

This reads `backend/Billullo.Api/swagger.json` and outputs typed clients to `frontend/src/api/`.

## Frontend Architecture

The frontend follows a **feature-based architecture**. See [`frontend/AGENTS.md`](frontend/AGENTS.md) for detailed conventions.

```
src/
  app/              # Application shell: providers, routing, layout
  api/              # Auto-generated API clients (swagger-typescript-api)
  shared/           # Shared components, hooks, stores, utilities
  features/         # Feature modules (auth, transactions, categories, email)
```

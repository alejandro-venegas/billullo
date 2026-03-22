# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Billullo is a personal finance application for tracking transactions with automated email-based transaction parsing via AI (OpenAI). It has a .NET 10 backend and React 19 frontend.

## Commands

### Backend

```bash
# Run (from backend/Billullo.Api/)
dotnet run

# Build
dotnet build backend/Billullo.Api/Billullo.Api.csproj

# Watch mode (hot reload)
dotnet watch run --project backend/Billullo.Api/Billullo.Api.csproj

# Add a new migration
dotnet ef migrations add <MigrationName> --project backend/Billullo.Api
```

### Frontend

```bash
# Install dependencies
cd frontend && npm install

# Dev server (proxies /api → localhost:5000)
npm run dev

# Production build (tsc + vite)
npm run build

# Lint
npm run lint

# Regenerate API clients from backend swagger.json
npm run generate-api
```

### Database

```bash
# Start PostgreSQL (required before running the backend)
docker-compose up -d
```

### First-time secrets setup

Run once from `backend/Billullo.Api/`:

```bash
dotnet user-secrets init
dotnet user-secrets set "Jwt:Secret" "<≥32-char random string>"
dotnet user-secrets set "ExchangeRateApi:ApiKey" "<exchangerate-api.com key>"
dotnet user-secrets set "OpenAi:ApiKey" "<openai key>"
```

## Architecture

### Backend (`backend/Billullo.Api/`)

- **Layered**: Controllers → Services (via interfaces) → EF Core (`AppDbContext`)
- **Auth**: ASP.NET Identity + JWT. `AppUser` extends `IdentityUser`. JWT in development has 1-year expiry (`appsettings.Development.json`).
- **DTOs**: AutoMapper (`MappingProfile.cs`) converts between domain models and DTOs
- **Database**: PostgreSQL via Npgsql EF Core provider. Migrations auto-run on startup in development. `SaveChanges` normalizes all `DateTime` values to UTC.
- **Background services**: `CurrencyRateSyncService` (fetches USD/CRC rates every 4h), `EmailScrapingService` (listens for emails to parse into transactions)
- **AI email parsing**: `AiEmailParserService` sends email content to OpenAI ChatGPT to extract transaction data

### Frontend (`frontend/src/`)

The frontend follows a strict **feature-based architecture** (see `frontend/AGENTS.md` for full conventions).

**Dependency hierarchy** (enforced — do not violate):
```
app/ → features/, shared/, api/
features/ → shared/, api/, other features/ (barrel exports only)
shared/ → api/
api/ → (standalone, do not edit manually)
```

**State management**: MobX with `makeAutoObservable`. `RootStore` (in `app/stores/`) aggregates all feature stores. Use `useStore()` hook to access stores in components.

**API clients**: Auto-generated from backend Swagger spec via `swagger-typescript-api`. Only `src/api/apiConfig.ts` is maintained manually — it handles token storage, refresh logic, and exports client instances. Run `npm run generate-api` after backend API changes; reads from `backend/Billullo.Api/swagger.json`.

**Styling**: MUI `sx` prop preferred. Use `.module.less` files only when MUI styling is insufficient. Theme in `app/theme.ts`.

**Component structure**: Each component in its own folder `ComponentName/ComponentName.tsx`. Add `ComponentName.module.less` or `ComponentNameStore.ts` only if needed.

**Imports**: Use `@/` path alias for cross-module imports. Cross-feature imports must go through the feature's `index.ts` barrel export.

### Key Domain Models

- **Transaction**: core entity with `Amount`, `Currency` (USD/CRC), `Type` (Expense/Income), `Source` (Manual/Email/Adjustment), linked to `Category` and `Account`
- **Account**: groups transactions, supports multiple currencies with a fallback currency
- **Category**: hierarchical (supports `ParentCategoryId`), with `CategoryRule`s for auto-categorization
- **EmailConfig**: stores user's email credentials (password encrypted) for scraping
- **EmailParsingRule**: patterns for parsing email content into transactions
- **ExchangeRate**: cached USD/CRC rates fetched every 4h

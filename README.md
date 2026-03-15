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

See the backend directory for .NET setup instructions.

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

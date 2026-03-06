# Horizon Monorepo

Horizon is a TypeScript monorepo with a backend API, frontend client, and shared domain package.

This repository is backend-first for interview/recruiter review:
- Production-style Express API architecture (controllers/services/models/middleware)
- JWT + refresh-session auth flow (local + OAuth providers)
- Validation/error normalization patterns
- Basic reliability suite with Vitest + Supertest

## Tech Stack
- Backend: Node.js, Express 5, TypeScript, Mongoose, JWT, Winston
- Frontend: React, Vite, TypeScript, Redux Toolkit
- Shared: cross-package types/constants/interfaces
- Tooling: npm workspaces, TypeScript project references, Vitest

## Repository Layout
```txt
.
├─ apps/
│  ├─ backend/
│  │  ├─ src/
│  │  ├─ test/
│  │  ├─ .env.example
│  │  └─ vitest.config.ts
│  └─ frontend/
├─ shared/
└─ package.json
```

## Prerequisites
- Node.js 20+
- npm 10+
- MongoDB running locally (default: `mongodb://localhost:27017/horizon`)

## Quick Start
1. Install dependencies from repo root:
```bash
npm install
```

2. Create backend env file:
```bash
cp apps/backend/.env.example apps/backend/.env
```
If you are on Windows PowerShell:
```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
```

3. Start development servers:
```bash
npm run dev
```

This runs shared build/watch + backend + frontend concurrently.

## Important Scripts
From repo root:
- `npm run build` - builds shared, backend, and frontend
- `npm test` - runs workspace tests (backend currently)
- `npm run dev` - runs full local development stack
- `npm run dev:backend` - backend only

Backend workspace:
- `npm run build --workspace=apps/backend`
- `npm run test --workspace=apps/backend`

## Environment Variables (Backend)
See:
- [apps/backend/.env.example](apps/backend/.env.example)

Required keys include:
- `PORT`
- `MONGO_URI`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `CORS_ORIGIN`
- OAuth keys for Google/GitHub callbacks

Never commit real secrets. Use placeholders in `.env.example` only.

## API Base URL
- `http://localhost:5000/api/v1`

Health endpoints:
- `GET /health`
- `GET /health/ready`

## Testing
Backend uses Vitest and Supertest.

Current suite covers:
- model validation/indexes (`SessionModel`)
- middleware behavior (`requireAuth` unauthorized path)
- health endpoint integration checks
- auth service failure-path unit tests

Run:
```bash
npm run test --workspace=apps/backend
```

## Notes For Recruiters
- Backend is the primary focus for this project.
- Frontend exists as a client workspace but the API architecture and backend quality are the core deliverables.
- Project is organized for maintainability with explicit service and middleware boundaries.

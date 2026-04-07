# Horizon Monorepo

Horizon is a backend-focused TypeScript monorepo built to showcase API design, authentication, validation, and maintainable service architecture.

This repository is intentionally backend-first for interview/recruiter review:
- Production-style Express API architecture (controllers/services/models/middleware)
- JWT + refresh-session auth flow (local + OAuth providers)
- OpenAPI/Swagger documentation for recruiter-friendly API exploration
- Validation/error normalization patterns
- Rate limiting, health probes, and cache-aware controller behavior
- Basic reliability suite with Vitest + Supertest

The frontend workspace is included only as a supporting client shell. The backend API, shared contracts, and operational structure are the primary deliverables in this project.

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
- Redis running locally (default: `redis://localhost:6379`)

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

This runs shared build/watch, the backend API, and the supporting frontend workspace concurrently.

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

## API Base URL
- `http://localhost:5000/api/v1`

Health endpoints:
- `GET /health`
- `GET /health/ready`

API documentation:
- Swagger UI: `http://localhost:5000/api/v1/api-docs`
- OpenAPI JSON: `http://localhost:5000/api/v1/api-docs.json`

Auth flow:
- `POST /auth/signup` and `POST /auth/login` return an access token in the JSON response
- The backend also sets an HTTP-only refresh token cookie
- Protected routes use `Authorization: Bearer <accessToken>`
- `POST /auth/refresh` rotates the refresh cookie and returns a new access token
- `POST /auth/logout` clears the refresh cookie

## Testing
Backend uses Vitest and Supertest.

Current suite covers:
- model validation/indexes (`SessionModel`)
- middleware behavior (`requireAuth` unauthorized path)
- health endpoint integration checks
- controller cache behavior for `/auth/me` and `/tasks`
- auth service failure-path unit tests

Run:
```bash
npm run test --workspace=apps/backend
```

## Notes For Recruiters
- Backend is the primary focus for this project.
- Frontend exists as a supporting workspace; evaluation should focus on the backend API architecture and engineering quality.
- Project is organized for maintainability with explicit service and middleware boundaries.
- MongoDB is treated as a required dependency at startup; Redis caching is optional and degrades gracefully when unavailable.
- Start with Swagger at `http://localhost:5000/api/v1/api-docs` to inspect the API contract, examples, auth flow, and error responses.

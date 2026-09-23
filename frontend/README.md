# Frontend - ThesisHub Management System

A modern React + TypeScript frontend for the Spring Boot REST API backend.

## Features

- **Authentication**: Login for Students, Supervisors, Committee Members, and External Examiners
- **Student Dashboard**: 
  - Find and form groups
  - Create/register projects
  - Request supervisors
  - Upload documents
  - Chat with supervisors
- **Supervisor Dashboard**:
  - View student requests
  - Manage assigned groups
  - Evaluate projects
- **Committee Member Dashboard**:
  - Manage evaluations
  - Upload templates
  - View analytics & audit logs
- **External Examiner Dashboard**:
  - Review assigned groups
  - Submit evaluations
- **i18n**: English & Vietnamese

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router
- Axios
- JWT Authentication (Bearer token)
- i18next (i18n)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment config:
```bash
cp .env.example .env
```

3. Make sure your Spring Boot backend is running on `http://localhost:8080`

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts (Auth, Theme)
│   ├── locales/         # i18n translation files (en, vi)
│   ├── pages/           # Page components (dashboards)
│   ├── services/
│   │   ├── api.ts       # API service layer (Axios)
│   │   └── endpoints.ts # Centralized API endpoint paths
│   ├── types/           # TypeScript type definitions (API contract)
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main app component with routing
│   ├── main.tsx         # Entry point
│   └── App.css          # Global styles
├── public/              # Static assets
├── e2e/                 # Playwright E2E tests
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## API Configuration

- All API endpoint paths are centralized in `src/services/endpoints.ts`
- The Vite dev server proxies `/api` requests to `http://localhost:8080`
- When the backend endpoints change, **only update `endpoints.ts`**

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Testing

```bash
# Unit tests
npm test

# E2E tests (Playwright)
npm run test:e2e
```

## Development Notes

- The app uses JWT tokens stored in localStorage
- Token refresh is handled automatically by the API service interceptor
- Protected routes require authentication
- Each user type has a dedicated dashboard with role-specific features
- `src/types/index.ts` serves as the **API contract** — backend DTOs should match these interfaces

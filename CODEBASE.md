# meghax-external-job-board — Job Board Codebase Reference

> Public-facing SPA for external job candidates. No Meghax staff account required.
> Local URL: http://localhost:5175

---

## Table of Contents

- [Directory Structure](#directory-structure)
- [Pages & Routes](#pages--routes)
- [Auth Flow](#auth-flow)
- [API Endpoints Used](#api-endpoints-used)
- [Environment Variables](#environment-variables)

---

## Directory Structure

```
meghax-external-job-board/src/
├── pages/                     # 8 page components
│   ├── LandingPage.tsx        # Home — job search entry
│   ├── JobListPage.tsx        # Browse all open jobs
│   ├── JobDetailPage.tsx      # Single job detail + apply button
│   ├── LoginPage.tsx          # Candidate login
│   ├── RegisterPage.tsx       # Candidate registration
│   ├── DashboardPage.tsx      # Candidate's application dashboard (auth required)
│   ├── ApplicationDetailPage.tsx  # Single application detail (auth required)
│   └── ApplicationSuccessPage.tsx # Post-apply confirmation
│
├── api/
│   ├── client.ts              # Axios instance (base URL from VITE_API_BASE_URL)
│   ├── jobs.ts                # All API call functions
│   └── types.ts               # TypeScript types for Job, Application, User, etc.
│
├── components/
│   ├── ProtectedRoute.tsx     # Wrapper for auth-required pages
│   └── ResumeMatcherResults.tsx # AI resume match score display
│
├── context/
│   └── ThemeContext.tsx        # Dark / light mode toggle
│
└── layouts/
    └── MainLayout.tsx          # Shared shell (header, footer)
```

---

## Pages & Routes

| Path | Page | Auth Required | Purpose |
|------|------|:---:|---------|
| `/` | `LandingPage` | No | Job search landing |
| `/jobs` | `JobListPage` | No | Browse all open jobs |
| `/jobs/:uuid` | `JobDetailPage` | No | Job details + AI resume analysis + apply |
| `/login` | `LoginPage` | No | Candidate login |
| `/register` | `RegisterPage` | No | Candidate sign-up |
| `/application-success` | `ApplicationSuccessPage` | No | Post-apply confirmation screen |
| `/dashboard` | `DashboardPage` | **Yes** | Candidate's application history |
| `/applications/:uuid` | `ApplicationDetailPage` | **Yes** | Specific application status + details |

Protected routes use `<ProtectedRoute>` component which checks for a stored token.

---

## Auth Flow

This app uses **simple token auth** (not Passport OAuth2 like the main client):

```
Register:
  POST /api/job-board/register  → returns { token }

Login:
  POST /api/job-board/login     → returns { token }

Token stored in localStorage.
Protected API calls: Authorization: Bearer {token}
```

**Difference from `meghax-client-v2`:**
- No Passport OAuth2, no refresh token
- No workspace headers (`X-Workspace-Type`, `X-Workspace-Id`)
- Candidates only access their own data — no company scoping

---

## API Endpoints Used

All calls go to `VITE_API_BASE_URL` (backend `meghax-backend-v2`).

### Public Endpoints (no auth)

| Method | Endpoint | Function | Purpose |
|--------|----------|----------|---------|
| GET | `/api/public/jobs/{uuid}` | `fetchJobByUuid()` | Load a single job posting |
| POST | `/api/public/jobs/{uuid}/apply` | `applyToJob()` | Submit a job application |
| POST | `/api/public/jobs/{uuid}/analyze-resume` | `analyzeResume()` | AI resume scoring vs job |
| POST | `/api/public/jobs/{uuid}/upload` | `uploadPublicAttachment()` | Upload resume file before applying |
| POST | `/api/public/jobs/{uuid}/parse-resume` | `parseResumePublic()` | AI-powered resume data extraction |
| POST | `/api/job-board/register` | `registerCandidate()` | Candidate registration |
| POST | `/api/job-board/login` | `loginCandidate()` | Candidate login |

### Authenticated Endpoints (candidate token required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/job-board/jobs` | List all active jobs |
| GET | `/api/job-board/my-applications` | Candidate's application list |
| GET | `/api/job-board/applications/{uuid}` | Single application detail |

---

## Environment Variables

| Variable | Local Value | Purpose |
|----------|------------|---------|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Backend API base URL |

**Local `.env.local`:**
```
VITE_API_BASE_URL=http://localhost:8080/api
```

**Start dev server:**
```bash
npm run dev   # Runs on port 5175 (5174 if not in use)
```

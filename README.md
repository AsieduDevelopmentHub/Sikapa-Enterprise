# Sikapa Enterprise

<div align="center">

### Modern Multi-Platform Commerce Infrastructure

A scalable, production-oriented eCommerce ecosystem powering beauty, cosmetics, personal care, and lifestyle retail experiences across web, backend services, and mobile platforms.

</div>

---

## Latest update — May 2026

**Release:** [`mobile-v1.2.1`](https://github.com/AsieduDevelopmentHub/Sikapa-Enterprise/releases/tag/mobile-v1.2.1) — Android APK/AAB built and published via GitHub Actions on tag push. CI now runs format, analyze, test, and release builds on the same workflow.

### Mobile (`mobile/`)

| Area | What shipped |
|------|----------------|
| **Shopper app** | Phases 1–4 complete: checkout/shipping, variants, reviews, returns, OAuth, 2FA, dark theme, tablet layouts, help, recently viewed, shipped-order local notifications |
| **Admin portal** | In-app `/admin` for `is_admin` users — dashboard, orders (status/ship/cancel), products, customers, returns, inventory, reviews, payments, coupons, staff, settings, audit |
| **Admin extras** | Product create/edit (multipart + image), categories CRUD, new-order local alerts (poll; FCM later) |
| **Android build** | Core library desugaring enabled for `flutter_local_notifications` |
| **Docs** | [`mobile/README.md`](mobile/README.md), [`mobile/MOBILE_ROADMAP.md`](mobile/MOBILE_ROADMAP.md) |

```bash
# Install latest release build locally (production API)
cd mobile && flutter pub get
flutter run --dart-define=SIKAPA_API_BASE=https://sikapa-backend.onrender.com/api/v1
```

Pre-tag checks (matches CI):

```powershell
.\scripts\ci-local.ps1 -MobileOnly -SkipAndroidBuild   # fast
.\scripts\ci-local.ps1 -MobileOnly                     # includes release APK
```

### Repo & CI

- **Tag workflow:** `mobile-v*` triggers build + GitHub Release upload (see [`.github/workflows/README.md`](.github/workflows/README.md))
- **Git hooks:** [`.githooks/`](.githooks/) strip `Co-authored-by` and attribution trailers — enable with `git config core.hooksPath .githooks` (requires Python on `PATH`)

### Still on web `/system` (optional later on mobile)

Coupon CRUD, bulk import, staff role editor, category image upload — use the Next.js admin until ported.

### Next (when you resume)

- Device-test admin + shopper flows on a physical phone with the `mobile-v1.2.1` APK
- Align `pubspec.yaml` version with release tags (`1.2.1+3`)
- iOS TestFlight when Apple signing secrets are configured
- FCM for admin new-order push (replacing poll-based alerts)

---

# Overview

Sikapa Enterprise is a full-stack commerce platform designed to support modern online retail operations with a strong focus on:

- Scalability
- Security
- Performance
- Maintainability
- Multi-platform deployment

The platform currently powers:

- A modern Next.js storefront
- A FastAPI backend API
- PostgreSQL/Supabase-compatible database infrastructure
- Flutter mobile applications
- Automated CI/CD mobile release pipelines
- Structured production deployment workflows

---

# Core Features

## Commerce & Storefront

- Product catalog management
- Cosmetics and beauty-focused storefront
- Cart and checkout infrastructure
- Authentication and session management
- Responsive mobile-first UI
- Category and inventory support
- Payment integration support
- Dynamic API-driven frontend

---

## Backend Infrastructure

- FastAPI-powered REST API
- JWT authentication system
- Refresh token support
- Structured validation and error handling
- Audit logging system
- Soft-delete architecture
- Role-based admin support
- Secure environment configuration
- Production-ready middleware and CORS handling

---

## Mobile Infrastructure

- Flutter storefront + **in-app admin portal** (`/admin`)
- Android release builds (APK + AAB on tagged releases)
- iOS validation / TestFlight workflow (optional secrets)
- Runtime configuration via `--dart-define`
- GitHub Actions: format, analyze, test, build, and release publish

---

# Technology Stack

| Layer | Technologies |
|------|--------------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLModel, SQLAlchemy |
| Database | PostgreSQL, Supabase |
| Mobile | Flutter (Dart) |
| CI/CD | GitHub Actions |
| Authentication | JWT Access & Refresh Tokens |
| Hosting | Vercel, Render |
| Payments | Paystack |
| Email Services | Resend |
| DevOps | Alembic, Structured Logging |

---

# Repository Structure

```text
.
├── frontend/                  # Next.js storefront application
├── backend/                   # FastAPI backend services
├── mobile/                    # Flutter mobile application
├── docs/                      # Documentation hub (lowercase subfolders)
│   ├── audit/                 # System audit & remediation
│   ├── architecture/          # DSA reference
│   ├── deployment/            # Production rollout
│   ├── contributing/          # PR workflow
│   ├── environment/           # Env vars
│   ├── guides/                # Developer quickref
│   ├── security/              # Security policy
│   └── operations/            # Runbooks & auth sessions
├── .github/workflows/         # CI/CD workflows
│
├── backend/dbschemas/         # Database schema definitions
├── backend/migration/         # Custom migration tooling
├── backend/docs/              # Backend API, hosting, migration, tls
│   └── api/                   # authentication.md, api-reference.md
│
└── frontend/docs/             # Frontend hosting (vercel.md)
```

---

# Architecture Overview

```text
Frontend (Next.js)
        │
        ▼
 FastAPI Backend API
        │
        ▼
 PostgreSQL / Supabase
        │
        ├── Authentication
        ├── Audit Logging
        ├── Payments
        ├── Product Management
        └── Order Processing
```

---

# Quick Start

## Clone Repository

```bash
git clone <repository-url>
cd sikapa-enterprise
```

---

# Frontend Setup

The frontend application is built with Next.js and Tailwind CSS.

## Install Dependencies

```bash
cd frontend
npm install
```

## Start Development Server

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

---

# Backend Setup

The backend uses FastAPI with SQLModel and Alembic migrations.

## Create Virtual Environment

### Windows

```bash
cd backend

python -m venv venv
venv\\Scripts\\activate
```

### Linux / macOS

```bash
python -m venv venv
source venv/bin/activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Start Development Server

```bash
uvicorn app.main:app \
  --reload \
  --host 0.0.0.0 \
  --port 8000
```

Backend API:

```text
http://localhost:8000
```

Interactive API Docs:

```text
http://localhost:8000/docs
```

---

# Mobile Application

The project includes a Flutter-based mobile application with automated CI/CD workflows.

## Mobile Setup

```bash
cd mobile
flutter pub get
```

## Run Development Build

```bash
flutter run \
  --dart-define=SIKAPA_API_BASE=http://10.0.2.2:8000/api/v1
```

---

# Environment Configuration

The platform uses environment-based configuration for security and deployment flexibility.

---

## Backend Environment

Create:

```text
backend/.env
```

Typical variables:

```env
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
CORS_ORIGINS=https://yourdomain.com
RESEND_API_KEY=...
PAYSTACK_SECRET_KEY=...
```

---

## Frontend Environment

Create:

```text
frontend/.env.local
```

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Mobile Runtime Configuration

Flutter uses runtime defines instead of `.env` files.

Example:

```bash
flutter run \
  --dart-define=SIKAPA_API_BASE=http://10.0.2.2:8000/api/v1
```

---

# Database & Migrations

Database migrations are managed using Alembic.

## Apply Migrations

```bash
cd backend

alembic upgrade head
```

---

## Generate New Migration

```bash
alembic revision --autogenerate \
  -m "Describe migration"
```

---

# CI/CD Infrastructure

Sikapa Enterprise includes production-oriented GitHub Actions workflows.

Current automation includes:

- Android APK builds
- Android App Bundle generation
- iOS validation builds
- Automated artifact uploads
- Tagged release publishing
- Flutter static analysis
- Automated testing
- Gradle dependency caching
- Flutter version pinning

---

# Security Features

## Authentication

- JWT Access Tokens
- Refresh Tokens
- Secure password validation
- Session-aware authentication

---

## API Protection

- Structured validation
- Sanitized input handling
- XSS prevention
- CORS protection
- Environment-based secrets

---

## Observability

- Structured JSON logging
- Audit trails
- Error monitoring readiness
- Production-safe exception handling

---

# Documentation

## Core Documentation

| Area | Location |
|------|----------|
| Documentation hub | `docs/README.md` |
| Contributing | `docs/contributing/contributing.md` |
| Security policy | `docs/security/security-policy.md` |
| Developer quick reference | `docs/guides/developer-quickref.md` |
| System audit | `docs/audit/README.md` |
| Environment Configuration | `docs/environment/environment.md` |
| Operations & Infrastructure | `docs/operations/operations.md` |
| Auth sessions & admin (web) | `docs/operations/auth-session-and-admin.md` |
| Production Deployment | `docs/deployment/production-deployment.md` |
| Data structures & algorithms | `docs/architecture/data-structures-and-algorithms.md` |
| Authentication System | `backend/docs/api/authentication.md` |
| API Reference | `backend/docs/api/api-reference.md` |
| Backend Setup | `backend/README.md` |
| Render Deployment | `backend/docs/hosting/render.md` |
| Vercel Deployment | `frontend/docs/hosting/vercel.md` |
| Database Migrations | `backend/docs/migration/migration.md` |
| Mobile Setup | `mobile/README.md` |

---

# Development Workflow

Typical local workflow:

```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# Start frontend
cd frontend
npm run dev

# Start mobile
cd mobile
flutter run
```

---

# Production Readiness

The platform now includes:

- Structured error handling
- Centralized validation
- Audit logging
- Soft deletes
- CI/CD automation
- Environment isolation
- Secure secret management
- Production deployment documentation
- Release infrastructure
- Mobile build automation

---

# Recommended Deployment Stack

| Service | Recommended Platform |
|------|----------------------|
| Frontend | Vercel |
| Backend | Render |
| Database | Supabase / PostgreSQL |
| Mobile Releases | GitHub Actions |
| Asset Storage | Cloudflare / Supabase Storage |

---

# Notes

- Ensure backend services are running before using the frontend or mobile applications.
- Never commit production secrets or API keys.
- Always review migrations before applying them to production.
- Rebuild Flutter apps whenever runtime defines change.
- Keep `SECRET_KEY` stable in production environments unless intentionally rotating sessions.

---

# Project Status

### Current phase
Mobile **v1.2.x** — shopper parity plus admin MVP; release automation stable on `mobile-v*` tags.

### Platform status
| Component | Status |
|-----------|--------|
| Backend API | Active |
| Next.js storefront | Active |
| Flutter mobile (shop + admin) | Active — see **Latest update** above |
| Mobile CI/CD & releases | Active — `mobile-v1.2.1` |
| Database / migrations | Active |

---

# License

This project is proprietary unless otherwise specified.

---

<div align="center">

Built for scalable commerce infrastructure and modern multi-platform retail experiences.

</div>
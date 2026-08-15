# Universal HRMS SaaS

## Overview
Universal HRMS SaaS is a multi-tenant enterprise Human Resource Management & Operational SaaS platform designed to support diverse organizational structures under a single unified code base and database schema:
- **Companies & Enterprises**
- **Startups & Scaleups**
- **Schools & K-12 Educational Institutions**
- **Colleges & Universities**
- **Hospitals & Healthcare Facilities**
- **NGOs & Non-Profits**

---

## Technical Stack
- **Framework**: Next.js 14.2.20 (App Router, Edge Middleware, React Server Components)
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 18
- **ORM**: Prisma 5.22.0
- **Styling**: Tailwind CSS 3.4.x
- **Authentication**: HS256 JWT stored in `HttpOnly`, `SameSite=Lax`, `Secure` session cookies
- **Icons**: Lucide React

---

## Tenancy & Hostname Architecture
Identity and tenant boundaries are determined **EXCLUSIVELY via Hostname & Custom Domain Resolution** (`resolveTenantFromHost`).
- **Public SaaS Marketing Site**: `http://localhost:3000` / `https://yourdomain.com`
- **Platform Admin CRM**: `http://admin.localhost:3000` / `https://admin.yourdomain.com`
- **Tenant Application Boundary**: `http://<tenant-slug>.localhost:3000` / `https://<tenant-slug>.yourdomain.com`
- **Custom Domains**: `https://hr.customer-company.com`

*Strict Tenant Security Rule*: Header overrides (`X-Tenant-Id`) and query overrides (`tenant_id`) are stripped and ignored at the edge middleware boundary.

---

## Getting Started

### 1. Prerequisites
- Node.js 18.x or 20.x
- PostgreSQL 18 installed and running locally on port `5432`

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Database Migration & Seed
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Development Server
```bash
npm run dev
```

---

## Production Build & Deployment

### Production Migration Execution
```bash
npx prisma migrate deploy
```

### Production Build Command
```bash
npm run build
```

### Production Start Command
```bash
npm run start
```

---

## Verification Test Pipeline
Run the full automated test suite covering Phases 1 through 8:
```bash
npx prisma validate
npx prisma migrate status
npx tsx scripts/verify-phase1.ts
npx tsx scripts/verify-phase2.ts
npx tsx scripts/verify-phase3.ts
npx tsx scripts/verify-phase4.ts
npx tsx scripts/verify-phase5.ts
npx tsx scripts/verify-phase6.ts
npx tsx scripts/verify-production-readiness.ts
npx tsc --noEmit
npm run build
```

---

## License
Commercial Proprietary Software. All rights reserved.

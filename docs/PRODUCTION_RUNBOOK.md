# PRODUCTION RUNBOOK - UNIVERSAL HRMS SAAS

## 1. Environment Provisioning
1. Provision a PostgreSQL 18 database cluster with connection pooling enabled (e.g. pgBouncer / Cloud SQL Proxy).
2. Set environment variables in the production runtime container (e.g. Kubernetes, AWS ECS, Vercel Enterprise):
   - `DATABASE_URL`
   - `JWT_SECRET` (at least 32 random characters)
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_ROOT_DOMAIN`
   - `STORAGE_PROVIDER` (`S3` or `GCS`)
   - `EMAIL_PROVIDER` (`SMTP`)

## 2. Database Migration Deployment
Execute non-destructive schema migrations:
```bash
npx prisma migrate deploy
```
*Never run `prisma db push` or `prisma migrate dev` in production environments.*

## 3. Automated Daily Backup & Restore Strategy
- **Backup Schedule**: Automated daily snapshot at 01:00 UTC with 30-day point-in-time recovery (PITR).
- **Restore Command**:
  ```bash
  pg_restore -h <DB_HOST> -U postgres -d universal_hrms_prod <backup_file>.dump
  ```

## 4. Health Check Monitoring
- Liveness / Readiness Endpoint: `GET /api/v1/health`
- Expected HTTP Response: `200 OK` with JSON payload `{ "status": "UP", "database": "CONNECTED" }`.

## 5. Emergency Tenant Suspension Procedure
In the event of a tenant security breach or billing default, set tenant organization status to `SUSPENDED`:
```sql
UPDATE organizations SET status = 'SUSPENDED' WHERE slug = 'target-tenant-slug';
```
Edge middleware will immediately block all request traffic returning `403 FORBIDDEN`.

## 6. Secret Rotation Procedure
1. Generate new 32+ character `JWT_SECRET`.
2. Deploy updated environment variable. Existing sessions will expire and require user re-authentication.

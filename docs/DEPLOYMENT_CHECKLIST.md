# PRODUCTION DEPLOYMENT CHECKLIST

- [ ] **[1] PostgreSQL 18 Cluster**: Database provisioned with SSL connection enforcement.
- [ ] **[2] Environment Variables**: `.env.production` populated with 32+ char `JWT_SECRET` and production `DATABASE_URL`.
- [ ] **[3] Wildcard DNS**: CNAME record `*.yourdomain.com` pointing to application load balancer / ingress controller.
- [ ] **[4] SSL Certificates**: Wildcard TLS certificate installed covering `*.yourdomain.com` and root domain.
- [ ] **[5] Database Migrations**: Non-destructive schema migration executed via `npx prisma migrate deploy`.
- [ ] **[6] Database Seeding**: Essential seed data applied (`OrganizationTypes`, `Modules`, `Permissions`).
- [ ] **[7] Production Build**: Application compiled via `npm run build` with 0 type errors.
- [ ] **[8] Storage Backend**: S3/GCS bucket created with IAM credentials configured in `.env`.
- [ ] **[9] Email Gateway**: Production SMTP server credentials configured.
- [ ] **[10] Health Check Endpoint**: `GET /api/v1/health` returns `200 OK`.
- [ ] **[11] Production E2E Suite**: All automated tests (`verify-production-readiness.ts`) passed.

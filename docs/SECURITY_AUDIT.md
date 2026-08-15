# SECURITY AUDIT & CONTROL MATRIX

## Verified Security Controls

| Security Control | Implementation Status | Verification Details |
| :--- | :--- | :--- |
| **Password Hashing** | `VERIFIED` | `bcryptjs` with 10 salt rounds |
| **Authentication JWT** | `VERIFIED` | `HS256` signed JWTs with web crypto Edge verification |
| **Session Cookie Security** | `VERIFIED` | `hrms_session` cookie set to `HttpOnly`, `SameSite=Lax`, `Secure` in production |
| **Hostname Tenancy Isolation** | `VERIFIED` | Exclusive hostname domain resolution (`resolveTenantFromHost`). `X-Tenant-Id` headers and `tenant_id` queries stripped |
| **Cross-Tenant IDOR Protection** | `VERIFIED` | Database queries strictly scoped by `organizationId` parameter |
| **RBAC Authorization** | `VERIFIED` | Server-side role checks (`OWNER`, `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`) enforced at API endpoints |
| **Module Gating Security** | `VERIFIED` | Server-side module checks returning `403 FORBIDDEN` for disabled modules |
| **Reserved Subdomains Protection** | `VERIFIED` | `www`, `admin`, `api`, `app`, `mail`, `smtp`, `ftp`, `cdn` protected from tenant assignment |
| **Security Response Headers** | `VERIFIED` | `nosniff`, `DENY`, `strict-origin-when-cross-origin`, `Permissions-Policy`, and `Content-Security-Policy` |
| **Audit Log Completeness** | `VERIFIED` | Audit events recorded without storing plaintext passwords or JWT secrets |
| **Rate Limiting Engine** | `VERIFIED` | `RateLimiterProvider` abstraction with `InMemoryRateLimiter` dev fallback and Redis contract |

---

## Pending External Provider Integrations
- **AWS S3 / Cloud Storage Credentials**: Credentials must be supplied in `.env` for production binary document storage.
- **SMTP Gateway Credentials**: Hostname, port, and password must be supplied in `.env` for live production email dispatching.
- **Production Wildcard SSL / DNS**: Wildcard CNAME records (`*.yourdomain.com`) must be configured at the domain registrar.

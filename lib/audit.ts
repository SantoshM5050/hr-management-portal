import { db } from './db';

export interface AuditLogOptions {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAuditEvent(options: AuditLogOptions) {
  try {
    await db.auditLog.create({
      data: {
        organizationId: options.organizationId || null,
        userId: options.userId || null,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId || null,
        details: options.details ? (options.details as any) : undefined,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
      },
    });
  } catch (err) {
    console.error('Audit log write error:', err);
    // Never crash primary execution path if audit logging fails
  }
}

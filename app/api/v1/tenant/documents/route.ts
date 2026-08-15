import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { resolveTenantFromHost } from '@/lib/tenant-context';
import { verifyJwt, SESSION_COOKIE_NAME } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);
  const tenantId = tenantContext.tenantId;
  if (!tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  const documents = await db.document.findMany({
    where: { organizationId: tenantId },
    include: { person: true, documentType: true },
    orderBy: { createdAt: 'desc' },
  });

  const documentTypes = await db.documentType.findMany({
    where: { organizationId: tenantId },
  });

  return apiSuccess({ documents, documentTypes });
}

export async function POST(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);
  const tenantId = tenantContext.tenantId;
  if (!tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  try {
    const body = await request.json();
    const { personId, title, fileUrl, typeCode } = body;

    if (!personId || !title || !fileUrl) {
      return apiError('personId, title, and fileUrl are required', 'VALIDATION_ERROR', 422);
    }

    const docType = await db.documentType.upsert({
      where: {
        organizationId_code: {
          organizationId: tenantId,
          code: typeCode || 'GENERAL',
        },
      },
      update: {},
      create: {
        organizationId: tenantId,
        code: typeCode || 'GENERAL',
        name: typeCode || 'General Document',
      },
    });

    const doc = await db.document.create({
      data: {
        organizationId: tenantId,
        personId,
        documentTypeId: docType.id,
        title,
        fileUrl,
        verificationStatus: 'PENDING',
      },
    });

    await logAuditEvent({
      userId: session.userId,
      organizationId: tenantId,
      action: 'DOCUMENT_RECORD_CREATED',
      entity: 'DOCUMENT',
      entityId: doc.id,
      details: { title, fileUrl },
    });

    return apiSuccess({ document: doc }, 201);
  } catch (err) {
    console.error('POST /tenant/documents error:', err);
    return apiError('Failed to record document', 'INTERNAL_ERROR', 500);
  }
}

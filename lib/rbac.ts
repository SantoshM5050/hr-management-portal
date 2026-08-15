import { db } from './db';
import { UserSessionPayload } from './auth';

export async function hasPermission(
  session: UserSessionPayload | null,
  tenantId: string | undefined,
  requiredPermissionCode: string
): Promise<boolean> {
  if (!session || !session.userId) {
    return false;
  }

  // Platform staff automatically bypasses tenant checks for platform operations
  if (session.isPlatformStaff) {
    return true;
  }

  if (!tenantId) {
    return false;
  }

  try {
    const membership = await db.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: tenantId,
          userId: session.userId,
        },
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return false;
    }

    // Check if any assigned role contains the required permission code
    for (const role of membership.roles) {
      if (role.code === 'OWNER' || role.code === 'ADMIN') {
        return true; // Tenant Owner / Admin has full tenant permissions
      }
      for (const perm of role.permissions) {
        if (perm.code === requiredPermissionCode) {
          return true;
        }
      }
    }

    return false;
  } catch (err) {
    console.error('Permission evaluation error:', err);
    return false;
  }
}

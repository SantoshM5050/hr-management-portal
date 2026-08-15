import { db } from './db';
import { apiError } from './api-response';

export async function isModuleEnabled(organizationId: string, moduleCode: string): Promise<boolean> {
  if (moduleCode === 'CORE') return true;

  const mod = await db.module.findUnique({ where: { code: moduleCode } });
  if (!mod) return false;

  const orgMod = await db.organizationModule.findUnique({
    where: {
      organizationId_moduleId: {
        organizationId,
        moduleId: mod.id,
      },
    },
  });

  // Default to false for non-core modules if not explicitly configured or disabled
  return orgMod ? orgMod.isEnabled : false;
}

export async function requireModule(organizationId: string, moduleCode: string) {
  const enabled = await isModuleEnabled(organizationId, moduleCode);
  if (!enabled) {
    throw new Error(`MODULE_DISABLED: Module '${moduleCode}' is not enabled for this organization.`);
  }
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Safe Test Tenant Inspector & Cleanup Tool
 * Usage:
 *   npx tsx scripts/cleanup-test-tenant.ts --inspect
 *   npx tsx scripts/cleanup-test-tenant.ts --confirm-delete
 */
async function main() {
  const args = process.argv.slice(2);
  const targetSlug = 'santechtest01';

  console.log(`Searching for test organization tenant with slug: '${targetSlug}'...`);

  const org = await prisma.organization.findUnique({
    where: { slug: targetSlug },
    include: {
      domains: true,
      memberships: { include: { user: true } },
      people: true,
      roles: true,
      modules: true,
      settings: true,
    },
  });

  if (!org) {
    console.log(`No organization found with slug '${targetSlug}'. Database is clean.`);
    return;
  }

  console.log('\n--- TARGET TEST TENANT DETAILS ---');
  console.log(`ID: ${org.id}`);
  console.log(`Name: ${org.name}`);
  console.log(`Slug: ${org.slug}`);
  console.log(`Status: ${org.status}`);
  console.log(`Created At: ${org.createdAt}`);
  console.log(`Domains: ${org.domains.map((d) => d.domain).join(', ')}`);
  console.log(`Memberships: ${org.memberships.map((m) => `${m.user.fullName} (${m.user.email})`).join(', ')}`);
  console.log(`People Count: ${org.people.length}`);

  if (args.includes('--confirm-delete')) {
    console.log('\nDeleting test tenant organization and associated records...');
    await prisma.organization.delete({
      where: { id: org.id },
    });
    console.log(`Successfully deleted test organization '${targetSlug}'.`);
  } else {
    console.log('\n[INSPECT MODE] To safely delete this test organization, run:');
    console.log('  npx tsx scripts/cleanup-test-tenant.ts --confirm-delete');
  }
}

main()
  .catch((e) => {
    console.error('Error during test tenant inspection/cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

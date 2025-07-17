import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create or update organizations
  const [acmeOrg, bproOrg] = await Promise.all([
    prisma.organization.upsert({
      where: { code: 'ACME' },
      update: {},
      create: {
        name: 'ACME Construction',
        code: 'ACME',
        logo: 'https://example.com/acme-logo.png',
        primaryColor: '#1976d2',
        isActive: true,
      },
    }),
    prisma.organization.upsert({
      where: { code: 'BPRO' },
      update: {},
      create: {
        name: 'Builder Pro',
        code: 'BPRO',
        logo: 'https://example.com/builderpro-logo.png',
        primaryColor: '#2196f3',
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Organizations created or updated');

  // Create or update organization settings
  await Promise.all([
    prisma.organizationSettings.upsert({
      where: { organizationId: acmeOrg.id },
      update: {},
      create: {
        organizationId: acmeOrg.id,
        primaryColor: acmeOrg.primaryColor,
        companyName: acmeOrg.name,
        enabledFeatures: ['crm', 'projects', 'leads'],
      },
    }),
    prisma.organizationSettings.upsert({
      where: { organizationId: bproOrg.id },
      update: {},
      create: {
        organizationId: bproOrg.id,
        primaryColor: bproOrg.primaryColor,
        companyName: bproOrg.name,
        enabledFeatures: ['crm', 'projects', 'leads'],
      },
    }),
  ]);
  console.log('✅ Organization settings created or updated');

  // Create users if they don't exist
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@acmeconst.com' },
      update: {},
      create: {
        email: 'admin@acmeconst.com',
        password: await bcrypt.hash('Admin123!', 10),
        firstName: 'John',
        lastName: 'Doe',
        role: 'ORG_ADMIN',
        organizationRole: 'OWNER',
        organizationId: acmeOrg.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager@acmeconst.com' },
      update: {},
      create: {
        email: 'manager@acmeconst.com',
        password: await bcrypt.hash('Admin123!', 10),
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'USER',
        organizationRole: 'MEMBER',
        organizationId: acmeOrg.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@builderpro.com' },
      update: {},
      create: {
        email: 'admin@builderpro.com',
        password: await bcrypt.hash('Admin123!', 10),
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'ORG_ADMIN',
        organizationRole: 'OWNER',
        organizationId: bproOrg.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'superadmin@crmapp.com' },
      update: {},
      create: {
        email: 'superadmin@crmapp.com',
        password: await bcrypt.hash('Admin123!', 10),
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        organizationRole: 'OWNER',
      },
    }),
  ]);
  console.log('✅ Users created or updated');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
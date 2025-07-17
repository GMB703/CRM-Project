import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🔑 Creating Super Admin user...');

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    // Get the first organization (ACME Construction)
    const organization = await prisma.organization.findFirst({
      where: { code: 'ACME' }
    });

    if (!organization) {
      throw new Error('No organization found. Please run the seed script first.');
    }

    // Create super admin user
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@crmapp.com' },
      update: {
        password: hashedPassword,
        role: 'SUPER_ADMIN'
      },
      create: {
        email: 'superadmin@crmapp.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        organizationId: null
      }
    });

    console.log('✅ Super Admin user created successfully:', superAdmin);
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin(); 
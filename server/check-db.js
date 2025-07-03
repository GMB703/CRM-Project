import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...');
    
    // Check organizations
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
      }
    });
    
    console.log('\n📊 Organizations:');
    console.table(organizations);
    
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        organizationId: true,
      }
    });
    
    console.log('\n👥 Users:');
    console.table(users);
    
    // Check specific user
    const testUser = await prisma.user.findMany({
      where: {
        email: 'admin@acmeconst.com'
      },
      include: {
        organization: true
      }
    });
    
    console.log('\n🔍 Test user lookup:');
    console.log(JSON.stringify(testUser, null, 2));
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 
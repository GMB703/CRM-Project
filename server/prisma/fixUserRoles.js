// One-time script to fix user roles after enum update
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const updateManager = await prisma.user.updateMany({
    where: { role: 'MANAGER' },
    data: { role: 'ORG_ADMIN' },
  });
  const updateAdmin = await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { role: 'ORG_ADMIN' },
  });
  console.log('Updated MANAGER -> ORG_ADMIN:', updateManager.count);
  console.log('Updated ADMIN -> ORG_ADMIN:', updateAdmin.count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
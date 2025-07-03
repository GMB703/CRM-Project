const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Role mapping from UserRole to OrganizationRole
const roleMapping = {
  'ADMIN': 'ADMIN',
  'MANAGER': 'MANAGER', 
  'USER': 'MEMBER',
  'VIEWER': 'GUEST'
};

async function migrateUserOrganizations() {
  console.log('🚀 Starting User Organization Migration...\n');

  try {
    // Step 1: Get all existing users with their organizations
    console.log('📋 Step 1: Fetching existing users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        organizationRole: true,
        organization: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    console.log(`✅ Found ${users.length} users to migrate\n`);

    // Step 2: Check for existing UserOrganization records
    console.log('🔍 Step 2: Checking existing UserOrganization records...');
    const existingUserOrgs = await prisma.userOrganization.findMany({
      select: {
        userId: true,
        organizationId: true
      }
    });

    const existingKeys = new Set(
      existingUserOrgs.map(uo => `${uo.userId}-${uo.organizationId}`)
    );
    console.log(`📊 Found ${existingUserOrgs.length} existing UserOrganization records\n`);

    // Step 3: Create UserOrganization records for users who don't have them
    console.log('✨ Step 3: Creating UserOrganization records...');
    let created = 0;
    let skipped = 0;
    let updated = 0;

    for (const user of users) {
      const key = `${user.id}-${user.organizationId}`;
      
      if (existingKeys.has(key)) {
        console.log(`⏭️  Skipping ${user.firstName} ${user.lastName} (${user.email}) - UserOrganization already exists`);
        skipped++;
        continue;
      }

      // Map the user's role to organization role
      const organizationRole = roleMapping[user.role] || 'MEMBER';
      
      try {
        // Create UserOrganization record
        await prisma.userOrganization.create({
          data: {
            userId: user.id,
            organizationId: user.organizationId,
            role: organizationRole,
            isActive: true,
            joinedAt: new Date()
          }
        });

        // Update user's organizationRole if it's still default
        if (user.organizationRole === 'MEMBER' && organizationRole !== 'MEMBER') {
          await prisma.user.update({
            where: { id: user.id },
            data: { organizationRole: organizationRole }
          });
          updated++;
        }

        console.log(`✅ Created UserOrganization for ${user.firstName} ${user.lastName} (${user.email}) - Role: ${organizationRole} in ${user.organization.name}`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating UserOrganization for ${user.email}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ UserOrganization records created: ${created}`);
    console.log(`📝 User organizationRole updated: ${updated}`);
    console.log(`⏭️  Records skipped (already exist): ${skipped}`);
    console.log(`👥 Total users processed: ${users.length}`);

    // Step 4: Verification
    console.log('\n🔍 Step 4: Verification...');
    const totalUserOrgs = await prisma.userOrganization.count();
    const totalUsers = await prisma.user.count();
    
    console.log(`📊 Total UserOrganization records: ${totalUserOrgs}`);
    console.log(`👥 Total Users: ${totalUsers}`);
    
    if (totalUserOrgs >= totalUsers) {
      console.log('✅ Migration completed successfully! All users have UserOrganization records.');
    } else {
      console.log('⚠️  Some users may not have UserOrganization records. Please review.');
    }

    // Step 5: Sample verification query
    console.log('\n🧪 Step 5: Sample verification...');
    const sampleUserWithOrgs = await prisma.user.findFirst({
      include: {
        organization: true,
        userOrganizations: {
          include: {
            organization: true
          }
        }
      }
    });

    if (sampleUserWithOrgs) {
      console.log(`📋 Sample user: ${sampleUserWithOrgs.firstName} ${sampleUserWithOrgs.lastName}`);
      console.log(`🏢 Primary organization: ${sampleUserWithOrgs.organization.name}`);
      console.log(`🔗 UserOrganization records: ${sampleUserWithOrgs.userOrganizations.length}`);
      sampleUserWithOrgs.userOrganizations.forEach(uo => {
        console.log(`   - ${uo.organization.name} (${uo.role})`);
      });
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateUserOrganizations()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateUserOrganizations }; 
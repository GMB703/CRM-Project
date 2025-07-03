const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Test organization data
const organizationsData = [
  {
    name: 'Acme Construction',
    code: 'ACME-CONST',
    logo: null,
    primaryColor: '#1a73e8',
    settings: {
      theme: 'light',
      features: ['crm', 'projects', 'invoicing', 'communication'],
      timezone: 'America/New_York',
      currency: 'USD'
    },
    isActive: true
  },
  {
    name: 'BuildRight Remodeling',
    code: 'BUILDRIGHT',
    logo: null,
    primaryColor: '#34a853',
    settings: {
      theme: 'dark',
      features: ['crm', 'projects', 'estimates', 'communication'],
      timezone: 'America/Los_Angeles',
      currency: 'USD'
    },
    isActive: true
  },
  {
    name: 'Elite Home Renovations',
    code: 'ELITE-HOME',
    logo: null,
    primaryColor: '#ea4335',
    settings: {
      theme: 'light',
      features: ['crm', 'projects', 'invoicing', 'communication', 'analytics'],
      timezone: 'America/Chicago',
      currency: 'USD'
    },
    isActive: true
  },
  {
    name: 'Demo Inactive Company',
    code: 'DEMO-INACTIVE',
    logo: null,
    primaryColor: '#9aa0a6',
    settings: {
      theme: 'light',
      features: ['crm'],
      timezone: 'America/New_York',
      currency: 'USD'
    },
    isActive: false
  }
];

async function createOrganizations() {
  console.log('Creating organizations...');
  
  const organizations = [];
  for (const orgData of organizationsData) {
    const organization = await prisma.organization.create({
      data: orgData
    });
    organizations.push(organization);
    console.log(`Created organization: ${organization.name} (${organization.code})`);
  }
  
  return organizations;
}

async function createUsersForOrganization(organization) {
  console.log(`Creating users for ${organization.name}...`);
  
  const users = [];
  
  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.create({
    data: {
      email: `admin@${organization.code.toLowerCase().replace('-', '')}.com`,
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      phone: '555-0100',
      organizationId: organization.id
    }
  });
  users.push(admin);
  console.log(`Created admin user: ${admin.email}`);

  // Create manager user
  const managerPassword = await bcrypt.hash('Manager123!', 10);
  const manager = await prisma.user.create({
    data: {
      email: `manager@${organization.code.toLowerCase().replace('-', '')}.com`,
      password: managerPassword,
      firstName: 'Project',
      lastName: 'Manager',
      role: 'MANAGER',
      phone: '555-0101',
      organizationId: organization.id
    }
  });
  users.push(manager);
  console.log(`Created manager user: ${manager.email}`);

  // Create regular user
  const userPassword = await bcrypt.hash('User123!', 10);
  const user = await prisma.user.create({
    data: {
      email: `user@${organization.code.toLowerCase().replace('-', '')}.com`,
      password: userPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: 'USER',
      phone: '555-0102',
      organizationId: organization.id
    }
  });
  users.push(user);
  console.log(`Created regular user: ${user.email}`);

  return users;
}

async function createClientsForOrganization(organization) {
  console.log(`Creating clients for ${organization.name}...`);
  
  const clients = [];
  
  const clientsData = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: `john.doe@${organization.code.toLowerCase().replace('-', '')}-client.com`,
      phone: '555-1001',
      company: 'Doe Enterprises',
      address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      source: 'REFERRAL',
      tags: ['VIP', 'Kitchen Remodel'],
      status: 'ACTIVE',
      organizationId: organization.id
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: `jane.smith@${organization.code.toLowerCase().replace('-', '')}-client.com`,
      phone: '555-1002',
      company: 'Smith Holdings',
      address: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      source: 'WEBSITE',
      tags: ['Bathroom Remodel'],
      status: 'ACTIVE',
      organizationId: organization.id
    }
  ];

  for (const clientData of clientsData) {
    const client = await prisma.client.create({
      data: clientData
    });
    clients.push(client);
    console.log(`Created client: ${client.firstName} ${client.lastName}`);
  }

  return clients;
}

async function createProjectsForOrganization(organization, users, clients) {
  console.log(`Creating projects for ${organization.name}...`);
  
  const projects = [];
  const admin = users.find(u => u.role === 'ADMIN');
  const manager = users.find(u => u.role === 'MANAGER');
  
  const projectsData = [
    {
      name: 'Kitchen Remodeling',
      description: 'Complete kitchen renovation with modern appliances',
      status: 'IN_PROGRESS',
      stage: 'INSTALLATION_IN_PROGRESS',
      startDate: new Date(),
      budget: 50000.00,
      location: '123 Main St, San Francisco, CA',
      priority: 'HIGH',
      organizationId: organization.id,
      clientId: clients[0].id,
      creatorId: admin.id
    },
    {
      name: 'Bathroom Renovation',
      description: 'Master bathroom complete renovation',
      status: 'PLANNING',
      stage: 'ESTIMATE_REQUESTED',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      budget: 25000.00,
      location: '456 Oak Ave, Los Angeles, CA',
      priority: 'MEDIUM',
      organizationId: organization.id,
      clientId: clients[1].id,
      creatorId: manager.id
    }
  ];

  for (const projectData of projectsData) {
    const project = await prisma.project.create({
      data: {
        ...projectData,
        assignees: {
          connect: [{ id: admin.id }, { id: manager.id }]
        }
      }
    });
    projects.push(project);
    console.log(`Created project: ${project.name}`);
  }

  return projects;
}

async function createTasksForProjects(projects, users) {
  console.log('Creating tasks for projects...');
  
  const admin = users.find(u => u.role === 'ADMIN');
  const manager = users.find(u => u.role === 'MANAGER');
  
  const tasksData = [
    {
      title: 'Order Appliances',
      description: 'Order all kitchen appliances as per approved list',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      estimatedHours: 4.5,
      projectId: projects[0].id,
      assigneeId: admin.id
    },
    {
      title: 'Demolition Planning',
      description: 'Plan the demolition phase for kitchen renovation',
      status: 'PENDING',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      estimatedHours: 2.0,
      projectId: projects[0].id,
      assigneeId: manager.id
    },
    {
      title: 'Bathroom Design Review',
      description: 'Review and approve bathroom design plans',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      estimatedHours: 3.0,
      projectId: projects[1].id,
      assigneeId: manager.id
    }
  ];

  for (const taskData of tasksData) {
    const task = await prisma.task.create({
      data: taskData
    });
    console.log(`Created task: ${task.title}`);
  }
}

async function createCommunicationsForOrganization(organization, users, clients, projects) {
  console.log(`Creating communications for ${organization.name}...`);
  
  const admin = users.find(u => u.role === 'ADMIN');
  
  const communication = await prisma.communication.create({
    data: {
      type: 'EMAIL',
      direction: 'OUTBOUND',
      subject: 'Project Update',
      content: 'Project is progressing well. All materials have been ordered.',
      emailSubject: 'Kitchen Remodel Update',
      emailBody: 'Dear Mr. Doe, your kitchen remodel project is progressing as planned...',
      deliveryStatus: 'PENDING',
      clientId: clients[0].id,
      userId: admin.id,
      projectId: projects[0].id
    }
  });
  console.log('Created test communication');

  // Create test team chat message
  const teamChat = await prisma.teamChatMessage.create({
    data: {
      content: 'Initial project planning meeting scheduled for tomorrow',
      type: 'TEXT',
      userId: admin.id,
      projectId: projects[0].id
    }
  });
  console.log('Created test team chat message');
}

async function seedOrganization(organization) {
  console.log(`\n=== Seeding ${organization.name} ===`);
  
  try {
    // Create users for this organization
    const users = await createUsersForOrganization(organization);
    
    // Create clients for this organization
    const clients = await createClientsForOrganization(organization);
    
    // Create projects for this organization
    const projects = await createProjectsForOrganization(organization, users, clients);
    
    // Create tasks for projects
    await createTasksForProjects(projects, users);
    
    // Create communications
    await createCommunicationsForOrganization(organization, users, clients, projects);
    
    console.log(`✅ Successfully seeded ${organization.name}`);
  } catch (error) {
    console.error(`❌ Error seeding ${organization.name}:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🌱 Starting multi-tenant database seeding...\n');
    
    // Clean up existing data (for development only)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🧹 Cleaning up existing data...');
      await prisma.teamChatMessage.deleteMany({});
      await prisma.communication.deleteMany({});
      await prisma.task.deleteMany({});
      await prisma.project.deleteMany({});
      await prisma.client.deleteMany({});
      await prisma.user.deleteMany({});
      await prisma.organization.deleteMany({});
      console.log('✅ Cleanup completed\n');
    }
    
    // Create organizations
    const organizations = await createOrganizations();
    
    // Seed each organization with test data
    for (const organization of organizations.slice(0, 2)) { // Only seed first 2 active organizations
      await seedOrganization(organization);
    }
    
    console.log('\n🎉 Database seeded successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Organizations: ${organizations.length}`);
    console.log(`   - Active organizations seeded: 2`);
    console.log(`   - Users per organization: 3`);
    console.log(`   - Clients per organization: 2`);
    console.log(`   - Projects per organization: 2`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 
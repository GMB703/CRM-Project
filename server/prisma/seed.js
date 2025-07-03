import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create organizations
  const acmeOrg = await prisma.organization.upsert({
    where: { code: 'ACME' },
    update: {},
    create: {
      name: 'ACME Construction',
      code: 'ACME',
      isActive: true,
    },
  });

  const builderOrg = await prisma.organization.upsert({
    where: { code: 'BUILDER' },
    update: {},
    create: {
      name: 'Builder Pro LLC',
      code: 'BUILDER',
      isActive: true,
    },
  });

  console.log('✅ Organizations created');

  // Create organization settings for ACME
  await prisma.organizationSettings.upsert({
    where: { organizationId: acmeOrg.id },
    update: {},
    create: {
      organizationId: acmeOrg.id,
      companyName: 'ACME Construction',
      contactEmail: 'contact@acmeconst.com',
      contactPhone: '+1-555-0123',
      address: {
        street: '123 Construction Ave',
        city: 'Builder City',
        state: 'BC',
        zipCode: '12345'
      },
    },
  });

  // Create organization settings for Builder Pro
  await prisma.organizationSettings.upsert({
    where: { organizationId: builderOrg.id },
    update: {},
    create: {
      organizationId: builderOrg.id,
      companyName: 'Builder Pro LLC',
      contactEmail: 'info@builderpro.com',
      contactPhone: '+1-555-0456',
      address: {
        street: '456 Builder Blvd',
        city: 'Construction Town',
        state: 'CT',
        zipCode: '67890'
      },
    },
  });

  console.log('✅ Organization settings created');

  // Hash password for users
  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  // Create admin user for ACME
  const acmeAdmin = await prisma.user.upsert({
    where: { 
      email_organizationId: {
        email: 'admin@acmeconst.com',
        organizationId: acmeOrg.id
      }
    },
    update: {},
    create: {
      email: 'admin@acmeconst.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'ADMIN',
      organizationRole: 'OWNER',
      organizationId: acmeOrg.id,
      isActive: true,
    },
  });

  // Create manager user for ACME
  const acmeManager = await prisma.user.upsert({
    where: { 
      email_organizationId: {
        email: 'manager@acmeconst.com',
        organizationId: acmeOrg.id
      }
    },
    update: {},
    create: {
      email: 'manager@acmeconst.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Johnson',
      role: 'USER',
      organizationRole: 'MANAGER',
      organizationId: acmeOrg.id,
      isActive: true,
    },
  });

  // Create admin user for Builder Pro
  const builderAdmin = await prisma.user.upsert({
    where: { 
      email_organizationId: {
        email: 'admin@builderpro.com',
        organizationId: builderOrg.id
      }
    },
    update: {},
    create: {
      email: 'admin@builderpro.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Williams',
      role: 'ADMIN',
      organizationRole: 'OWNER',
      organizationId: builderOrg.id,
      isActive: true,
    },
  });

  // Create super admin user who can access both organizations
  const superAdmin = await prisma.user.upsert({
    where: { 
      email_organizationId: {
        email: 'superadmin@crmapp.com',
        organizationId: acmeOrg.id
      }
    },
    update: {},
    create: {
      email: 'superadmin@crmapp.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
      organizationRole: 'OWNER',
      organizationId: acmeOrg.id,
      isActive: true,
    },
  });

  // Create user organization access for super admin
  await prisma.userOrganization.createMany({
    data: [
      {
        userId: superAdmin.id,
        organizationId: acmeOrg.id,
        role: 'OWNER'
      },
      {
        userId: superAdmin.id,
        organizationId: builderOrg.id,
        role: 'ADMIN'
      }
    ],
    skipDuplicates: true
  });

  console.log('✅ Users created (including Super Admin)');

  // Create lead stages for ACME Construction
  const acmeLeadStages = await Promise.all([
    prisma.leadStage.upsert({
      where: { 
        name_organizationId: {
          name: 'New Lead',
          organizationId: acmeOrg.id
        }
      },
      update: {},
      create: {
        name: 'New Lead',
        description: 'Newly acquired leads awaiting initial contact',
        color: '#e3f2fd',
        order: 1,
        isDefault: true,
        organizationId: acmeOrg.id,
      }
    }),
    prisma.leadStage.upsert({
      where: { 
        name_organizationId: {
          name: 'Contacted',
          organizationId: acmeOrg.id
        }
      },
      update: {},
      create: {
        name: 'Contacted',
        description: 'Initial contact made with lead',
        color: '#fff3e0',
        order: 2,
        organizationId: acmeOrg.id,
      }
    }),
    prisma.leadStage.upsert({
      where: { 
        name_organizationId: {
          name: 'Qualified',
          organizationId: acmeOrg.id
        }
      },
      update: {},
      create: {
        name: 'Qualified',
        description: 'Lead meets our criteria and shows interest',
        color: '#f3e5f5',
        order: 3,
        organizationId: acmeOrg.id,
      }
    }),
    prisma.leadStage.upsert({
      where: { 
        name_organizationId: {
          name: 'Proposal Sent',
          organizationId: acmeOrg.id
        }
      },
      update: {},
      create: {
        name: 'Proposal Sent',
        description: 'Estimate/proposal has been sent to client',
        color: '#e8f5e8',
        order: 4,
        organizationId: acmeOrg.id,
      }
    }),
    prisma.leadStage.upsert({
      where: { 
        name_organizationId: {
          name: 'Negotiation',
          organizationId: acmeOrg.id
        }
      },
      update: {},
      create: {
        name: 'Negotiation',
        description: 'In active negotiation with client',
        color: '#fff8e1',
        order: 5,
        organizationId: acmeOrg.id,
      }
    }),
    prisma.leadStage.upsert({
      where: { 
        name_organizationId: {
          name: 'Closed Won',
          organizationId: acmeOrg.id
        }
      },
      update: {},
      create: {
        name: 'Closed Won',
        description: 'Successfully converted to paying customer',
        color: '#e8f5e8',
        order: 6,
        organizationId: acmeOrg.id,
      }
    }),
    prisma.leadStage.upsert({
      where: { 
        name_organizationId: {
          name: 'Closed Lost',
          organizationId: acmeOrg.id
        }
      },
      update: {},
      create: {
        name: 'Closed Lost',
        description: 'Lead was lost to competitor or declined',
        color: '#ffebee',
        order: 7,
        organizationId: acmeOrg.id,
      }
    })
  ]);

  // Create lead source configurations for ACME
  const acmeLeadSources = await Promise.all([
    prisma.leadSourceConfig.upsert({
      where: { 
        name_organizationId: {
          name: 'Google Ads',
          organizationId: acmeOrg.id
        }
      },
      update: {},
      create: {
        name: 'Google Ads',
        description: 'Google advertising campaigns',
        organizationId: acmeOrg.id,
      }
    }),
    prisma.leadSourceConfig.upsert({
      where: { 
        name_organizationId: {
          name: 'Facebook Ads',
          organizationId: acmeOrg.id
        }
      },
      update: {},
      create: {
        name: 'Facebook Ads',
        description: 'Facebook and Instagram advertising',
        organizationId: acmeOrg.id,
      }
    }),
    prisma.leadSourceConfig.upsert({
      where: { 
        name_organizationId: {
          name: 'Website Contact Form',
          organizationId: acmeOrg.id
        }
      },
      update: {},
      create: {
        name: 'Website Contact Form',
        description: 'Direct inquiries through company website',
        organizationId: acmeOrg.id,
      }
    }),
    prisma.leadSourceConfig.upsert({
      where: { 
        name_organizationId: {
          name: 'Referral - Previous Client',
          organizationId: acmeOrg.id
        }
      },
      update: {},
      create: {
        name: 'Referral - Previous Client',
        description: 'Referrals from existing satisfied customers',
        organizationId: acmeOrg.id,
      }
    }),
    prisma.leadSourceConfig.upsert({
      where: { 
        name_organizationId: {
          name: 'Trade Show',
          organizationId: acmeOrg.id
        }
      },
      update: {},
      create: {
        name: 'Trade Show',
        description: 'Leads from industry trade shows and events',
        organizationId: acmeOrg.id,
      }
    })
  ]);

  console.log('✅ Lead stages and sources created');

  // Create some sample clients for ACME (converted leads)
  const client1 = await prisma.client.upsert({
    where: {
      email_organizationId: {
        email: 'client1@example.com',
        organizationId: acmeOrg.id
      }
    },
    update: {},
    create: {
      firstName: 'Robert',
      lastName: 'Davis',
      email: 'client1@example.com',
      phone: '+1-555-1111',
      address: '789 Client St, Customer City, CC 11111',
      source: 'REFERRAL',
      status: 'CONVERTED',
      leadStage: 'Closed Won',
      assignedUserId: acmeAdmin.id,
      leadScore: 95,
      estimatedValue: 15000.00,
      actualValue: 14500.00,
      convertedAt: new Date('2024-01-15'),
      organizationId: acmeOrg.id,
    },
  });

  const client2 = await prisma.client.upsert({
    where: {
      email_organizationId: {
        email: 'client2@example.com',
        organizationId: acmeOrg.id
      }
    },
    update: {},
    create: {
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'client2@example.com',
      phone: '+1-555-2222',
      address: '321 Customer Ave, Client Town, CT 22222',
      source: 'WEBSITE',
      status: 'ACTIVE',
      leadStage: 'Closed Won',
      assignedUserId: acmeManager.id,
      leadScore: 88,
      estimatedValue: 22000.00,
      actualValue: 21800.00,
      convertedAt: new Date('2024-02-01'),
      organizationId: acmeOrg.id,
    },
  });

  // Create active leads in various stages
  const lead1 = await prisma.client.create({
    data: {
      firstName: 'Michael',
      lastName: 'Thompson',
      email: 'michael.thompson@email.com',
      phone: '+1-555-3333',
      company: 'Thompson Family Trust',
      address: '456 Prospect Dr, Lead City, LC 33333',
      source: 'ADVERTISING',
      status: 'PROSPECT',
      leadStage: 'Qualified',
      assignedUserId: acmeAdmin.id,
      leadScore: 75,
      estimatedValue: 35000.00,
      lastContactedAt: new Date('2024-01-20'),
      nextFollowUpAt: new Date('2024-01-27'),
      organizationId: acmeOrg.id,
    }
  });

  const lead2 = await prisma.client.create({
    data: {
      firstName: 'Jennifer',
      lastName: 'Martinez',
      email: 'jennifer.martinez@company.com',
      phone: '+1-555-4444',
      company: 'Martinez & Associates',
      address: '789 Business Blvd, Commerce City, CC 44444',
      source: 'SOCIAL_MEDIA',
      status: 'PROSPECT',
      leadStage: 'Proposal Sent',
      assignedUserId: acmeManager.id,
      leadScore: 82,
      estimatedValue: 18500.00,
      lastContactedAt: new Date('2024-01-18'),
      nextFollowUpAt: new Date('2024-01-25'),
      organizationId: acmeOrg.id,
    }
  });

  const lead3 = await prisma.client.create({
    data: {
      firstName: 'David',
      lastName: 'Chen',
      email: 'david.chen@techstartup.com',
      phone: '+1-555-5555',
      company: 'TechStartup Inc.',
      address: '321 Innovation Way, Tech Valley, TV 55555',
      source: 'REFERRAL',
      status: 'PROSPECT',
      leadStage: 'New Lead',
      assignedUserId: acmeAdmin.id,
      leadScore: 60,
      estimatedValue: 28000.00,
      lastContactedAt: null,
      nextFollowUpAt: new Date('2024-01-22'),
      organizationId: acmeOrg.id,
    }
  });

  // Create lead activities for the leads
  await prisma.leadActivity.createMany({
    data: [
      // Activities for Michael Thompson (lead1)
      {
        type: 'CALL',
        title: 'Initial Qualification Call',
        description: 'First contact to understand requirements',
        notes: 'Interested in bathroom renovation. Budget seems realistic. Family moving timeline flexible.',
        outcome: 'Qualified - Good fit for our services',
        nextAction: 'Send bathroom renovation portfolio and schedule site visit',
        completedAt: new Date('2024-01-20T10:00:00Z'),
        duration: 25,
        isCompleted: true,
        clientId: lead1.id,
        userId: acmeAdmin.id,
        organizationId: acmeOrg.id,
      },
      {
        type: 'EMAIL',
        title: 'Portfolio and Service Overview Sent',
        description: 'Sent bathroom renovation portfolio with pricing guide',
        notes: 'Included 5 recent bathroom projects and general pricing information',
        outcome: 'Email delivered and opened',
        nextAction: 'Follow up in 3 days if no response',
        completedAt: new Date('2024-01-20T14:30:00Z'),
        isCompleted: true,
        clientId: lead1.id,
        userId: acmeAdmin.id,
        organizationId: acmeOrg.id,
      },
      // Activities for Jennifer Martinez (lead2)
      {
        type: 'MEETING',
        title: 'Site Visit and Consultation',
        description: 'On-site meeting to assess project scope',
        notes: 'Office renovation project. Needs to be completed during summer break. Good access for equipment.',
        outcome: 'Positive meeting - ready for detailed proposal',
        nextAction: 'Prepare detailed proposal with timeline and pricing',
        completedAt: new Date('2024-01-18T09:00:00Z'),
        duration: 90,
        isCompleted: true,
        clientId: lead2.id,
        userId: acmeManager.id,
        organizationId: acmeOrg.id,
      },
      {
        type: 'QUOTE_SENT',
        title: 'Detailed Proposal Submitted',
        description: 'Comprehensive proposal for office renovation sent',
        notes: 'Proposal includes materials, labor, timeline, and 3D renderings. Total $18,500.',
        outcome: 'Proposal delivered',
        nextAction: 'Follow up in 5 business days',
        scheduledAt: new Date('2024-01-25T10:00:00Z'),
        isCompleted: false,
        clientId: lead2.id,
        userId: acmeManager.id,
        organizationId: acmeOrg.id,
      },
      // Activities for David Chen (lead3)
      {
        type: 'NOTE',
        title: 'Lead Received from Sarah Wilson Referral',
        description: 'New lead referred by existing client Sarah Wilson',
        notes: 'Sarah highly recommended our services. David needs conference room renovation for new startup office.',
        outcome: 'Lead assigned for follow-up',
        nextAction: 'Initial contact call within 24 hours',
        scheduledAt: new Date('2024-01-22T14:00:00Z'),
        isCompleted: false,
        clientId: lead3.id,
        userId: acmeAdmin.id,
        organizationId: acmeOrg.id,
      }
    ]
  });

  console.log('✅ Clients and Leads created with activities');

  // Create a sample project for ACME
  const project1 = await prisma.project.create({
    data: {
      name: 'Kitchen Renovation',
      description: 'Complete kitchen renovation including cabinets, countertops, and appliances',
      status: 'IN_PROGRESS',
      startDate: new Date(),
      organizationId: acmeOrg.id,
      clientId: client1.id,
      creatorId: acmeAdmin.id,
    },
  });

  console.log('✅ Projects created');

  // Create message templates for ACME
  const emailTemplate1 = await prisma.messageTemplate.create({
    data: {
      name: 'Initial Lead Welcome',
      description: 'Welcome email sent to new leads',
      category: 'FOLLOW_UP',
      type: 'EMAIL',
      subject: 'Welcome {{firstName}} - Thank you for your interest!',
      bodyText: 'Hi {{firstName}},\n\nThank you for your interest in {{organizationName}}. We received your inquiry about {{leadStage}} and would love to help bring your vision to life.\n\nOur team will review your requirements and get back to you within 24 hours to schedule a consultation.\n\nBest regards,\nThe {{organizationName}} Team',
      bodyHtml: '<p>Hi {{firstName}},</p><p>Thank you for your interest in <strong>{{organizationName}}</strong>. We received your inquiry and would love to help bring your vision to life.</p><p>Our team will review your requirements and get back to you within 24 hours to schedule a consultation.</p><p>Best regards,<br>The {{organizationName}} Team</p>',
      variables: ['firstName', 'organizationName', 'leadStage'],
      organizationId: acmeOrg.id,
      createdById: acmeAdmin.id,
      usageCount: 3,
      lastUsedAt: new Date('2024-01-20')
    }
  });

  const smsTemplate1 = await prisma.messageTemplate.create({
    data: {
      name: 'Appointment Reminder',
      description: 'SMS reminder for upcoming appointments',
      category: 'FOLLOW_UP',
      type: 'SMS',
      bodyText: 'Hi {{firstName}}, this is {{organizationName}} reminding you of your consultation tomorrow at {{appointmentTime}}. Please reply CONFIRM to confirm. Thanks!',
      variables: ['firstName', 'organizationName', 'appointmentTime'],
      organizationId: acmeOrg.id,
      createdById: acmeAdmin.id,
      usageCount: 2,
      lastUsedAt: new Date('2024-01-19')
    }
  });

  const emailTemplate2 = await prisma.messageTemplate.create({
    data: {
      name: 'Proposal Follow-up',
      description: 'Follow-up email after sending proposal',
      category: 'PROPOSAL',
      type: 'EMAIL',
      subject: 'Follow-up on your {{projectType}} proposal - {{organizationName}}',
      bodyText: 'Hi {{firstName}},\n\nI wanted to follow up on the proposal we sent for your {{projectType}} project. Do you have any questions about the scope, timeline, or pricing?\n\nWe\'re excited about the opportunity to work with you and would be happy to discuss any adjustments or answer any concerns.\n\nPlease let me know if you\'d like to schedule a call to review the proposal together.\n\nBest regards,\n{{assignedUserName}}\n{{organizationName}}',
      bodyHtml: '<p>Hi {{firstName}},</p><p>I wanted to follow up on the proposal we sent for your <strong>{{projectType}}</strong> project. Do you have any questions about the scope, timeline, or pricing?</p><p>We\'re excited about the opportunity to work with you and would be happy to discuss any adjustments or answer any concerns.</p><p>Please let me know if you\'d like to schedule a call to review the proposal together.</p><p>Best regards,<br>{{assignedUserName}}<br>{{organizationName}}</p>',
      variables: ['firstName', 'projectType', 'assignedUserName', 'organizationName'],
      organizationId: acmeOrg.id,
      createdById: acmeManager.id,
      usageCount: 1,
      lastUsedAt: new Date('2024-01-23')
    }
  });

  // Create communication channels for ACME
  const emailChannel = await prisma.communicationChannel.create({
    data: {
      name: 'Primary Email',
      type: 'EMAIL',
      isDefault: true,
      priority: 1,
      config: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        fromName: 'ACME Construction',
        fromEmail: 'info@acmeconst.com'
      },
      organizationId: acmeOrg.id
    }
  });

  const smsChannel = await prisma.communicationChannel.create({
    data: {
      name: 'Business SMS',
      type: 'SMS',
      isDefault: true,
      priority: 1,
      config: {
        provider: 'twilio',
        fromNumber: '+1-555-ACME'
      },
      dailyLimit: 100,
      monthlyLimit: 2000,
      currentDaily: 5,
      currentMonthly: 87,
      organizationId: acmeOrg.id
    }
  });

  // Create sample message history
  await prisma.messageHistory.createMany({
    data: [
      {
        type: 'EMAIL',
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        subject: 'Welcome Michael - Thank you for your interest!',
        bodyText: 'Hi Michael,\n\nThank you for your interest in ACME Construction. We received your inquiry about Qualified and would love to help bring your vision to life.\n\nOur team will review your requirements and get back to you within 24 hours to schedule a consultation.\n\nBest regards,\nThe ACME Construction Team',
        recipientEmail: 'michael.thompson@email.com',
        recipientName: 'Michael Thompson',
        templateId: emailTemplate1.id,
        templateVariables: { firstName: 'Michael', organizationName: 'ACME Construction', leadStage: 'Qualified' },
        channelId: emailChannel.id,
        clientId: lead1.id,
        userId: acmeAdmin.id,
        organizationId: acmeOrg.id,
        sentAt: new Date('2024-01-20T15:00:00Z'),
        deliveredAt: new Date('2024-01-20T15:01:00Z'),
        readAt: new Date('2024-01-20T16:30:00Z')
      },
      {
        type: 'SMS',
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        bodyText: 'Hi Jennifer, this is ACME Construction reminding you of your consultation tomorrow at 2:00 PM. Please reply CONFIRM to confirm. Thanks!',
        recipientPhone: '+1-555-4444',
        recipientName: 'Jennifer Martinez',
        templateId: smsTemplate1.id,
        templateVariables: { firstName: 'Jennifer', organizationName: 'ACME Construction', appointmentTime: '2:00 PM' },
        channelId: smsChannel.id,
        clientId: lead2.id,
        userId: acmeManager.id,
        organizationId: acmeOrg.id,
        sentAt: new Date('2024-01-17T10:00:00Z'),
        deliveredAt: new Date('2024-01-17T10:01:00Z')
      },
      {
        type: 'EMAIL',
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        subject: 'Follow-up on your office renovation proposal - ACME Construction',
        bodyText: 'Hi Jennifer,\n\nI wanted to follow up on the proposal we sent for your office renovation project. Do you have any questions about the scope, timeline, or pricing?\n\nWe\'re excited about the opportunity to work with you and would be happy to discuss any adjustments or answer any concerns.\n\nPlease let me know if you\'d like to schedule a call to review the proposal together.\n\nBest regards,\nJane Smith\nACME Construction',
        recipientEmail: 'jennifer.martinez@company.com',
        recipientName: 'Jennifer Martinez',
        templateId: emailTemplate2.id,
        templateVariables: { firstName: 'Jennifer', projectType: 'office renovation', assignedUserName: 'Jane Smith', organizationName: 'ACME Construction' },
        channelId: emailChannel.id,
        clientId: lead2.id,
        userId: acmeManager.id,
        organizationId: acmeOrg.id,
        sentAt: new Date('2024-01-23T09:30:00Z'),
        deliveredAt: new Date('2024-01-23T09:31:00Z'),
        readAt: new Date('2024-01-23T11:45:00Z')
      }
    ]
  });

  console.log('✅ Communication Hub data created (templates, channels, message history)');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📋 Test credentials:');
  console.log('Super Admin (can switch organizations):');
  console.log('  Super Admin: superadmin@crmapp.com / Admin123!');
  console.log('\nACME Construction:');
  console.log('  Admin: admin@acmeconst.com / Admin123!');
  console.log('  Manager: manager@acmeconst.com / Admin123!');
  console.log('\nBuilder Pro LLC:');
  console.log('  Admin: admin@builderpro.com / Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
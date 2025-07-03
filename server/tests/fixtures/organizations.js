export const testOrganizations = {
  org1: {
    id: 'org-123-456',
    name: 'Test Organization 1',
    code: 'TEST1',
    industry: 'Technology',
    primaryColor: '#1976d2',
    logoUrl: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  org2: {
    id: 'org-789-012',
    name: 'Test Organization 2', 
    code: 'TEST2',
    industry: 'Healthcare',
    primaryColor: '#2e7d32',
    logoUrl: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  org3: {
    id: 'org-345-678',
    name: 'Test Organization 3',
    code: 'TEST3', 
    industry: 'Finance',
    primaryColor: '#d32f2f',
    logoUrl: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }
};

export const testUsers = {
  org1Admin: {
    id: 'user-123-456',
    email: 'admin@testorg1.com',
    name: 'Admin User 1',
    password: '$2b$10$hashed.password.here', // bcrypt hash of 'password123'
    role: 'admin',
    organizationId: 'org-123-456',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  org1Member: {
    id: 'user-234-567',
    email: 'member@testorg1.com',
    name: 'Member User 1',
    password: '$2b$10$hashed.password.here',
    role: 'member',
    organizationId: 'org-123-456',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  org2Admin: {
    id: 'user-345-678',
    email: 'admin@testorg2.com',
    name: 'Admin User 2',
    password: '$2b$10$hashed.password.here',
    role: 'admin',
    organizationId: 'org-789-012',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  org2Member: {
    id: 'user-456-789',
    email: 'member@testorg2.com',
    name: 'Member User 2',
    password: '$2b$10$hashed.password.here',
    role: 'member',
    organizationId: 'org-789-012',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  superAdmin: {
    id: 'user-999-999',
    email: 'superadmin@system.com',
    name: 'Super Admin',
    password: '$2b$10$hashed.password.here',
    role: 'super_admin',
    organizationId: null, // Super admin doesn't belong to a specific organization
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }
};

export const testUserOrganizations = {
  org1AdminRelation: {
    id: 'user-org-123',
    userId: 'user-123-456',
    organizationId: 'org-123-456',
    role: 'OWNER',
    permissions: ['all'],
    joinedAt: new Date('2024-01-01T00:00:00Z')
  },
  org1MemberRelation: {
    id: 'user-org-234',
    userId: 'user-234-567',
    organizationId: 'org-123-456',
    role: 'MEMBER',
    permissions: ['read', 'write'],
    joinedAt: new Date('2024-01-01T00:00:00Z')
  },
  org2AdminRelation: {
    id: 'user-org-345',
    userId: 'user-345-678',
    organizationId: 'org-789-012',
    role: 'OWNER',
    permissions: ['all'],
    joinedAt: new Date('2024-01-01T00:00:00Z')
  },
  org2MemberRelation: {
    id: 'user-org-456',
    userId: 'user-456-789',
    organizationId: 'org-789-012',
    role: 'MEMBER',
    permissions: ['read'],
    joinedAt: new Date('2024-01-01T00:00:00Z')
  },
  // Multi-organization user (has access to both org1 and org2)
  multiOrgUser: {
    id: 'user-multi-org',
    email: 'multi@example.com',
    name: 'Multi Org User',
    password: '$2b$10$hashed.password.here',
    role: 'admin',
    organizationId: 'org-123-456', // Primary organization
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  multiOrgUserOrg1Relation: {
    id: 'user-org-multi-1',
    userId: 'user-multi-org',
    organizationId: 'org-123-456',
    role: 'ADMIN',
    permissions: ['all'],
    joinedAt: new Date('2024-01-01T00:00:00Z')
  },
  multiOrgUserOrg2Relation: {
    id: 'user-org-multi-2',
    userId: 'user-multi-org',
    organizationId: 'org-789-012',
    role: 'MANAGER',
    permissions: ['read', 'write', 'manage'],
    joinedAt: new Date('2024-01-02T00:00:00Z')
  }
};

export const testJWTPayloads = {
  org1Admin: {
    sub: 'user-123-456',
    email: 'admin@testorg1.com',
    name: 'Admin User 1',
    role: 'admin',
    organizationId: 'org-123-456',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour from now
  },
  org1Member: {
    sub: 'user-234-567',
    email: 'member@testorg1.com',
    name: 'Member User 1',
    role: 'member',
    organizationId: 'org-123-456',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60)
  },
  org2Admin: {
    sub: 'user-345-678',
    email: 'admin@testorg2.com',
    name: 'Admin User 2',
    role: 'admin',
    organizationId: 'org-789-012',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60)
  },
  multiOrgUser: {
    sub: 'user-multi-org',
    email: 'multi@example.com',
    name: 'Multi Org User',
    role: 'admin',
    organizationId: 'org-123-456', // Current context
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60)
  },
  expiredToken: {
    sub: 'user-123-456',
    email: 'admin@testorg1.com',
    name: 'Admin User 1',
    role: 'admin',
    organizationId: 'org-123-456',
    iat: Math.floor(Date.now() / 1000) - (60 * 60 * 2), // 2 hours ago
    exp: Math.floor(Date.now() / 1000) - (60 * 60) // 1 hour ago (expired)
  },
  tokenWithoutOrg: {
    sub: 'user-123-456',
    email: 'admin@testorg1.com',
    name: 'Admin User 1',
    role: 'admin',
    // Missing organizationId
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60)
  }
};

export const testCustomers = {
  org1Customer1: {
    id: 'customer-123',
    name: 'Acme Corp',
    email: 'contact@acme.com',
    phone: '+1-555-0123',
    organizationId: 'org-123-456',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  org1Customer2: {
    id: 'customer-234',
    name: 'Beta Industries',
    email: 'info@beta.com',
    phone: '+1-555-0234',
    organizationId: 'org-123-456',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  org2Customer1: {
    id: 'customer-345',
    name: 'Gamma LLC',
    email: 'hello@gamma.com',
    phone: '+1-555-0345',
    organizationId: 'org-789-012',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  org2Customer2: {
    id: 'customer-456',
    name: 'Delta Solutions',
    email: 'contact@delta.com',
    phone: '+1-555-0456',
    organizationId: 'org-789-012',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }
}; 
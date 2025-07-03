import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock console.log and other console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error // Keep error for important test failures
};

// Mock process.env for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/crm_test';

// Global test helpers
global.mockRequest = (overrides = {}) => ({
  headers: {},
  user: null,
  organizationId: null,
  multiTenant: {
    organizationId: null
  },
  ...overrides
});

global.mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

global.mockNext = () => jest.fn();

// Mock Prisma client for testing
const mockPrismaClient = {
  organization: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn()
  },
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn()
  },
  userOrganization: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn()
  },
  customer: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn()
  },
  project: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn()
  },
  estimate: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn()
  },
  $transaction: jest.fn()
};

// Make the mock available globally
global.mockPrisma = mockPrismaClient;

// Mock external dependencies
jest.mock('jsonwebtoken');
jest.mock('bcrypt');

// Setup and teardown for each test
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset console mocks
  global.console.log.mockClear();
  global.console.debug.mockClear();
  global.console.info.mockClear();
  global.console.warn.mockClear();
});

afterEach(() => {
  // Clean up any test state
  jest.restoreAllMocks();
});

// Global timeout for async operations
jest.setTimeout(10000); 
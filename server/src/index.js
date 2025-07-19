import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import leadRoutes from './routes/leads.js';
import organizationRoutes from './routes/organizations.js';
import analyticsRoutes from './routes/analytics.js';
import dashboardRoutes from './routes/dashboard.js';
import superAdminRoutes from './routes/superAdmin.js';
import communicationRoutes from './routes/communications.js';
import fileRoutes from './routes/files.js';
import errorHandler from './middleware/errorHandler.js';
import { isAuthenticated } from './middleware/auth.js';
import usersRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import clientsRoutes from './routes/clients.js';
import permissionsRoutes from './routes/permissions.js';
import apiKeyRoutes from './routes/apiKeys.js';
import paymentRoutes from './routes/payments.js';
import contractRoutes from './routes/contracts.js';
import clientPortalRoutes from './routes/clientPortal.js';

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3001';

// Middleware
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id']
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount auth routes at both root and /api/auth
app.use('/', authRoutes); // For public auth endpoints (login, register, etc.)
app.use('/api/auth', authRoutes); // For protected auth endpoints

// Protected routes
app.use('/api/leads', isAuthenticated, leadRoutes);
app.use('/api/organizations', isAuthenticated, organizationRoutes);
app.use('/api/analytics', isAuthenticated, analyticsRoutes);
app.use('/api/dashboard', isAuthenticated, dashboardRoutes);
app.use('/api/super-admin', isAuthenticated, superAdminRoutes);
app.use('/api/communications', isAuthenticated, communicationRoutes);
app.use('/api/files', isAuthenticated, fileRoutes);
app.use('/api/users', isAuthenticated, usersRoutes);
app.use('/api/admin', isAuthenticated, adminRoutes);
app.use('/api/clients', isAuthenticated, clientsRoutes);
app.use('/api/permissions', isAuthenticated, permissionsRoutes);
app.use('/api/api-keys', isAuthenticated, apiKeyRoutes);
app.use('/api/payments', isAuthenticated, paymentRoutes);
app.use('/api/contracts', isAuthenticated, contractRoutes);
app.use('/api/client-portal', clientPortalRoutes);

// Error handling
app.use(errorHandler);

// Start server with error handling
const startServer = async () => {
  try {
    // Test database connection before starting server
    await prisma.$connect();
    console.log('Database connection successful');

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`CORS enabled for ${CLIENT_URL}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port or kill the process using that port.`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          await prisma.$disconnect();
          console.log('Database connections closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
    };

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

/* [STABLE COMPONENT - DO NOT MODIFY]
 * This Express server configuration is complete and stable.
 * Core functionality:
 * - CORS configuration (localhost:3001)
 * - Authentication middleware
 * - Route mounting with proper auth checks
 * - Error handling
 * - Health check endpoint
 * 
 * This is the main server entry point.
 * Changes here could affect the entire application's routing and middleware.
 * Modify only if absolutely necessary and after thorough testing.
 */
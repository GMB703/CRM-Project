import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import organizationRoutes from './routes/organizations.js';
import adminRoutes from './routes/admin.js';
import superAdminRoutes from './routes/superAdmin.js';
import clientRoutes from './routes/clients.js';
import projectRoutes from './routes/projects.js';
import estimateRoutes from './routes/estimates.js';
import templateRoutes from './routes/templates.js';
import communicationRoutes from './routes/communications.js';
import leadRoutes from './routes/leads.js';
import dashboardRoutes from './routes/dashboard.js';
import fileRoutes from './routes/files.js';
import chatRoutes from './routes/chat.js';


// Import middleware
import { auth } from './middleware/auth.js';
import { createMultiTenantMiddleware } from './middleware/multiTenant.js';
import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Express
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-organization-id',
      'X-Organization-ID',
      'Accept'
    ]
  }
});

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-organization-id',
    'X-Organization-ID',
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  exposedHeaders: [
    'Content-Type',
    'Authorization',
    'x-organization-id',
    'X-Organization-ID'
  ],
  optionsSuccessStatus: 204,
  preflightContinue: false,
  maxAge: 3600 // Cache preflight request for 1 hour
};

// Apply CORS before ANY other middleware
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint (before auth)
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Routes
app.use('/api/auth', authRoutes);

// Apply authentication and multi-tenant middleware to protected routes
app.use('/api', auth);
app.use('/api', createMultiTenantMiddleware());

// Protected routes
app.use('/api/organizations', organizationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/estimates', estimateRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/chat', chatRoutes);


// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`📍 User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send-message', (data) => {
    socket.to(data.roomId).emit('receive-message', data);
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Global error handler
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
});

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create log stream
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'server.log'),
  { flags: 'a' }
);

// Use morgan for logging
app.use(morgan('combined', { stream: accessLogStream }));

// Test database connection
async function testConnection() {
  console.log('🔍 Testing database connection...');
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Function to kill any existing process on port 5000
async function killPort(port) {
  try {
    const { execSync } = await import('child_process');
    try {
      if (process.platform === 'win32') {
        execSync(`netstat -ano | findstr :${port} | findstr LISTENING && FOR /F "tokens=5" %a in ('netstat -ano | findstr :${port} | findstr LISTENING') do taskkill /F /PID %a`);
      } else {
        execSync(`lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`);
      }
      console.log(`✅ Successfully killed process on port ${port}`);
    } catch (err) {
      // If no process is found, that's fine
      console.log(`ℹ️ No process found on port ${port}`);
    }
  } catch (err) {
    console.error('❌ Error killing port:', err);
  }
}

// Start server
async function startServer() {
  const PORT = 5000;
  
  // First kill any existing process on port 5000
  await killPort(PORT);
  
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', async (err) => {
  console.error('💥 Uncaught Exception:', err);
  if (err.code === 'EADDRINUSE') {
    console.log('⚠️ Port 5000 is in use. Attempting to kill the process and restart...');
    await killPort(5000);
    startServer();
  } else {
    process.exit(1);
  }
});

startServer();
# Home-Remodeling CRM Setup Guide

This guide will help you set up the complete Home-Remodeling CRM system on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn**
- **Git**
- **PostgreSQL** (for local development) or **Supabase** account
- **Redis** (optional, for background jobs)

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd crm-project

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to root
cd ..
```

### 2. Environment Setup

#### Backend Environment

1. Copy the environment template:
```bash
cd server
cp env.example .env
```

2. Edit `server/.env` with your configuration:
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database (Supabase - Recommended)
DATABASE_URL="postgresql://username:password@host:port/database"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Authentication (Clerk - Recommended)
CLERK_SECRET_KEY="your-clerk-secret-key"
CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"

# JWT (if not using Clerk)
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
EMAIL_FROM="noreply@yourcompany.com"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Payments (Stripe)
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# File Upload (Supabase Storage)
SUPABASE_STORAGE_BUCKET="crm-documents"

# Redis (for background jobs)
REDIS_URL="redis://localhost:6379"

# CORS
CORS_ORIGIN="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL="info"
```

#### Frontend Environment

1. Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME="Home-Remodeling CRM"
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

### 3. Database Setup

#### Option A: Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your database URL and API keys from the project settings
3. Update your `server/.env` with the Supabase credentials
4. Run the database migrations:

```bash
cd server
npx prisma db push
npx prisma generate
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a new database
3. Update `DATABASE_URL` in `server/.env`
4. Run migrations:

```bash
cd server
npx prisma db push
npx prisma generate
```

### 4. Seed Database (Optional)

```bash
cd server
npm run db:seed
```

### 5. Start Development Servers

#### Option A: Using Root Script (Recommended)

```bash
# From the root directory
npm run dev
```

This will start both the backend (port 5000) and frontend (port 3000) servers concurrently.

#### Option B: Separate Terminals

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health
- **Prisma Studio**: http://localhost:5555 (run `npx prisma studio` in server directory)

## Configuration Details

### Authentication Setup

#### Option A: Clerk (Recommended)

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Get your API keys from the dashboard
4. Update your environment variables

#### Option B: JWT Authentication

1. Generate a secure JWT secret
2. Update `JWT_SECRET` in your environment
3. The system will use built-in JWT authentication

### Email Setup

#### Resend (Recommended)

1. Go to [resend.com](https://resend.com) and create an account
2. Get your API key
3. Update `RESEND_API_KEY` in your environment

### SMS Setup

#### Twilio

1. Go to [twilio.com](https://twilio.com) and create an account
2. Get your Account SID and Auth Token
3. Get a phone number
4. Update the Twilio credentials in your environment

### Payment Setup

#### Stripe

1. Go to [stripe.com](https://stripe.com) and create an account
2. Get your API keys from the dashboard
3. Update the Stripe credentials in your environment

### File Storage Setup

#### Supabase Storage

1. In your Supabase project, go to Storage
2. Create a new bucket called "crm-documents"
3. Set the appropriate permissions
4. Update `SUPABASE_STORAGE_BUCKET` in your environment

## Development Workflow

### Available Scripts

#### Root Directory
```bash
npm run dev          # Start both servers
npm run build        # Build for production
npm run test         # Run all tests
npm run lint         # Lint all code
npm run format       # Format code
npm run setup        # Install all dependencies
```

#### Server Directory
```bash
npm run dev          # Start development server
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Lint code
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

#### Client Directory
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Lint code
npm run format       # Format code
```

### Code Structure

```
crm-project/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── features/      # Feature modules
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   ├── store/         # Redux store
│   │   ├── services/      # API services
│   │   └── styles/        # Global styles
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Data models
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utility functions
├── prisma/                 # Database schema
└── docs/                   # Documentation
```

### Database Schema

The system includes comprehensive database models for:

- **Users & Authentication**
- **Clients & Contacts**
- **Projects & Stages**
- **Tasks & Checklists**
- **Estimates & Contracts**
- **Invoices & Payments**
- **Documents & Media**
- **Communications & Notes**

### API Endpoints

The backend provides RESTful APIs for all major features:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Clients**: `/api/clients/*`
- **Projects**: `/api/projects/*`
- **Tasks**: `/api/tasks/*`
- **Estimates**: `/api/estimates/*`
- **Invoices**: `/api/invoices/*`
- **Dashboard**: `/api/dashboard/*`

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the port in the environment variables
   - Kill the process using the port

2. **Database connection failed**
   - Check your database URL
   - Ensure the database is running
   - Verify network connectivity

3. **Authentication issues**
   - Check your Clerk/JWT configuration
   - Verify API keys are correct
   - Check CORS settings

4. **File upload issues**
   - Verify Supabase storage configuration
   - Check bucket permissions
   - Ensure proper CORS settings

### Getting Help

1. Check the console for error messages
2. Review the logs in the terminal
3. Check the browser's developer tools
4. Verify all environment variables are set correctly

## Production Deployment

### Backend Deployment

1. **Railway** (Recommended)
   - Connect your GitHub repository
   - Set environment variables
   - Deploy automatically

2. **Render**
   - Create a new Web Service
   - Connect your repository
   - Set build command: `npm install && npx prisma generate`
   - Set start command: `npm start`

### Frontend Deployment

1. **Vercel** (Recommended)
   - Connect your GitHub repository
   - Set environment variables
   - Deploy automatically

2. **Netlify**
   - Connect your repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

### Environment Variables for Production

Make sure to set all the same environment variables in your production environment, but with production values.

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the error logs
3. Ensure all prerequisites are met
4. Verify your configuration

For additional help, please refer to the documentation or create an issue in the repository. 
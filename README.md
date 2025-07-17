# Home-Remodeling / Construction CRM

A comprehensive Customer Relationship Management system designed specifically for home remodeling and construction businesses.

## 🎯 Features

### Core Modules
- **Dashboard** - Project overview, KPIs, calendar, notifications
- **Lead & Client Management** - Lead capture, contact profiles, pipeline management
- **Project Management** - Project creation, workflow stages, timeline views
- **Estimates & Contracts** - Estimate builder, e-signatures, contract templates
- **Scheduling & Calendar** - Resource scheduling, calendar sync, conflict detection
- **Tasks & Checklists** - Task assignment, job-site checklists, progress tracking
- **Invoicing & Payments** - Milestone payments, online payments, QuickBooks sync
- **Document Management** - Photo uploads, blueprint storage, version control
- **Communication Hub** - Email/SMS integration, internal notes, client portal
- **Reporting & Analytics** - Lead conversion, profit analysis, custom dashboards
- **Admin & Settings** - Roles, permissions, workflow automation

## 🛠 Tech Stack

### Frontend
- **React** - Component-based UI
- **Tailwind CSS** - Utility-first styling
- **React Query** - Server state management
- **Redux Toolkit** - Global state management
- **Framer Motion** - Animations
- **FullCalendar.io** - Calendar views

### Backend
- **Node.js** - Runtime environment
- **Express.js** - REST API framework
- **Prisma ORM** - Type-safe database access
- **Supabase** - PostgreSQL database, storage, and auth
- **Clerk** - User authentication (alternative to Supabase Auth)

### Notifications
- **Resend** - Transactional emails
- **Twilio** - SMS messaging
- **Web Push API** - Browser notifications

### Deployment
- **Frontend** - Vercel
- **Backend** - Railway/Render
- **Database** - Supabase

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Clerk account (for auth)

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd crm-project
   npm run setup
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment templates
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

3. **Database Setup**
   ```bash
   cd server
   npx prisma db push
   npx prisma generate
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
crm-project/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── features/      # Feature modules
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
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

## 🎨 Design System

### Color Palette
- **Primary**: #E50914 (Red)
- **Secondary**: #000000 (Black)  
- **Background/Text-Alt**: #FFFFFF (White)

### UI Components
- Modern, clean interface
- Responsive design
- Accessibility compliant
- Dark/light mode support

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- Jest for unit testing
- Cypress for E2E testing

## 📊 Database Schema

The system uses PostgreSQL with the following main entities:
- Users & Authentication
- Clients & Contacts
- Projects & Stages
- Estimates & Contracts
- Tasks & Checklists
- Invoices & Payments
- Documents & Media
- Communications & Notes

## 🔐 Security

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Secure file uploads

## 📈 Monitoring

- Error tracking with Sentry
- Performance monitoring
- User analytics
- Database query optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the API documentation

## Next Steps (Optional Enhancements)

While the system is fully functional, you could consider these future enhancements:

1. **Catalog Management**: Add interface for managing catalog items
   - Create, edit, and delete catalog items
   - Import/export functionality
   - Organization-specific pricing
   - Categories and tags

2. **Templates**: Create estimate templates for recurring work
   - Save estimates as templates
   - Quick-start new estimates from templates
   - Template categories
   - Default terms and conditions

3. **Payment Integration**: Complete Stripe integration for client payments
   - Accept deposits and milestone payments
   - Payment scheduling
   - Automated reminders
   - Payment receipt generation

4. **Advanced Reporting**: Analytics and reporting dashboard
   - Estimate conversion rates
   - Revenue forecasting
   - Profitability analysis
   - Custom report builder

5. **Contract Generation**: Convert approved estimates to contracts
   - Legal template integration
   - E-signature support
   - Version tracking
   - Contract management workflow

6. **Client Portal**: Allow clients to view and approve estimates online
   - Secure client login
   - Estimate discussion threads
   - Change request workflow
   - Client notification system

## 🔧 System Architecture

The estimate system follows the same patterns as your existing CRM:

- **Multi-tenant**: Fully supports organization isolation
- **Role-based**: Respects user permissions
- **Responsive**: Works on all device sizes
- **Professional**: Matches your existing UI/UX design

The system is production-ready and integrates seamlessly with your existing customer and project management modules!

### Technical Stack

- **Frontend**: React with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth with role-based permissions
- **PDF Generation**: Puppeteer
- **Email Service**: Nodemailer
- **Payment Processing**: Stripe API

---

Built with ❤️ for construction professionals 

# CRM Application Setup Guide

## Port Configuration
The application uses the following fixed ports:
- Client (Frontend): **Port 3001**
- Server (Backend): **Port 5000**

## Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- PostgreSQL (v13 or higher)

## Initial Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd crm-project
```

2. Install root dependencies:
```bash
npm install
```

3. Install client dependencies:
```bash
cd client
npm install
cd ..
```

4. Install server dependencies:
```bash
cd server
npm install
cd ..
```

5. Set up environment variables:
   - Copy `.env.example` to `.env` in the server directory
   - Update the database connection string and other required variables

6. Initialize the database:
```bash
cd server
npx prisma migrate dev
cd ..
```

## Starting the Application

### Development Mode

1. Start both client and server with a single command from the root directory:
```bash
npm run dev
```

This will start:
- Frontend at http://localhost:3001
- Backend at http://localhost:5000

### Starting Individually

If you need to run the client or server separately:

1. Start the client:
```bash
cd client
npm run dev
```

2. Start the server:
```bash
cd server
npm run dev
```

## Troubleshooting Port Issues

The application is configured to automatically handle port conflicts:

- The client (Vite) is configured to strictly use port 3001
- The server will automatically kill any process using port 5000 before starting

If you still experience port issues:

1. Manual port cleanup:
```bash
# For Windows:
netstat -ano | findstr :3001
netstat -ano | findstr :5000
taskkill /F /PID <PID>

# For Mac/Linux:
lsof -i :3001
lsof -i :5000
kill -9 <PID>
```

2. Verify no other applications are using these ports
3. Clear any zombie processes:
```bash
# For Mac/Linux:
killall node
```

## Test Accounts

- Super Admin: superadmin@crmapp.com / Admin123!
- Acme Construction: admin@acmeconst.com / Admin123!
- BuildRight Remodeling: admin@buildright.com / Admin123!

## API Documentation

The API documentation is available at:
- Development: http://localhost:5000/api-docs
- Swagger UI: http://localhost:5000/swagger 
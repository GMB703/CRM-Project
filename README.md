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

---

Built with ❤️ for construction professionals 
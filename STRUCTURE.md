# Project Folder Structure

## Overview
This document describes the organized folder structure for the Service Selling Unique Ring application.

```
Service_Selling_Unique_Ring/
├── backend/                          # Express.js Backend API
│   ├── config/                       # Configuration files (not in src)
│   │   ├── database.js               # Database connection config
│   │   └── redis.js                  # Redis connection config
│   │
│   ├── scripts/                      # Database seeding and utility scripts
│   │   └── seedRings.js              # Seed ring data to database
│   │
│   ├── sql/                          # SQL schema and migration files
│   │   ├── app-bootstrap.sql         # Application bootstrap queries
│   │   ├── inventory.sql             # Inventory-related queries
│   │   ├── login-auth.sql            # Authentication queries
│   │   ├── schema.sql                # Main database schema
│   │   ├── system-settings.sql       # System settings schema
│   │   └── RELATIONSHIPS.md          # Database relationships documentation
│   │
│   ├── src/                          # Main backend source code
│   │   ├── config/                   # Runtime configuration
│   │   │   ├── database.js           # Database config module
│   │   │   ├── db.js                 # Database helper functions
│   │   │   └── env.js                # Environment variables setup
│   │   │
│   │   ├── controllers/              # Request handlers (business logic)
│   │   │   ├── authController.js     # Authentication logic
│   │   │   ├── cartController.js     # Shopping cart operations
│   │   │   ├── coupleController.js   # Couple/pair management
│   │   │   └── ringController.js     # Ring CRUD operations
│   │   │
│   │   ├── middleware/               # Express middleware
│   │   │   ├── auth.js               # Authentication middleware
│   │   │   └── auth.middleware.js    # Auth helper functions
│   │   │
│   │   ├── models/                   # Data models and schemas
│   │   │   ├── RingModel.js          # Ring data model
│   │   │   └── RingModelModel.js     # Ring model definitions
│   │   │
│   │   ├── routes/                   # API route definitions
│   │   │   ├── admin.routes.js       # Admin endpoints
│   │   │   ├── auth.routes.js        # Authentication endpoints
│   │   │   ├── cart.routes.js        # Cart operation endpoints
│   │   │   ├── couple.routes.js      # Couple relationship endpoints
│   │   │   ├── index.js              # Route aggregator
│   │   │   ├── inventory.routes.js   # Inventory management endpoints
│   │   │   ├── notifications.routes.js # Notification endpoints
│   │   │   ├── pair.routes.js        # Pair invitation endpoints
│   │   │   ├── profile.routes.js     # User profile endpoints
│   │   │   ├── ring.routes.js        # Ring catalog endpoints
│   │   │   ├── search.routes.js      # Search functionality endpoints
│   │   │   ├── shared-connections.routes.js # Shared connection endpoints
│   │   │   ├── stats.routes.js       # Statistics/analytics endpoints
│   │   │   ├── user.routes.js        # User management endpoints
│   │   │   └── users.routes.js       # Additional user endpoints
│   │   │
│   │   ├── services/                 # Business logic services
│   │   │   ├── cart.service.js       # Cart business logic
│   │   │   ├── ring.service.js       # Ring business logic
│   │   │   └── user.service.js       # User business logic
│   │   │
│   │   ├── utils/                    # Utility functions
│   │   │   ├── apiResponse.js        # API response helpers
│   │   │   ├── asyncHandler.js       # Async error handler
│   │   │   └── logger.js             # Logging utilities
│   │   │
│   │   ├── app-clean.js              # Clean Express app instance
│   │   ├── app.js                    # Main Express app
│   │   └── server.js                 # Server entry point
│   │
│   ├── uploads/                      # Uploaded files storage
│   │   └── profile/                  # Profile picture uploads
│   │
│   ├── tests/                        # Test files (to be added)
│   │   ├── unit/                     # Unit tests
│   │   ├── integration/              # Integration tests
│   │   └── e2e/                      # End-to-end tests
│   │
│   ├── logs/                         # Log files directory (to be added)
│   │
│   ├── .env                          # Environment variables
│   ├── .env.example                  # Environment template
│   ├── .gitignore                    # Git ignore rules
│   ├── package.json                  # Dependencies and scripts
│   ├── vercel.json                   # Vercel deployment config
│   └── README.md                     # Backend documentation
│
├── frontend/                         # React + TypeScript Frontend
│   ├── components/                   # Reusable UI components
│   │   ├── App.tsx                   # Root app component
│   │   ├── AuthLayout.tsx            # Auth page layout wrapper
│   │   ├── GoogleAccountSelector.tsx # Google account picker
│   │   ├── GoogleIcon.tsx            # Google icon component
│   │   ├── GoogleLoginButton.tsx     # Google OAuth button
│   │   ├── Header.tsx                # Top navigation header
│   │   ├── InputField.tsx            # Form input component
│   │   ├── Layout.tsx                # Main app layout
│   │   ├── Sidebar.tsx               # Side navigation panel
│   │   ├── UserShell.tsx             # User layout shell
│   │   ├── UserTopNav.tsx            # User top navigation
│   │   ├── constants.ts              # Component constants
│   │   ├── index.css                 # Component styles
│   │   ├── main.tsx                  # Component entry point
│   │   └── types.ts                  # Component type definitions
│   │
│   ├── views/                        # Page-level view components
│   │   ├── AdminDashboardView.tsx    # Admin dashboard page
│   │   ├── AdminSeedView.tsx         # Database seeding page
│   │   ├── ConnectionRequestsView.tsx # Connection requests page
│   │   ├── CoupleProfileView.tsx     # Couple profile page
│   │   ├── CoupleShopView.tsx        # Shop/couple shopping page
│   │   ├── DashboardView.tsx         # Member dashboard page
│   │   ├── HistoryModal.tsx          # Purchase history modal
│   │   ├── InventoryView.tsx         # Inventory management page
│   │   ├── LoginView.tsx             # Login page
│   │   ├── MemoriesView.tsx          # Memories/sentimental page
│   │   ├── MyRingView.tsx            # My ring ownership page
│   │   ├── ProfileView.tsx           # User profile page
│   │   ├── ProlifeView.tsx           # Pro-life feature page
│   │   ├── PurchaseView.tsx          # Purchase history page
│   │   ├── RegisterView.tsx          # Registration page
│   │   ├── RelationshipView.tsx      # Relationship status page
│   │   ├── ResetPasswordView.tsx     # Password reset page
│   │   ├── RingInformation.tsx       # Ring detail page
│   │   ├── RingScanView.tsx          # Ring scanning page
│   │   ├── SecurityLogsView.tsx      # Security audit logs page
│   │   ├── SettingsView.tsx          # Settings page
│   │   ├── SharedConnectionPage.tsx  # Shared connection page
│   │   ├── ThankYou.tsx              # Thank you/confirmation page
│   │   ├── UserMgmtView.tsx          # User management page
│   │   ├── UserPairMgmt.tsx          # User pair management page
│   │   └── cardView.tsx              # Shopping cart page
│   │
│   ├── hooks/                        # Custom React hooks
│   │   └── useSocket.ts              # Socket.io hook
│   │
│   ├── lib/                          # Library/utilities
│   │   ├── api.ts                    # API client utilities
│   │   ├── theme.ts                  # Theme configuration
│   │   └── userStorage.ts            # LocalStorage/session helpers
│   │
│   ├── dist/                         # Production build output
│   │   ├── assets/                   # Compiled assets
│   │   └── index.html                # Built HTML
│   │
│   ├── public/                       # Static assets (to be added)
│   │   ├── images/                   # Image assets
│   │   ├── icons/                    # Icon files
│   │   └── fonts/                    # Font files
│   │
│   ├── tests/                        # Frontend tests (to be added)
│   │   ├── components/               # Component tests
│   │   ├── views/                    # View tests
│   │   └── hooks/                    # Hook tests
│   │
│   ├── .gitignore                    # Git ignore rules
│   ├── index.html                    # HTML entry point
│   ├── package.json                  # Dependencies and scripts
│   ├── tailwind.config.ts            # Tailwind CSS config
│   ├── tsconfig.json                 # TypeScript config
│   ├── vite.config.ts                # Vite build config
│   ├── postcss.config.cjs            # PostCSS config
│   ├── vercel.json                   # Vercel deployment config
│   └── README.md                     # Frontend documentation
│
├── docs/                             # Documentation (to be added)
│   ├── api/                          # API documentation
│   ├── architecture/                 # System architecture diagrams
│   ├── deployment/                   # Deployment guides
│   └── development/                  # Development guidelines
│
├── .qoder/                           # Qoder IDE configuration
│   ├── agents/                       # AI agent configurations
│   └── skills/                       # Custom skill definitions
│
└── .qodo/                            # Qodo workflow configuration
    ├── agents/                       # Workflow agents
    └── workflows/                    # Workflow definitions
```

## Key Directories

### Backend (`/backend`)
- **src/controllers/**: Handle HTTP requests and responses
- **src/services/**: Core business logic separate from controllers
- **src/models/**: Data structures and database schemas
- **src/routes/**: API endpoint definitions
- **src/middleware/**: Request processing pipeline
- **sql/**: Database schema and migrations
- **scripts/**: One-time utility and seeding scripts

### Frontend (`/frontend`)
- **components/**: Reusable UI building blocks
- **views/**: Full page components mapped to routes
- **hooks/**: Custom React hooks for shared logic
- **lib/**: Utility libraries and helpers

## Naming Conventions

### Files
- **Backend**: camelCase.js (e.g., `authController.js`)
- **Frontend**: PascalCase.tsx for components, camelCase.ts for utilities
- **SQL**: kebab-case.sql (e.g., `login-auth.sql`)
- **Config**: lowercase with extensions (e.g., `.env`, `tsconfig.json`)

### Directories
- All directories use lowercase with hyphens (e.g., `user-management/`)

## Scripts Organization

### Backend Scripts
Located in `/backend/scripts/`:
- Database seeding
- Data migration
- Maintenance tasks

### Utility Scripts
Located in root of `/backend/` (temporary/testing):
- `test-api.js`
- `test-connection.js`
- `check-invitation-status.js`

## Build Output

### Frontend
- **Development**: Served by Vite dev server
- **Production**: Built to `/frontend/dist/`

### Backend
- Runs directly from `/backend/src/`
- No compilation step (JavaScript)

## Environment Configuration

### Backend (.env)
```env
PORT=4001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=***
DB_NAME=bondkeeper
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

### Frontend
Uses hardcoded API base URL or environment variables during build.

## Next Steps for Organization

1. ✅ Create `/backend/tests/` directory structure
2. ✅ Create `/backend/logs/` directory
3. ✅ Create `/frontend/public/` directory structure
4. ✅ Create `/docs/` directory
5. 📝 Add `.gitkeep` files to empty directories
6. 📝 Move temporary test scripts to proper locations
7. 📝 Update CI/CD pipelines if needed

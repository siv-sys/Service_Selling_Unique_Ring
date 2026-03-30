# Quick Reference Guide

## 📁 Project Structure Summary

### Backend Organization
```
backend/
├── src/                    # Main application code
│   ├── controllers/       # Request handlers (4 files)
│   ├── services/          # Business logic (3 files)
│   ├── models/            # Data models (2 files)
│   ├── routes/            # API endpoints (13 files)
│   ├── middleware/        # Auth & validation (2 files)
│   ├── utils/             # Helper functions (3 files)
│   └── config/            # Runtime config (3 files)
├── sql/                    # Database schemas (6 files)
├── scripts/                # Seeding utilities
├── tests/                  # Test suites (NEW)
├── logs/                   # Log files (NEW)
└── uploads/profile/        # User avatars
```

### Frontend Organization
```
frontend/
├── components/            # Reusable UI (14 files)
├── views/                 # Page components (25 files)
├── hooks/                 # React hooks (1 file)
├── lib/                   # Utilities (3 files)
├── public/                # Static assets (NEW)
│   ├── images/
│   ├── icons/
│   └── fonts/
├── tests/                 # Test suites (NEW)
│   ├── components/
│   ├── views/
│   └── hooks/
└── dist/                  # Production build
```

## 🔑 Key Files

### Backend Entry Points
- `backend/src/server.js` - Main server file
- `backend/src/app.js` - Express app instance
- `backend/vercel.json` - Vercel deployment config

### Frontend Entry Points
- `frontend/index.html` - HTML entry
- `frontend/main.tsx` / `frontend/index.tsx` - React entry
- `frontend/App.tsx` - Root component
- `frontend/vite.config.ts` - Build configuration

### Configuration
- `backend/.env` - Backend environment variables
- `frontend/vite.config.ts` - Frontend build config
- `frontend/tailwind.config.ts` - Tailwind CSS config
- `frontend/tsconfig.json` - TypeScript config

## 📊 Statistics

### Backend
- **Controllers**: 4 (auth, cart, couple, ring)
- **Services**: 3 (cart, ring, user)
- **Routes**: 13 route files
- **Models**: 2 model files
- **SQL Files**: 6 schema/query files

### Frontend
- **Views**: 25 page components
- **Components**: 14 reusable components
- **Hooks**: 1 custom hook
- **Libraries**: 3 utility modules

## 🚀 New Directories Created

✅ `backend/tests/unit/` - Unit tests  
✅ `backend/tests/integration/` - Integration tests  
✅ `backend/tests/e2e/` - End-to-end tests  
✅ `backend/logs/` - Application logs  

✅ `frontend/public/images/` - Image assets  
✅ `frontend/public/icons/` - Icon files  
✅ `frontend/public/fonts/` - Font files  
✅ `frontend/tests/components/` - Component tests  
✅ `frontend/tests/views/` - View tests  
✅ `frontend/tests/hooks/` - Hook tests  

✅ `docs/api/` - API documentation  
✅ `docs/architecture/` - Architecture diagrams  
✅ `docs/deployment/` - Deployment guides  
✅ `docs/development/` - Dev guidelines  

## 📝 File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Backend JS | camelCase.js | `authController.js` |
| Frontend Components | PascalCase.tsx | `DashboardView.tsx` |
| Frontend Utils | camelCase.ts | `userStorage.ts` |
| SQL Files | kebab-case.sql | `login-auth.sql` |
| Config Files | lowercase.ext | `tsconfig.json` |
| Directories | lowercase-hyphen | `user-management/` |

## 🔍 Finding Things

### Need to modify API endpoint?
→ Check `backend/src/routes/` for the relevant route file

### Need to change business logic?
→ Look in `backend/src/services/` or `backend/src/controllers/`

### Need to update UI page?
→ Find the view in `frontend/views/`

### Need to reuse UI component?
→ Browse `frontend/components/`

### Need database schema?
→ Check `backend/sql/schema.sql`

### Need to add static asset?
→ Place in `frontend/public/`

## 📦 Build Outputs

### Development
- Backend: Runs from `backend/src/` via Node.js
- Frontend: Served by Vite at `http://localhost:5173/`

### Production
- Backend: Deployed to Vercel via `vercel.json`
- Frontend: Built to `frontend/dist/`

## 🛠️ Common Tasks

### Add new API endpoint
1. Create route in `backend/src/routes/[resource].routes.js`
2. Add controller in `backend/src/controllers/[resource]Controller.js`
3. Add service method in `backend/src/services/[resource].service.js`

### Add new page
1. Create view component in `frontend/views/[PageName]View.tsx`
2. Add route in `frontend/App.tsx`
3. Add navigation link in `frontend/components/Sidebar.tsx` or `Header.tsx`

### Add reusable component
1. Create component in `frontend/components/[ComponentName].tsx`
2. Export from component file
3. Import where needed

### Run database migration
1. Create SQL file in `backend/sql/`
2. Run via `node init-db.js` or manual execution

## 📖 Documentation Files

- `STRUCTURE.md` - Detailed folder structure (this file's companion)
- `README.md` - Project overview
- `backend/README.md` - Backend specific docs
- `frontend/README.md` - Frontend specific docs

---

**Last Updated**: March 30, 2026  
**Total Directories**: 40+  
**Total Source Files**: 100+

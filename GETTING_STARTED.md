# 📖 Quick Start Guide

## Welcome to Your Organized Project!

This guide helps you get started with the newly organized project structure.

---

## 🎯 What Changed?

### ✨ Clean & Organized Structure
- **9 unnecessary files removed** (logs, empty files, duplicates)
- **10 scripts properly organized** into logical directories
- **New npm commands** for common operations
- **Clear documentation** for everything

---

## 🚀 Quick Commands

### Backend - Common Tasks

#### Database Setup
```bash
cd backend

# Initialize database (first time only)
npm run db:init

# Seed sample data
npm run db:seed

# Full setup (recommended)
npm run db:setup
```

#### Development
```bash
# Start development server
npm run dev

# Start production server
npm start
```

#### Testing & Utilities
```bash
# Test database connection
npm run test:connection

# Test API endpoints
npm run test:api

# Add test users
npm run test:users

# Fix notification issues
npm run util:fix-notifications

# Check invitation status
npm run util:check-invitations
```

### Frontend - Common Tasks

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📁 Where to Find Things

### Backend Scripts

**Need to initialize database?**
→ `scripts/database/init-db.js`  
→ Run: `npm run db:init`

**Need to add sample data?**
→ `scripts/seedRings.js`  
→ Run: `npm run db:seed`

**Need to test something?**
→ `scripts/utilities/test-*.js`  
→ Run: `npm run test:api` or `npm run test:connection`

**Need to fix an issue?**
→ `scripts/utilities/fix-*.js`  
→ Run: `npm run util:fix-notifications`

**Full list**: See `backend/scripts/README.md`

### Frontend Components

**Need a reusable UI component?**
→ `components/` directory

**Need a full page view?**
→ `views/` directory

**Need utility functions?**
→ `lib/` directory

**Need static assets?**
→ `public/` directory

---

## 🔧 File Organization

### Backend Directory Map

```
backend/
├── src/                    # Main application code
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── models/            # Data structures
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth & validation
│   └── utils/             # Helper functions
│
├── scripts/                # Utility scripts
│   ├── database/          # DB initialization
│   ├── utilities/         # Testing & fixes
│   └── seedRings.js       # Data seeding
│
├── sql/                    # SQL schemas
├── tests/                  # Test files
└── logs/                   # Application logs
```

### Frontend Directory Map

```
frontend/
├── components/            # Reusable UI
├── views/                 # Page components
├── hooks/                 # Custom hooks
├── lib/                   # Utilities
├── public/                # Static assets
└── tests/                 # Test files
```

---

## 📝 Naming Conventions

| Type | Format | Example |
|------|--------|---------|
| Backend JS | camelCase | `authController.js` |
| Frontend Components | PascalCase | `DashboardView.tsx` |
| Utilities | camelCase | `userStorage.ts` |
| Directories | lowercase-hyphen | `user-management/` |

---

## 🛠️ Common Workflows

### Adding a New Feature

#### 1. Create Backend API
```bash
# Create controller
backend/src/controllers/newFeatureController.js

# Create service
backend/src/services/newFeature.service.js

# Create routes
backend/src/routes/newFeature.routes.js
```

#### 2. Create Frontend UI
```bash
# Create view component
frontend/views/NewFeatureView.tsx

# Add route in App.tsx
```

#### 3. Update Database (if needed)
```bash
# Create migration
backend/sql/new-feature-migration.sql

# Run migration
node scripts/database/init-db.js
```

---

### Debugging Issues

#### Database Connection Problems
```bash
# Test connection
npm run test:connection

# Check .env file exists
# Verify database server running
```

#### API Endpoint Issues
```bash
# Test API
npm run test:api

# Check server logs in terminal
```

#### Notification Problems
```bash
# Fix schema
npm run util:fix-notifications

# Check status
npm run util:check-invitations
```

---

## 📚 Documentation Files

### Root Level
- `STRUCTURE.md` - Detailed folder structure
- `QUICK_REFERENCE.md` - Developer quick reference
- `CLEANUP_SUMMARY.md` - What was cleaned up
- `GETTING_STARTED.md` - This file!

### Backend
- `backend/README.md` - Backend overview
- `backend/scripts/README.md` - Scripts documentation

### Frontend
- `frontend/README.md` - Frontend overview

---

## ⚡ Pro Tips

### 1. Use NPM Scripts
Instead of remembering file paths:
```bash
✅ npm run db:setup          # Easy!
❌ node scripts/database/init-db.js && node scripts/seedRings.js
```

### 2. Check Logs Directory
All application logs go to:
```
backend/logs/
```

### 3. Scripts are Documented
Full script documentation:
```
backend/scripts/README.md
```

### 4. Clean Code = Happy Code
Root directories are now clean:
- ✅ Only essential files
- ✅ No clutter
- ✅ Clear purpose

---

## 🆘 Troubleshooting

### "Command not found"
Make sure you're in the right directory:
```bash
# For backend commands
cd backend

# For frontend commands
cd frontend
```

### "File not found"
Check the new organized structure:
```bash
# List all scripts
ls backend/scripts/

# Read documentation
cat backend/scripts/README.md
```

### "Permission denied"
On Windows PowerShell, you might need:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

## 🎉 You're All Set!

Your project is now:
- ✅ **Clean** - No unnecessary files
- ✅ **Organized** - Everything has its place
- ✅ **Documented** - Clear guides available
- ✅ **Efficient** - Quick commands for common tasks

**Happy coding! 🚀**

---

**Last Updated**: March 30, 2026  
**Project Version**: 2.0.0 (Restructured)

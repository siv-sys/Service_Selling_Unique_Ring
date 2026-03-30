# Backend Scripts

This directory contains utility scripts for database operations, seeding, and maintenance tasks.

## Directory Structure

```
scripts/
├── database/           # Database initialization and migrations
│   └── init-db.js      # Initialize database schema
├── utilities/          # Utility and debugging scripts
│   ├── add-test-users.js              # Add test users to database
│   ├── check-invitation-status.js     # Check invitation status
│   ├── create-missing-notification.js # Create missing notifications
│   ├── fix-notifications-schema.js    # Fix notification schema issues
│   ├── test-api.js                    # Test API endpoints
│   ├── test-connection.js             # Test database connection
│   ├── test-dashboard.js              # Test dashboard data
│   ├── test-siv-to-reach.js           # Test Siv to Reach functionality
│   └── test-user-search.js            # Test user search functionality
└── seedRings.js        # Seed ring catalog data
```

## Usage

### Database Initialization
```bash
node scripts/database/init-db.js
```

### Seeding Data
```bash
node scripts/seedRings.js
```

### Utility Scripts
```bash
# Add test users
node scripts/utilities/add-test-users.js

# Check invitation status
node scripts/utilities/check-invitation-status.js

# Fix notification schema
node scripts/utilities/fix-notifications-schema.js

# Test database connection
node scripts/utilities/test-connection.js

# Test API endpoints
node scripts/utilities/test-api.js
```

## Script Categories

### Database Scripts (`/database`)
- **init-db.js**: Sets up database schema, creates tables, indexes, and relationships
- Run this first before starting the application

### Seed Scripts (root)
- **seedRings.js**: Populates the database with initial ring catalog data
- Safe to run multiple times (uses upsert logic)

### Utility Scripts (`/utilities`)
- **Test Scripts**: Various testing utilities for debugging and verification
- **Fix Scripts**: One-time fixes for schema or data issues
- **Check Scripts**: Diagnostic tools to verify system state

## Adding New Scripts

When adding new scripts:
1. Place in appropriate subdirectory based on purpose
2. Use descriptive names (verb-noun format)
3. Add documentation here
4. Ensure proper error handling
5. Use environment variables from `.env`

## Best Practices

- ✅ Always backup production database before running scripts
- ✅ Test scripts in development environment first
- ✅ Use transactions where appropriate
- ✅ Log progress and errors clearly
- ✅ Make scripts idempotent when possible
- ✅ Document required environment variables

## Environment Variables

Most scripts require the following environment variables in `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bondkeeper
PORT=4001
```

## Troubleshooting

### Connection Errors
- Verify `.env` file exists in backend root
- Check database server is running
- Confirm credentials are correct

### Script Failures
- Check Node.js version (v16+ recommended)
- Ensure all dependencies installed (`npm install`)
- Review script output for specific error messages

---

**Last Updated**: March 30, 2026

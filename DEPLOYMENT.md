# Vercel Deployment Guide

## 🚀 Complete Deployment Instructions for RingOS Platform

This guide covers deploying both backend and frontend to Vercel with professional configuration.

---

## 📋 Prerequisites

### Required Accounts
- ✅ [Vercel Account](https://vercel.com/signup) (Free or Pro)
- ✅ [GitHub Account](https://github.com) (for Git integration)
- ✅ Database server (MySQL - can be external like PlanetScale, AWS RDS, etc.)
- ✅ Redis server (optional - for caching)

### Environment Setup
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
```

---

## 🎯 Deployment Strategy

### Architecture Overview
```
┌─────────────────┐         ┌──────────────────┐
│   Frontend      │         │     Backend      │
│  (Vite + React) │         │   (Express API)  │
│                 │         │                  │
│  Port: Auto     │         │  Port: Auto      │
│  SPA Routing    │         │  REST/GraphQL    │
└────────┬────────┘         └────────┬─────────┘
         │                           │
         │        Vercel Edge        │
         │         Network           │
         └────────────┬──────────────┘
                      │
         ┌────────────┴──────────────┐
         │   External Services       │
         │   - MySQL Database        │
         │   - Redis Cache           │
         │   - Email/SMS APIs        │
         └───────────────────────────┘
```

### Deployment Options

#### Option 1: Single Vercel Project (Recommended for Start)
- Frontend: Main project
- Backend API: `/api` routes within same project
- **Pros**: Simple, single deployment, free tier friendly
- **Cons**: Less separation, shared resources

#### Option 2: Separate Projects (Professional Setup)
- Frontend: One Vercel project
- Backend: Separate Vercel project
- **Pros**: Clear separation, independent scaling, better monitoring
- **Cons**: Two deployments, CORS configuration needed

**We'll use Option 2** for professional separation.

---

## 🔧 Backend Deployment

### Step 1: Prepare Backend for Vercel

#### Update package.json
Your `backend/package.json` is already configured correctly:
```json
{
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js"
  }
}
```

#### Verify vercel.json
Your `backend/vercel.json` is correctly configured:
```json
{
  "version": 2,
  "builds": [{
    "src": "src/server.js",
    "use": "@vercel/node"
  }],
  "routes": [{
    "src": "/(.*)",
    "dest": "src/server.js"
  }]
}
```

### Step 2: Create .env File for Production

Create `backend/.env.production`:
```env
# Server Configuration
PORT=4001
NODE_ENV=production

# Database Configuration
DB_HOST=your-db-host.amazonaws.com
DB_USER=root
DB_PASSWORD=your-secure-password
DB_NAME=bondkeeper
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Redis Configuration (Optional)
REDIS_URL=redis://your-redis-url:6379
REDIS_ENABLED=false

# CORS Configuration
FRONTEND_URL=https://your-frontend.vercel.app

# Email Configuration (Future)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@ringos.com
EMAIL_PASS=your-email-password

# Application Settings
API_BASE_URL=https://your-backend-api.vercel.app
CLIENT_URL=https://your-frontend.vercel.app
```

### Step 3: Update Backend Code for Vercel

#### Ensure server.js is Vercel-Compatible

Check `backend/src/server.js`:
```javascript
const app = require('./app');

// Vercel requires module.exports for serverless
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  module.exports = app;
} else {
  const PORT = process.env.PORT || 4001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

#### Update app.js for CORS

Ensure `backend/src/app.js` has proper CORS:
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));
```

### Step 4: Deploy Backend to Vercel

#### Method A: Using Vercel CLI (Recommended)

```bash
cd backend

# Initialize Vercel project
vercel init

# Link to your Vercel account
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Method B: Using GitHub Integration

1. **Push to GitHub**:
```bash
git add .
git commit -m "Prepare backend for Vercel deployment"
git push origin main
```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select `backend` folder as root directory
   - Configure build settings:
     - **Build Command**: `npm install` (no build needed for Node.js)
     - **Output Directory**: Leave blank
     - **Install Command**: `npm install`

3. **Add Environment Variables** in Vercel Dashboard:
   ```
   DB_HOST=your-db-host
   DB_USER=root
   DB_PASSWORD=***
   DB_NAME=bondkeeper
   JWT_SECRET=***
   CLIENT_URL=https://your-frontend.vercel.app
   ```

4. **Deploy!**

### Step 5: Get Backend URL

After deployment, Vercel will provide:
- **Preview URL**: `https://backend-project-name-git-main-yourusername.vercel.app`
- **Production URL**: `https://backend-project-name.vercel.app`

**Save this URL** - you'll need it for frontend configuration!

---

## 🎨 Frontend Deployment

### Step 1: Update Frontend Configuration

#### Update API Base URL

In `frontend/lib/api.ts` or wherever API_BASE_URL is defined:
```typescript
// Use environment variable with fallback
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
                           'http://localhost:4001/api';
```

#### Create Environment Files

Create `frontend/.env.production`:
```env
VITE_API_URL=https://your-backend-api.vercel.app/api
VITE_APP_NAME=RingOS Platform
VITE_APP_VERSION=2.0.0
```

Create `frontend/.env.development`:
```env
VITE_API_URL=http://localhost:4001/api
VITE_APP_NAME=RingOS Platform (Dev)
```

### Step 2: Verify Build Configuration

Your `vite.config.ts` should be production-ready:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in prod for smaller size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs
      },
    },
  },
})
```

### Step 3: Update vercel.json for SPA

Your `frontend/vercel.json` is good for SPA routing:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 4: Deploy Frontend to Vercel

#### Method A: Using Vercel CLI

```bash
cd frontend

# Build locally first to test
npm run build

# If build succeeds, deploy
vercel

# Production deployment
vercel --prod
```

#### Method B: Using GitHub Integration

1. **Push to GitHub**:
```bash
git add .
git commit -m "Prepare frontend for Vercel deployment"
git push origin main
```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select `frontend` folder as root directory
   - Configure build settings:
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Add Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-api.vercel.app/api
   ```

4. **Deploy!**

---

## 🔗 Connect Frontend & Backend

### Update Frontend API Configuration

After backend is deployed, update frontend:

#### Option 1: Environment Variable (Recommended)
In Vercel frontend project settings:
```
VITE_API_URL=https://your-backend-api.vercel.app/api
```

#### Option 2: Hardcode in api.ts (Temporary)
```typescript
export const API_BASE_URL = 'https://your-backend-api.vercel.app/api';
```

### Test the Connection

1. **Deploy frontend**
2. **Visit your frontend URL**: `https://your-frontend.vercel.app`
3. **Try to login/browse rings**
4. **Check browser console** for any API errors

---

## ⚙️ Advanced Configuration

### Custom Domain Setup

#### For Backend:
1. Go to Vercel Dashboard → Backend Project → Settings → Domains
2. Add domain: `api.ringos.com`
3. Update DNS records at your domain registrar:
   ```
   Type: CNAME
   Name: api
   Value: cname.vercel-dns.com
   ```

#### For Frontend:
1. Go to Vercel Dashboard → Frontend Project → Settings → Domains
2. Add domain: `www.ringos.com` or `ringos.com`
3. Update DNS records:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

### Environment Variables Management

#### Development (.env.development)
```env
VITE_API_URL=http://localhost:4001/api
```

#### Staging (.env.staging)
```env
VITE_API_URL=https://staging-backend.vercel.app/api
```

#### Production (.env.production)
```env
VITE_API_URL=https://api.ringos.com/api
```

### Performance Optimization

#### Frontend Optimizations:
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'recharts'],
        },
      },
    },
  },
});
```

#### Backend Optimizations:
```javascript
// Enable compression
const compression = require('compression');
app.use(compression());

// Cache static assets
app.use(express.static('public', {
  maxAge: '1d',
}));
```

---

## 🧪 Testing Deployment

### Pre-Deployment Checklist

#### Backend:
- [ ] All dependencies installed
- [ ] `.env.production` created with all variables
- [ ] CORS configured for frontend URL
- [ ] Database connection string updated
- [ ] Error handling implemented
- [ ] Logging configured

#### Frontend:
- [ ] Build succeeds locally (`npm run build`)
- [ ] API URLs point to production backend
- [ ] No console errors in local testing
- [ ] All routes work with `vercel.json` rewrites
- [ ] Images and assets load correctly

### Post-Deployment Testing

#### Backend Tests:
```bash
# Test API endpoint
curl https://your-backend-api.vercel.app/api/health

# Expected: {"success": true, "message": "OK"}
```

#### Frontend Tests:
1. Visit `https://your-frontend.vercel.app`
2. Check homepage loads
3. Try login/register
4. Browse rings
5. Add to cart
6. Check network tab for API calls

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot find module" Error
**Solution**: Ensure all dependencies are in `package.json`
```bash
npm install <missing-package>
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push
```

#### 2. CORS Errors
**Solution**: Update backend CORS configuration:
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

#### 3. Database Connection Failed
**Solution**: 
- Check environment variables in Vercel dashboard
- Ensure database allows connections from Vercel IPs
- Use connection pooling

#### 4. 404 on Routes
**Solution**: Verify `vercel.json` routes configuration
```json
{
  "routes": [{
    "src": "/(.*)",
    "dest": "src/server.js"
  }]
}
```

#### 5. Build Fails
**Solution**: Check build logs, fix TypeScript errors
```bash
npm run build  # Test locally first
```

---

## 📊 Monitoring & Analytics

### Vercel Analytics

Enable in Vercel Dashboard:
1. Go to Project → Analytics
2. Enable Web Analytics
3. View traffic, performance metrics

### Error Tracking

#### Option 1: Sentry (Recommended)
```bash
npm install @sentry/react @sentry/node
```

Initialize in backend:
```javascript
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

Initialize in frontend:
```typescript
import * as Sentry from '@sentry/react';
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
```

#### Option 2: LogRocket
```bash
npm install logrocket
```

---

## 🔄 CI/CD Pipeline

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```
git push origin main
    ↓
GitHub webhook triggers
    ↓
Vercel builds & deploys
    ↓
Live in ~2 minutes
```

### Deployment Environments

Configure in Vercel:
- **Development**: Every commit creates preview
- **Staging**: Manual promotion for QA
- **Production**: `main` branch auto-deploys

---

## 💰 Cost Estimation

### Free Tier (Hobby)
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Perfect for development/testing

### Pro Tier ($20/month)
- ✅ Custom domains
- ✅ More bandwidth (1TB)
- ✅ Priority support
- ✅ Analytics

**Recommendation**: Start with Free, upgrade when needed

---

## 📈 Performance Best Practices

### Frontend
- ✅ Enable gzip compression (Vercel does this automatically)
- ✅ Use CDN for large assets
- ✅ Lazy load components
- ✅ Optimize images (WebP format)
- ✅ Minimize bundle size

### Backend
- ✅ Use connection pooling
- ✅ Implement caching (Redis)
- ✅ Optimize database queries
- ✅ Use prepared statements
- ✅ Monitor slow queries

---

## 🎉 Deployment Complete!

### Final Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] API calls working
- [ ] Login/authentication functional
- [ ] Database connected
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance acceptable

### Next Steps

1. **Monitor**: Watch Vercel analytics
2. **Optimize**: Improve based on metrics
3. **Scale**: Upgrade plan if needed
4. **Maintain**: Regular updates

---

## 📞 Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Community**: [GitHub Discussions](https://github.com/vercel/vercel/discussions)
- **Status Page**: [status.vercel.com](https://status.vercel.com)

---

**Ready to deploy? Let's go! 🚀**

```bash
# Quick Deploy Commands
cd backend && vercel --prod
cd ../frontend && vercel --prod
```

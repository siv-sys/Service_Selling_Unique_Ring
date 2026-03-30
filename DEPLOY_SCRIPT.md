# 🚀 Quick Deploy Script for Vercel

This script automates the deployment process for both backend and frontend.

## Prerequisites

1. Install Vercel CLI globally:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Ensure environment variables are set:
   - Backend: `backend/.env.production`
   - Frontend: `frontend/.env.production`

---

## Deployment Scripts

### Option 1: Deploy Both (Recommended)

Save as `deploy.sh` (Git Bash/WSL) or `deploy.ps1` (PowerShell):

#### PowerShell Version (deploy.ps1)
```powershell
Write-Host "🚀 Starting Vercel Deployment..." -ForegroundColor Cyan

# Deploy Backend
Write-Host "`n📦 Deploying Backend..." -ForegroundColor Green
Set-Location backend
vercel --prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend deployment failed!" -ForegroundColor Red
    exit 1
}
$backendUrl = vercel --prod --confirm
Write-Host "✅ Backend deployed: $backendUrl" -ForegroundColor Green

# Deploy Frontend
Write-Host "`n🎨 Deploying Frontend..." -ForegroundColor Green
Set-Location ..\frontend
vercel --prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend deployment failed!" -ForegroundColor Red
    exit 1
}
$frontendUrl = vercel --prod --confirm
Write-Host "✅ Frontend deployed: $frontendUrl" -ForegroundColor Green

Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Cyan
Write-Host "Backend:  $backendUrl" -ForegroundColor White
Write-Host "Frontend: $frontendUrl" -ForegroundColor White
```

#### Git Bash Version (deploy.sh)
```bash
#!/bin/bash

echo "🚀 Starting Vercel Deployment..."

# Deploy Backend
echo -e "\n📦 Deploying Backend..."
cd backend
vercel --prod
if [ $? -ne 0 ]; then
    echo "❌ Backend deployment failed!"
    exit 1
fi
BACKEND_URL=$(vercel --prod --confirm)
echo "✅ Backend deployed: $BACKEND_URL"

# Deploy Frontend
echo -e "\n🎨 Deploying Frontend..."
cd ../frontend
vercel --prod
if [ $? -ne 0 ]; then
    echo "❌ Frontend deployment failed!"
    exit 1
fi
FRONTEND_URL=$(vercel --prod --confirm)
echo "✅ Frontend deployed: $FRONTEND_URL"

echo -e "\n🎉 Deployment Complete!"
echo "Backend:  $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
```

---

### Option 2: Individual Deployment Commands

#### Deploy Backend Only
```bash
cd backend
vercel --prod
```

#### Deploy Frontend Only
```bash
cd frontend
npm run build
vercel --prod
```

---

## Automated Workflow

### Full Deployment with Build & Test

Create `scripts/deploy-full.sh`:

```bash
#!/bin/bash

echo "🔍 Running pre-deployment checks..."

# Backend checks
echo "📦 Backend Checks..."
cd backend
npm install
npm run test:connection
npm run test:api

# Frontend checks
echo "🎨 Frontend Checks..."
cd ../frontend
npm install
npm run build

# Deploy if all checks pass
echo "✅ All checks passed! Deploying..."
cd backend
vercel --prod

cd ../frontend
vercel --prod

echo "🎉 Deployment successful!"
```

---

## Usage Instructions

### Make Script Executable (Linux/Mac)
```bash
chmod +x deploy.ps1
# or
chmod +x deploy.sh
```

### Run Deployment
```bash
# PowerShell
.\deploy.ps1

# Git Bash
./deploy.sh
```

---

## Environment-Specific Deployments

### Development Deployment
```bash
cd backend
vercel --env development

cd ../frontend
vercel --env development
```

### Staging Deployment
```bash
cd backend
vercel --env staging

cd ../frontend
vercel --env staging
```

### Production Deployment
```bash
cd backend
vercel --prod

cd ../frontend
vercel --prod
```

---

## Rollback Commands

### Rollback Backend
```bash
cd backend
vercel rollback
```

### Rollback Frontend
```bash
cd frontend
vercel rollback
```

---

## View Deployment Status

### List All Deployments
```bash
# Backend
cd backend
vercel ls

# Frontend
cd frontend
vercel ls
```

### View Logs
```bash
# Real-time logs
vercel logs

# Specific deployment
vercel logs <deployment-url>
```

---

## Tips for Faster Deployment

1. **Build Locally First**
   ```bash
   npm run build
   ```
   Fix errors before deploying

2. **Use Preview Deployments**
   ```bash
   vercel  # Creates preview URL
   ```
   Test before production

3. **Cache Dependencies**
   - Vercel caches node_modules automatically
   - Don't commit node_modules

4. **Optimize Bundle Size**
   ```bash
   npm run build -- --stats
   ```

---

## Troubleshooting

### Deployment Fails
```bash
# Check build locally
npm run build

# View detailed logs
vercel logs --follow
```

### Environment Variables Not Working
```bash
# Verify in Vercel dashboard
vercel env ls

# Add missing variable
vercel env add VARIABLE_NAME
```

### Build Too Slow
```bash
# Check bundle size
npm run build -- --stats

# Optimize vite.config.ts
```

---

## Best Practices

✅ **Always**:
- Test build locally first
- Use preview deployments
- Check logs after deploy
- Update environment variables in dashboard
- Monitor performance metrics

❌ **Never**:
- Commit .env files
- Skip testing
- Deploy directly to production without preview
- Ignore build warnings

---

## Post-Deployment Verification

After deployment, verify:

```bash
# Backend health check
curl https://your-backend.vercel.app/api/health

# Frontend check
curl https://your-frontend.vercel.app

# API endpoint test
curl https://your-backend.vercel.app/api/rings
```

---

## Success Criteria

Deployment is successful when:
- ✅ No build errors
- ✅ All routes accessible
- ✅ API calls working
- ✅ No console errors
- ✅ Performance acceptable
- ✅ Monitoring active

---

**Happy Deploying! 🚀**

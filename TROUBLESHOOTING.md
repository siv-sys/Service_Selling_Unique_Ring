# 🐛 Deployment Troubleshooting - Testing Failures

## Problem Identified: Backend Returning Frontend HTML

**Issue**: When calling `/api/health`, you're getting HTML instead of JSON response.

**Root Cause**: The backend routing or deployment configuration is incorrect.

---

## 🔍 Diagnosis Steps

### Step 1: Check What's Actually Deployed

Visit these URLs in your browser:

#### A. Backend Root
```
https://service-selling-unique-ring.vercel.app
```
**What you'll see**: If this shows frontend HTML, backend isn't deployed correctly

#### B. API Health Endpoint  
```
https://service-selling-unique-ring.vercel.app/api/health
```
**Expected**: `{"status": "ok", "database": "connected"}`  
**Actual**: Getting HTML (frontend)

#### C. Rings Endpoint
```
https://service-selling-unique-ring.vercel.app/api/rings
```
**Expected**: JSON with rings data  
**Actual**: Probably HTML too

---

## ✅ Solution: Redeploy Backend Properly

### Problem Analysis

Your `backend/vercel.json` is configured correctly, but Vercel might be:
1. Serving from wrong directory
2. Not building the Node.js server properly
3. Routes not registered in correct order

### Fix Option 1: Update vercel.json (Recommended)

The current vercel.json tries to include `dist/**` which doesn't exist for Node.js apps.

**Update `backend/vercel.json`:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ]
}
```

**Changes:**
- Removed `config.includeFiles` (not needed)
- Added explicit `/api/` route first
- Kept catch-all route second

Then redeploy:
```bash
cd backend
git add vercel.json
git commit -m "Fix vercel.json configuration"
git push
# Or manual deploy
vercel --prod
```

---

### Fix Option 2: Check server.js Export

Make sure your `src/server.js` exports the app correctly for Vercel:

**Should look like this:**

```javascript
const app = require('./app');

// For Vercel serverless
if (process.env.VERCEL) {
  module.exports = app;
} else {
  // Local development
  const PORT = process.env.PORT || 4001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

---

### Fix Option 3: Verify Environment Variables

Go to Vercel Dashboard → Backend Project → Settings → Environment Variables

**Ensure these are set:**

```
NODE_ENV=production
DB_HOST=your-database-host
DB_USER=root
DB_PASSWORD=***
DB_NAME=bondkeeper
JWT_SECRET=your-secret-key-min-32-chars
CLIENT_URL=https://service-selling-unique-ring-8bmk.vercel.app
PORT=4001
```

**After adding/updating, redeploy:**
```bash
cd backend
vercel --prod
```

---

## 🧪 Test After Each Fix

### Test 1: Check if Backend Responds

```bash
# PowerShell
Invoke-WebRequest -Uri "https://service-selling-unique-ring.vercel.app/api/health" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-03-30T..."
}
```

If still getting HTML → Backend not deployed correctly

---

### Test 2: Check Logs

```bash
cd backend
vercel logs --follow
```

Look for:
- ✅ "Server running" messages
- ❌ Error messages
- ❌ Database connection failures
- ❌ Route registration errors

---

### Test 3: Try Different Endpoints

```bash
# Rings endpoint
Invoke-WebRequest -Uri "https://service-selling-unique-ring.vercel.app/api/rings" -UseBasicParsing | Select-Object -ExpandProperty Content

# Dashboard stats
Invoke-WebRequest -Uri "https://service-selling-unique-ring.vercel.app/api/dashboard/user-management-stats" -UseBasicParsing | Select-Object -ExpandProperty Content
```

All should return JSON, not HTML.

---

## 🚨 Common Issues & Solutions

### Issue 1: Getting HTML on All API Calls

**Symptom**: Every `/api/*` call returns HTML

**Causes:**
1. Backend server not starting
2. Routes not registered
3. Wrong entry point in vercel.json

**Solutions:**
- ✅ Check vercel.json points to correct file
- ✅ Verify server.js exports app correctly
- ✅ Check environment variables
- ✅ Review deployment logs in Vercel

---

### Issue 2: Database Connection Failed

**Symptom**: Health check returns error or 500

**Solution:**
1. Verify database credentials in Vercel env vars
2. Ensure database allows connections from Vercel IPs
3. Check database is running and accessible
4. Test connection string locally first

---

### Issue 3: CORS Errors (After Backend Works)

**Symptom**: 
```
Access to fetch blocked by CORS policy
```

**Solution:**
Backend already has CORS configured in app.js:
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || '*'
}));
```

Make sure `CLIENT_URL` is set correctly in Vercel.

---

## 📋 Quick Fix Checklist

Run through these steps IN ORDER:

- [ ] **Step 1**: Update `backend/vercel.json` (remove dist config)
- [ ] **Step 2**: Check `src/server.js` exports app correctly
- [ ] **Step 3**: Verify all environment variables in Vercel dashboard
- [ ] **Step 4**: Redeploy backend: `cd backend && vercel --prod`
- [ ] **Step 5**: Test health endpoint again
- [ ] **Step 6**: Check logs for errors
- [ ] **Step 7**: Test other API endpoints

---

## 🎯 Expected Behavior After Fix

### All These Should Work:

```bash
# Returns JSON health check
GET /api/health

# Returns JSON rings list  
GET /api/rings

# Returns JSON single ring
GET /api/rings/1

# Returns JSON filters
GET /api/rings/filter-options

# Returns JSON cart (with session)
GET /api/cart
```

### Frontend Should Still Work:

```
https://service-selling-unique-ring-8bmk.vercel.app
```

Loads normally with no console errors.

---

## 🔄 Alternative: Complete Backend Redeploy

If nothing works, do a complete redeploy:

```bash
cd backend

# Clean install
Remove-Item -Recurse -Force node_modules
npm install

# Test locally
npm start
# Should work on localhost:4001

# Deploy to Vercel
vercel link
vercel --prod
```

---

## 📞 Need More Help?

### Check These Files:
- **DEPLOYMENT.md** - Full deployment guide
- **TESTING_GUIDE.md** - Comprehensive testing
- **DEPLOYMENT_STATUS.md** - Current status

### View Deployment Logs:
```bash
cd backend
vercel logs
```

### Contact:
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Check Vercel Status: [status.vercel.com](https://status.vercel.com)

---

## ✨ Success Indicators

You've fixed it when:

✅ `/api/health` returns JSON not HTML  
✅ `/api/rings` returns ring data  
✅ No errors in Vercel logs  
✅ Frontend can call API successfully  
✅ Browser console shows no CORS errors  

---

**Next Step**: Start with Fix Option 1 (update vercel.json), then test!

**Status**: Troubleshooting in Progress  
**Priority**: High - Blocking All Testing

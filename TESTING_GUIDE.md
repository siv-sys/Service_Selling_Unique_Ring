# 🧪 Testing Your Deployed RingOS Platform

## Quick Testing Guide for Live Deployment

---

## 🌐 Your Live URLs (CORRECTED)

**Frontend**: [https://service-selling-unique-ring.vercel.app](https://service-selling-unique-ring.vercel.app)  
**Backend API**: [https://service-selling-unique-ring-8bmk.vercel.app/api](https://service-selling-unique-ring-8bmk.vercel.app/api)

---

## ⚠️ IMPORTANT: Backend Routing Fix Required

**Before testing**, ensure you've deployed the backend routing fix:

```bash
cd c:\Users\USER\OneDrive\Desktop\Service_Selling_Unique_Ring\backend
vercel --prod
```

This fixes an issue where `/api/*` endpoints were returning HTML instead of JSON.

**Test if fix is deployed:**
```powershell
Invoke-WebRequest -Uri "https://service-selling-unique-ring-8bmk.vercel.app/api/health" -UseBasicParsing | Select-Object -ExpandProperty Content
```

Should return JSON, not HTML. See [FIX_BACKEND_DEPLOYMENT.md](file://c:\Users\USER\OneDrive\Desktop\Service_Selling_Unique_Ring\FIX_BACKEND_DEPLOYMENT.md) for details.

---

## ✅ Phase 1: Backend API Tests

### Test 1: Health Check (Most Important!)

Open browser or use terminal:

```bash
# PowerShell
Invoke-WebRequest -Uri "https://service-selling-unique-ring-8bmk.vercel.app/api/health" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Result:**
```json
{
  "success": true,
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-03-30T..."
}
```

❌ **If you get HTML instead**: Backend routing fix not deployed yet. See [FIX_BACKEND_DEPLOYMENT.md](file://c:\Users\USER\OneDrive\Desktop\Service_Selling_Unique_Ring\FIX_BACKEND_DEPLOYMENT.md)

---

### Test 2: Get Rings List

```powershell
# PowerShell
Invoke-WebRequest -Uri "https://service-selling-unique-ring-8bmk.vercel.app/api/rings" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Result:**
```json
{
  "success": true,
  "data": [...array of rings...],
  "pagination": {...}
}
```

❌ **If this fails**: Database connection issue - check DB credentials

---

### Test 3: Get Ring by ID

```powershell
# PowerShell
Invoke-WebRequest -Uri "https://service-selling-unique-ring-8bmk.vercel.app/api/rings/1" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Result:**
```json
{
  "success": true,
  "data": { ring object }
}
```

---

### Test 4: Get Filter Options

```powershell
# PowerShell
Invoke-WebRequest -Uri "https://service-selling-unique-ring-8bmk.vercel.app/api/rings/filter-options" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "materials": [...],
    "priceRange": {...}
  }
}
```

---

## ✅ Phase 2: Frontend Visual Tests

### Step 1: Homepage Load Test

1. Open: [https://service-selling-unique-ring.vercel.app](https://service-selling-unique-ring.vercel.app)
2. **Check these load correctly:**
   - [ ] Header/navigation bar
   - [ ] Hero section
   - [ ] Featured rings
   - [ ] Footer

**Open Browser DevTools (F12)**
- Go to Console tab
- Should see NO red errors
- May see some warnings (those are OK)

---

### Step 2: Navigation Test

Click through these pages:

#### Dashboard
- URL: `/dashboard`
- **Should show:**
  - [ ] Welcome message
  - [ ] Statistics cards
  - [ ] Recent activity

#### Shop/Rings
- URL: `/shop`
- **Should show:**
  - [ ] Ring grid
  - [ ] Filter options
  - [ ] Search bar
  - [ ] Add to cart buttons

#### Login Page
- URL: `/login`
- **Should show:**
  - [ ] Login form
  - [ ] Google login button
  - [ ] Register link

#### Register Page
- URL: `/register`
- **Should show:**
  - [ ] Registration form
  - [ ] All required fields

---

### Step 3: Shopping Cart Test

1. Go to Shop page
2. Click "Add to Cart" on any ring
3. **Check:**
   - [ ] Notification appears
   - [ ] Cart count updates
   - [ ] Can view cart items

4. Go to Cart page
5. **Check:**
   - [ ] Items display correctly
   - [ ] Can update quantity
   - [ ] Can remove items
   - [ ] Order summary calculates correctly

---

### Step 4: User Authentication Test

#### Register New User
1. Go to Register page
2. Fill in form with test data:
   ```
   Name: Test User
   Email: test@example.com
   Password: TestPass123!
   ```
3. Submit form
4. **Should:**
   - [ ] Create account successfully
   - [ ] Redirect to dashboard
   - [ ] Show welcome message

#### Login
1. Go to Login page
2. Use credentials from above
3. **Should:**
   - [ ] Login successfully
   - [ ] Redirect to dashboard
   - [ ] Show user profile

---

### Step 5: Profile Management Test

After logging in:

1. Go to Profile page
2. **Check:**
   - [ ] User info displays
   - [ ] Can upload avatar
   - [ ] Can update information
   - [ ] Changes save successfully

---

## ✅ Phase 3: Integration Tests

### Test API Calls from Browser

1. Open frontend in browser: [https://service-selling-unique-ring.vercel.app](https://service-selling-unique-ring.vercel.app)
2. Press F12 (DevTools)
3. Go to **Network** tab
4. Navigate through app
5. **Check for each API call:**
   - Status should be 200 or 201
   - Response should have correct data
   - No failed requests (red)

**Example Network Requests:**
```
GET https://service-selling-unique-ring-8bmk.vercel.app/api/rings - Should return 200
GET https://service-selling-unique-ring-8bmk.vercel.app/api/rings/filter-options - Should return 200
POST https://service-selling-unique-ring-8bmk.vercel.app/api/cart/add - Should return 201
GET https://service-selling-unique-ring-8bmk.vercel.app/api/users/profile - Should return 200
```

---

## ✅ Phase 4: Performance Tests

### Page Load Speed

Use Chrome DevTools:

1. Press F12
2. Go to **Lighthouse** tab
3. Click "Analyze page load"
4. **Target scores:**
   - Performance: > 90
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 90

### API Response Time

In PowerShell:
```powershell
# Measure response time
Measure-Command { 
  Invoke-WebRequest -Uri "https://service-selling-unique-ring-8bmk.vercel.app/api/rings" -UseBasicParsing 
}
```

**Target**: < 500ms

---

## 🐛 Common Issues & How to Fix

### Issue 1: Backend Returns HTML Instead of JSON

**Symptoms:**
- `/api/health` returns HTML page
- All API calls return HTML
- PowerShell shows `<!DOCTYPE html>` in response

**Diagnosis:**
1. Run: `Invoke-WebRequest -Uri "https://service-selling-unique-ring-8bmk.vercel.app/api/health" -UseBasicParsing | Select-Object -ExpandProperty Content`
2. If you see `<html>` tags → Backend routing issue

**Fix:**
Deploy the backend routing fix:
```bash
cd c:\Users\USER\OneDrive\Desktop\Service_Selling_Unique_Ring\backend
vercel --prod
```

See full details: [FIX_BACKEND_DEPLOYMENT.md](file://c:\Users\USER\OneDrive\Desktop\Service_Selling_Unique_Ring\FIX_BACKEND_DEPLOYMENT.md)

---

### Issue 2: Blank White Page

**Symptoms:**
- Frontend is completely white
- Nothing loads at [https://service-selling-unique-ring.vercel.app](https://service-selling-unique-ring.vercel.app)

**Diagnosis:**
1. Open Console (F12)
2. Look for errors

**Common Fixes:**
- Missing VITE_API_URL → Add to Vercel env vars
- Wrong API URL → Check frontend/.env.production
- Build error → Rebuild locally first: `npm run build`

---

### Issue 3: CORS Errors

**Symptoms:**
```
Access to fetch at 'https://service-selling-unique-ring-8bmk.vercel.app/api/...' from origin 'https://service-selling-unique-ring.vercel.app' has been blocked by CORS policy
```

**Fix:**
1. Check backend CLIENT_URL in Vercel dashboard
2. Should be: `https://service-selling-unique-ring.vercel.app`
3. Redeploy backend after updating env vars
4. Verify in backend/.env.production:
   ```
   CLIENT_URL=https://service-selling-unique-ring.vercel.app
   ```

---

### Issue 4: Database Connection Failed

**Symptoms:**
- API returns 500 errors
- Health check fails with database error
- Logs show connection refused

**Fix:**
1. Go to Vercel Dashboard → Backend Project
2. Settings → Environment Variables
3. Verify these are set:
   ```
   DB_HOST=your-database-host
   DB_USER=root
   DB_PASSWORD=***
   DB_NAME=bondkeeper
   ```
4. Redeploy backend after adding env vars

---

### Issue 5: 404 on Routes

**Symptoms:**
- Pages show 404 Not Found
- Refresh causes 404

**Fix:**
- This is normal for SPAs on Vercel
- vercel.json handles rewrites
- Direct navigation should work
- If persists, redeploy frontend

---

## 📊 Test Results Template

Copy this and check off as you test:

```
BACKEND TESTS:
[ ] /api/health - Returns success
[ ] /api/rings - Returns ring list
[ ] /api/rings/:id - Returns single ring
[ ] /api/rings/filter-options - Returns filters

FRONTEND VISUAL:
[ ] Homepage loads
[ ] Navigation works
[ ] Dashboard displays
[ ] Shop page shows rings
[ ] Login/Register forms work
[ ] Cart functions

INTEGRATION:
[ ] API calls succeed (status 200/201)
[ ] No console errors
[ ] Network tab clean
[ ] Data displays correctly

AUTHENTICATION:
[ ] Can register new user
[ ] Can login
[ ] Session persists
[ ] Profile accessible

PERFORMANCE:
[ ] Page load < 2 seconds
[ ] API response < 500ms
[ ] Lighthouse score > 90
```

---

## 🔍 Monitoring Tools

### View Real-Time Logs

```bash
# Backend logs
cd backend
vercel logs --follow

# Frontend logs  
cd frontend
vercel logs --follow
```

### Check Analytics

1. [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project
3. View:
   - Visitor count
   - Bandwidth usage
   - Error rates
   - Performance metrics

---

## ⚡ Quick Test Commands

Run all these in PowerShell:

```powershell
# Test 1: Health Check (should return JSON, not HTML!)
Invoke-WebRequest -Uri "https://service-selling-unique-ring-8bmk.vercel.app/api/health" -UseBasicParsing | Select-Object -ExpandProperty Content

# Test 2: Rings List
Invoke-WebRequest -Uri "https://service-selling-unique-ring-8bmk.vercel.app/api/rings" -UseBasicParsing | Select-Object -ExpandProperty Content

# Test 3: Dashboard Stats
Invoke-WebRequest -Uri "https://service-selling-unique-ring-8bmk.vercel.app/api/dashboard/user-management-stats" -UseBasicParsing | Select-Object -ExpandProperty Content

# Test 4: Filter Options
Invoke-WebRequest -Uri "https://service-selling-unique-ring-8bmk.vercel.app/api/rings/filter-options" -UseBasicParsing | Select-Object -ExpandProperty Content
```

All should return JSON. If you get HTML on Test 1, deploy the backend routing fix first!

---

## 🎯 Success Criteria

Your deployment is working when ALL are true:

✅ **Backend:**
- Health endpoint returns 200
- All API routes respond
- No server errors in logs
- Database connected

✅ **Frontend:**
- Homepage loads without errors
- All pages accessible
- Navigation works
- No console errors
- API calls succeed

✅ **Performance:**
- Page loads in < 2 seconds
- API responds in < 500ms
- Lighthouse score > 90

✅ **User Experience:**
- Can browse rings
- Can add to cart
- Can register/login
- Profile management works

---

## 📞 If Tests Fail

### Document the Issue

1. Take screenshot of error
2. Note exact error message
3. Record what you were doing
4. Check browser console
5. Check network tab

### Check Logs

```bash
# Backend errors
cd backend
vercel logs --follow | grep "Error"

# Frontend errors
cd frontend
vercel logs --follow | grep "Error"
```

### Get Help

- Check DEPLOYMENT.md for detailed troubleshooting
- Review DEPLOYMENT_STATUS.md for known issues
- Check Vercel dashboard for deployment errors

---

## 🎉 Test Complete!

Once all tests pass:

✅ Share your live URL with users  
✅ Monitor analytics regularly  
✅ Gather user feedback  
✅ Plan next iteration  

---

**Good luck with testing!** 🚀

**Status**: Ready for Testing  
**Version**: 2.0.0  
**Deployed**: March 30, 2026

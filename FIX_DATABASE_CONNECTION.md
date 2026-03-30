# 🚨 URGENT: Database Connection Error

## Problem Identified

Your backend deployment is returning:
```json
{
  "status": "error",
  "database": "disconnected",
  "message": "connect ECONNREFUSED 127.0.0.1:3306"
}
```

**Translation**: The deployed backend is trying to connect to `localhost:3306` instead of your production database!

---

## ✅ Solution: Add Environment Variables to Vercel

Your backend code is correct, but it needs the production database credentials in Vercel's environment variables.

---

## 🔧 Step-by-Step Fix

### Step 1: Go to Vercel Dashboard

Visit: [https://vercel.com/dashboard](https://vercel.com/dashboard)

### Step 2: Select Backend Project

Click on: **service-selling-unique-ring-8bmk** (your backend project)

### Step 3: Go to Environment Variables

Click: **Settings** → **Environment Variables**

### Step 4: Add These Variables

#### Add DB_HOST
- **Key**: `DB_HOST`
- **Value**: Your production database host (e.g., `your-db-host.com` or IP address)
- **Environment**: Production ✅
- Click **Save**

#### Add DB_USER
- **Key**: `DB_USER`
- **Value**: `root` (or your database username)
- **Environment**: Production ✅
- Click **Save**

#### Add DB_PASSWORD
- **Key**: `DB_PASSWORD`
- **Value**: Your database password
- **Environment**: Production ✅
- Click **Save**

#### Add DB_NAME
- **Key**: `DB_NAME`
- **Value**: `bondkeeper` (or your database name)
- **Environment**: Production ✅
- Click **Save**

#### Add JWT_SECRET
- **Key**: `JWT_SECRET`
- **Value**: Generate one with this command:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Environment**: Production ✅
- Click **Save**

#### Add CLIENT_URL
- **Key**: `CLIENT_URL`
- **Value**: `https://service-selling-unique-ring.vercel.app`
- **Environment**: Production ✅
- Click **Save**

#### Add NODE_ENV
- **Key**: `NODE_ENV`
- **Value**: `production`
- **Environment**: Production ✅
- Click **Save**

---

## 📋 Complete List of Required Variables

After adding all, you should have:

| Variable | Value | Required |
|----------|-------|----------|
| `DB_HOST` | your-database-host.com | ✅ |
| `DB_USER` | root | ✅ |
| `DB_PASSWORD` | *** | ✅ |
| `DB_NAME` | bondkeeper | ✅ |
| `JWT_SECRET` | random-32-char-string | ✅ |
| `CLIENT_URL` | https://service-selling-unique-ring.vercel.app | ✅ |
| `NODE_ENV` | production | ✅ |

---

## 🔄 Step 5: Redeploy After Adding Variables

After adding ALL environment variables, redeploy:

### Option A: Automatic Redeploy
Vercel usually redeploys automatically when you add env vars. Check if deployment started.

### Option B: Manual Redeploy
```bash
cd c:\Users\USER\OneDrive\Desktop\Service_Selling_Unique_Ring\backend
vercel --prod
```

Wait ~2 minutes for deployment to complete.

---

## ✅ Step 6: Test Again

After redeployment completes, test:

```powershell
Invoke-WebRequest -Uri "https://service-selling-unique-ring-8bmk.vercel.app/api/health" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-03-30T..."
}
```

NOT the error anymore!

---

## 🐛 If Still Getting Error

### Check 1: Verify Variables Are Set

In Vercel Dashboard → Settings → Environment Variables, ensure all 7 variables are listed.

### Check 2: Test Database Connection Locally

Create a test file `test-db.js`:

```javascript
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    
    console.log('✅ Connection successful!');
    await connection.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
```

Run it:
```bash
node test-db.js
```

If this fails locally, your credentials are wrong.

### Check 3: Database Accessibility

Ensure your production database:
- Allows external connections
- Isn't localhost/127.0.0.1
- Has proper firewall rules
- Whitelists Vercel IPs if needed

---

## 💡 Common Database Setup Options

### Option A: Use PlanetScale (Free MySQL Hosting)

1. Visit: [planetscale.com](https://planetscale.com)
2. Create free account
3. Create new database: `bondkeeper`
4. Get connection credentials
5. Use those credentials in Vercel env vars

### Option B: AWS RDS

1. Create RDS MySQL instance
2. Get endpoint URL
3. Use as DB_HOST

### Option C: Railway

1. Visit: [railway.app](https://railway.app)
2. Create MySQL database
3. Get connection string
4. Extract credentials

### Option D: Your Own Server

If you have a VPS/server:
- Use server IP as DB_HOST
- Ensure MySQL allows remote connections
- Configure firewall properly

---

## 🔒 Security Reminder

⚠️ **NEVER** commit `.env.production` to Git!  
✅ Keep secrets only in Vercel Environment Variables  
✅ Use strong passwords  
✅ Enable 2FA on Vercel account  

---

## 📊 Success Indicators

You've fixed it when:

✅ Health endpoint returns:
```json
{
  "status": "ok",
  "database": "connected"
}
```

✅ No more "ECONNREFUSED 127.0.0.1:3306" error  
✅ All API endpoints work  
✅ Frontend can call backend successfully  

---

## ⏱️ Quick Checklist

Time needed: ~10 minutes

- [ ] Open Vercel Dashboard
- [ ] Select backend project
- [ ] Go to Settings → Environment Variables
- [ ] Add all 7 required variables
- [ ] Save each one
- [ ] Wait for redeploy OR trigger manually
- [ ] Test health endpoint
- [ ] Verify JSON response (not error)

---

## 🆘 Emergency Commands

### View Current Deployment Status
```bash
cd backend
vercel ls
```

### View Logs to See Errors
```bash
cd backend
vercel logs --follow
```

Look for database connection errors.

### Force Redeploy
```bash
cd backend
vercel --prod --force
```

---

## 📞 Need Help?

### If You Don't Have a Production Database Yet

**Recommended**: Use PlanetScale (Free Tier)

1. Sign up at [planetscale.com](https://planetscale.com)
2. Create database: `bondkeeper`
3. Copy connection credentials
4. Add to Vercel environment variables
5. Redeploy backend

### If Database Exists But Won't Connect

Check:
1. Database is running
2. Credentials are correct
3. Firewall allows connections
4. User has proper permissions

---

## ✨ What Happened

**Before**: 
- Backend tried to connect to `localhost:3306`
- This is YOUR computer's database
- Deployed backend can't reach your localhost!

**After Adding Env Vars**:
- Backend connects to production database
- Database accessible from Vercel servers
- Everything works! ✅

---

**STATUS**: 🔴 URGENT - Add Environment Variables NOW  
**ACTION**: Follow Step-by-Step Fix above  
**TIME**: ~10 minutes  

**Good luck! Let me know once you've added the variables!** 🚀

# 🚀 Vercel Deployment - Quick Reference Card

## One-Page Cheat Sheet

---

## ⚡ Super Quick Deploy (5 Minutes)

```bash
# Install & Login
npm install -g vercel
vercel login

# Deploy Backend
cd backend
vercel --prod

# Deploy Frontend  
cd ../frontend
vercel --prod
```

**Done!** ✅

---

## 📁 Essential Files

| File | Location | Purpose |
|------|----------|---------|
| **vercel.json** | `backend/` & `frontend/` | Deployment config |
| **.env.production** | `backend/` & `frontend/` | Environment variables |
| **DEPLOYMENT.md** | Root | Complete guide |
| **DEPLOYMENT_CHECKLIST.md** | Root | Step-by-step checklist |

---

## 🔑 Required Environment Variables

### Backend (.env.production)
```env
NODE_ENV=production
DB_HOST=your-db-host.com
DB_USER=root
DB_PASSWORD=***
DB_NAME=bondkeeper
JWT_SECRET=generate-32-char-key
CLIENT_URL=https://your-frontend.vercel.app
```

### Frontend (.env.production)
```env
VITE_API_URL=https://your-backend-api.vercel.app/api
```

---

## 🎯 Deployment Commands

### Full Deployment
```bash
vercel login
cd backend && vercel --prod
cd ../frontend && vercel --prod
```

### Individual Deployments
```bash
# Backend only
cd backend && vercel --prod

# Frontend only
cd frontend && vercel --prod
```

### Preview Deployment
```bash
vercel  # Creates preview URL
```

---

## ✅ Post-Deployment Checks

### Backend Health Check
```bash
curl https://your-backend-api.vercel.app/api/health
```

### Frontend Check
1. Visit: `https://your-frontend.vercel.app`
2. Test login
3. Browse rings
4. Check console (no errors)

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Test locally: `npm run build` |
| CORS errors | Update `CLIENT_URL` in backend .env |
| DB connection failed | Check env vars in Vercel dashboard |
| 404 on routes | Verify vercel.json configuration |

---

## 📊 Vercel Dashboard URLs

- **Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Status**: [status.vercel.com](https://status.vercel.com)
- **Your Frontend**: [service-selling-unique-ring.vercel.app](https://service-selling-unique-ring.vercel.app)
- **Your Backend**: [service-selling-unique-ring-8bmk.vercel.app](https://service-selling-unique-ring-8bmk.vercel.app)

---

## 💡 Pro Tips

✅ Always test build locally first  
✅ Use preview deployments before production  
✅ Check logs after deploy: `vercel logs --follow`  
✅ Keep secrets in environment variables  
✅ Never commit `.env` files  

❌ Don't skip testing  
❌ Don't deploy directly to prod without preview  
❌ Don't ignore build warnings  

---

## 🆘 Emergency Rollback

```bash
# Rollback to previous deployment
vercel rollback
```

---

## 📞 Need Help?

- **Complete Guide**: DEPLOYMENT.md
- **Checklist**: DEPLOYMENT_CHECKLIST.md
- **Scripts**: DEPLOY_SCRIPT.md
- **Summary**: VERCEL_DEPLOYMENT_SUMMARY.md

---

**Print this page and keep it handy during deployment!**

**Version**: 2.0.0 | **Status**: ✅ Ready for Production

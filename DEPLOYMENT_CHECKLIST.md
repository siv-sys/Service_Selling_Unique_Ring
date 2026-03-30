# 🚀 Vercel Deployment Checklist

## Pre-Deployment Preparation

### Backend Preparation
- [ ] All dependencies installed (`npm install`)
- [ ] `.env.production` created with all required variables
- [ ] Database credentials configured for production
- [ ] JWT secret key generated (min 32 chars)
- [ ] CORS configured with frontend URL
- [ ] Error handling implemented globally
- [ ] Logging configured appropriately
- [ ] No `console.log()` statements in production code
- [ ] Server.js compatible with Vercel serverless
- [ ] All routes tested locally
- [ ] API endpoints documented

### Frontend Preparation
- [ ] Build succeeds locally (`npm run build`)
- [ ] No TypeScript errors
- [ ] No console errors in development
- [ ] API URLs use environment variables
- [ ] `.env.production` created
- [ ] Images optimized
- [ ] Unused dependencies removed
- [ ] Routing works with SPA rewrites
- [ ] Mobile responsive tested
- [ ] Accessibility checked

### Documentation
- [ ] README.md updated
- [ ] Environment variables documented
- [ ] API documentation current
- [ ] Deployment guide reviewed

---

## Environment Variables Setup

### Backend (.env.production)
- [ ] `PORT` configured
- [ ] `NODE_ENV=production`
- [ ] `DB_HOST` - Production database host
- [ ] `DB_USER` - Database username
- [ ] `DB_PASSWORD` - Strong password set
- [ ] `DB_NAME` - Production database name
- [ ] `JWT_SECRET` - Generated secure key (32+ chars)
- [ ] `CLIENT_URL` - Frontend production URL
- [ ] `REDIS_URL` (if using Redis)
- [ ] Email service credentials (if using)

### Frontend (.env.production)
- [ ] `VITE_API_URL` - Backend production URL
- [ ] `VITE_APP_NAME`
- [ ] Analytics IDs (if using)
- [ ] OAuth client IDs (if using)

---

## Vercel Account Setup

### Backend Project
- [ ] Vercel account created
- [ ] GitHub integration enabled (if using Git)
- [ ] New project created in Vercel
- [ ] Root directory set to `backend`
- [ ] Build command: `npm install`
- [ ] Output directory: (leave blank)
- [ ] Environment variables added in dashboard
- [ ] Custom domain configured (optional)

### Frontend Project
- [ ] New project created in Vercel
- [ ] Root directory set to `frontend`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variables added in dashboard
- [ ] Rewrites configured in `vercel.json`
- [ ] Custom domain configured (optional)

---

## Code Configuration

### Backend Updates
- [ ] `vercel.json` properly configured
- [ ] CORS allows frontend origin
- [ ] Database connection pooling configured
- [ ] Error responses formatted correctly
- [ ] Security headers configured
- [ ] Rate limiting enabled (optional)

### Frontend Updates
- [ ] `vercel.json` has SPA rewrites
- [ ] API base URL uses env variable
- [ ] Build optimizations configured
- [ ] Asset paths are relative
- [ ] No hardcoded localhost URLs

---

## Local Testing

### Backend Tests
- [ ] `npm run test:connection` passes
- [ ] `npm run test:api` passes
- [ ] All routes respond correctly
- [ ] Authentication works
- [ ] File uploads work (if applicable)
- [ ] Database queries execute successfully

### Frontend Tests
- [ ] Homepage loads without errors
- [ ] Login/Register flows work
- [ ] API calls succeed
- [ ] Routing works (all pages accessible)
- [ ] Forms submit correctly
- [ ] Cart functionality works
- [ ] Dark mode toggles (if implemented)

---

## Deployment Execution

### Backend Deployment
```bash
cd backend
```
- [ ] Run `vercel login`
- [ ] Run `vercel init` (first time only)
- [ ] Run `vercel link` (connect to project)
- [ ] Run `vercel` (deploy to preview)
- [ ] Test preview URL
- [ ] Run `vercel --prod` (production deploy)
- [ ] Save production URL

### Frontend Deployment
```bash
cd frontend
```
- [ ] Update `VITE_API_URL` in .env.production
- [ ] Run `npm run build` (verify build)
- [ ] Run `vercel` (deploy to preview)
- [ ] Test preview URL
- [ ] Run `vercel --prod` (production deploy)

---

## Post-Deployment Verification

### Backend Checks
- [ ] Visit: `https://your-backend.vercel.app/api/health`
- [ ] Check response: Should return success
- [ ] Test authentication endpoint
- [ ] Verify database connection
- [ ] Check error handling
- [ ] Monitor logs in Vercel dashboard
- [ ] Test rate limiting (if enabled)

### Frontend Checks
- [ ] Visit: `https://your-frontend.vercel.app`
- [ ] Homepage loads correctly
- [ ] Login page accessible
- [ ] Can register new user
- [ ] Can browse rings
- [ ] Can add items to cart
- [ ] Navigation works
- [ ] No console errors
- [ ] Network requests succeed (check DevTools)

### Integration Tests
- [ ] Frontend can call backend API
- [ ] Login creates valid session
- [ ] Protected routes require auth
- [ ] File uploads work (if applicable)
- [ ] Real-time features work (if using Socket.io)

---

## Performance Optimization

### Frontend Performance
- [ ] Enable compression (automatic on Vercel)
- [ ] Optimize images (WebP format)
- [ ] Lazy load components
- [ ] Code splitting implemented
- [ ] Bundle size < 500KB
- [ ] First contentful paint < 1.5s
- [ ] Lighthouse score > 90

### Backend Performance
- [ ] Database queries optimized
- [ ] Connection pooling enabled
- [ ] Caching implemented (Redis)
- [ ] Response time < 200ms
- [ ] Memory usage acceptable
- [ ] No memory leaks

---

## Security Checklist

### Backend Security
- [ ] All dependencies up to date
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Environment variables not committed
- [ ] `.env` in `.gitignore`
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting enabled
- [ ] HTTPS enforced (automatic on Vercel)

### Frontend Security
- [ ] No sensitive data in client code
- [ ] API keys not exposed
- [ ] XSS protection headers
- [ ] Content Security Policy
- [ ] Secure cookie settings
- [ ] Authentication tokens stored securely

---

## Monitoring Setup

### Vercel Analytics
- [ ] Web Analytics enabled
- [ ] Speed insights enabled
- [ ] Custom dashboards created (optional)

### Error Tracking
- [ ] Sentry integrated (optional)
- [ ] Error boundaries in React components
- [ ] Global error handler in Express
- [ ] Logging configured

### Database Monitoring
- [ ] Slow query logging enabled
- [ ] Connection pool monitoring
- [ ] Query performance tracked

---

## DNS & Domain Configuration (Optional)

### Custom Domain Setup
- [ ] Domain purchased
- [ ] DNS records configured:
  - [ ] CNAME for www subdomain
  - [ ] A record for root domain
- [ ] SSL certificate issued (automatic on Vercel)
- [ ] Domain verified in Vercel
- [ ] Redirect www to non-www (or vice versa)

---

## Documentation Updates

### Update These Files
- [ ] README.md with deployment URLs
- [ ] PROJECT_STATUS.md with current status
- [ ] RELEASE_NOTES.md with deployment info
- [ ] API documentation if endpoints changed

---

## Rollback Plan

### If Something Goes Wrong
- [ ] Previous deployment still accessible
- [ ] Database backup created
- [ ] Rollback procedure documented
- [ ] Team notified of deployment window
- [ ] Support contact information available

---

## Final Steps

### Go-Live Approval
- [ ] All tests passed
- [ ] Performance metrics acceptable
- [ ] Security review complete
- [ ] Stakeholders notified
- [ ] Monitoring active
- [ ] Support team ready

### Post-Launch
- [ ] Announce launch to users
- [ ] Monitor for issues first 24 hours
- [ ] Collect user feedback
- [ ] Document any issues encountered
- [ ] Plan next iteration

---

## Quick Deploy Commands

### One-Time Full Deployment
```bash
# Backend
cd backend
vercel --prod

# Frontend  
cd ../frontend
vercel --prod
```

### Update Frontend Only
```bash
cd frontend
npm run build
vercel --prod
```

### Update Backend Only
```bash
cd backend
vercel --prod
```

---

## Useful URLs

- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Backend Project**: [Your backend URL]
- **Frontend Project**: [Your frontend URL]
- **Status Page**: [status.vercel.com](https://status.vercel.com)

---

## Emergency Contacts

- **Technical Lead**: [Name/Email]
- **DevOps**: [Name/Email]
- **Support**: [support@ringos.com]

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Version**: 2.0.0  
**Status**: ☐ Ready ☐ In Progress ☐ Blocked

---

*Print this checklist and check off each item as you complete it!*

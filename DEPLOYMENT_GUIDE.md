# Deployment Guide: Teladoc Express on Vercel + Railway

This guide covers deploying the **Cornell Health AI** application to production using:
- **Frontend**: Next.js on Vercel
- **Backend**: Python FastAPI on Railway (free tier)

## Architecture Overview

```
┌─────────────────────────┐
│   Users / Browser       │
└────────────┬────────────┘
             │ HTTPS
             ▼
┌─────────────────────────────────────────┐
│         Vercel Edge Network             │
│  ┌─────────────────────────────────┐   │
│  │  Next.js Frontend (React/TS)    │   │
│  │  - /medical-history             │   │
│  │  - /voice-recording             │   │
│  │  - /review                      │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  API Proxy (/api/model/analyze) │   │
│  │  (forwards to Railway)          │   │
│  └──────────────┬────────────────┘   │
└─────────────────┼──────────────────────┘
                  │ HTTPS
                  ▼
        ┌──────────────────────┐
        │   Railway Container  │
        │ ┌──────────────────┐ │
        │ │ Python FastAPI   │ │
        │ │ - /healthz       │ │
        │ │ - /v1/analyze/phq│ │
        │ │ - Model Inference│ │
        │ └──────────────────┘ │
        └──────────────────────┘
```

## Prerequisites

### Required Accounts
- GitHub account (repository access)
- Vercel account (free tier)
- Railway account (free tier)

### Local Setup
- Node.js 20+ with npm
- Git

## Part 1: Deploy Python ML Service to Railway

### Step 1.1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign up / Log in with GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. Select the `cornell-health-ai` repository
5. Click **Deploy**

### Step 1.2: Configure Railway Service

Railway will automatically detect the `Procfile` and Python environment:

1. **Set Environment Variables** (Railway Dashboard → Variables tab):
   ```
   TABPFN_DISABLE_TELEMETRY=1
   ML_TABPFN_CANDIDATES=6.4.1,6.3.2,2.2.1
   ```

2. **Configure Build Settings** (if needed):
   - Build command: (leave empty — Railway auto-detects Procfile)
   - Start command: (handled by Procfile)

3. **Wait for Deployment**
   - Railway will build the image and deploy
   - First deployment takes 5-10 minutes (dependencies install, model loads)
   - Monitor logs in the Railway dashboard

### Step 1.3: Retrieve ML Service URL

Once deployed:
1. Go to Railway Dashboard → Your Project → Deployments
2. Click the active deployment
3. Find the **Public URL** (e.g., `https://teladoc-ml-service-prod.railway.app`)
4. **Test the service**: GET `https://teladoc-ml-service-prod.railway.app/healthz`
   - Should return: `{ "status": "ready", "model_name": "...", "thresholds": {...} }`
5. **Save this URL** — you'll need it for Vercel configuration

---

## Part 2: Deploy Next.js Frontend to Vercel

### Step 2.1: Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Sign up / Log in with GitHub
3. Click **Add New** → **Project**
4. **Import Git Repository** → select `cornell-health-ai`
5. Click **Import**

### Step 2.2: Configure Build Settings

Vercel will auto-detect Next.js. Verify settings:

- **Framework Preset**: Next.js ✓
- **Build Command**: `npm run build` ✓
- **Output Directory**: `.next` ✓
- **Install Command**: `npm install` ✓

Click **Deploy**.

### Step 2.3: Set Environment Variables

After initial deployment:

1. Go to Vercel Dashboard → **Settings** → **Environment Variables**
2. Add variable:
   ```
   ML_SERVICE_URL = https://teladoc-ml-service-prod.railway.app
   ```
   (Replace with your actual Railway URL from Step 1.3)
3. **Important**: Select **Production** environment scope
4. Save and trigger a redeploy (or commit a change to trigger automatically)

### Step 2.4: Configure Domain (Optional)

In Vercel Dashboard → **Settings** → **Domains**:
- Add your domain (e.g., `teladoc.yourdomain.com`)
- Follow DNS instructions

---

## Part 3: End-to-End Testing

### Step 3.1: Frontend Deployment Test

1. Open the Vercel deployment URL (e.g., `https://teladoc-express.vercel.app`)
2. Navigate to `/medical-history`
3. Verify the form loads correctly
4. Check browser console for any errors (F12 → Console tab)

### Step 3.2: Health Check

1. Open browser console
2. Fetch the ML service:
   ```javascript
   fetch('YOUR_VERCEL_URL/api/model/healthz').then(r => r.json()).then(console.log)
   ```
   Should return model info with thresholds.

### Step 3.3: Full Inference Test

1. Go to `/voice-recording`
2. Grant microphone permission
3. Record or upload test audio files:
   - Rainbow Passage: 30-45 seconds
   - Free Speech: 30-45 seconds
4. Submit the form
5. Expected result: Risk assessment with voice indicators

**If inference times out**:
- Check Railway logs for errors
- Verify ML_SERVICE_URL is correct in Vercel
- Restart Railway deployment

### Step 3.4: Monitor Logs

**Vercel Logs**:
- Dashboard → Deployments → [Active] → Logs tab
- Look for errors in `/api/model/analyze` requests

**Railway Logs**:
- Dashboard → Deployments → [Active] → View Logs
- Check ML model loading and inference output

---

## Environment Variables Reference

### Vercel (.env.production)
```bash
ML_SERVICE_URL=https://teladoc-ml-service-prod.railway.app
ML_SERVICE_TIMEOUT_MS=120000  # Optional, default 60000
```

### Railway (Variables)
```bash
TABPFN_DISABLE_TELEMETRY=1
ML_TABPFN_CANDIDATES=6.4.1,6.3.2,2.2.1
ML_MODEL_PATH=../deliverables/psych_screener_v3.joblib  # Optional
PORT=8000  # Railway sets this automatically
```

---

## Troubleshooting

### Issue: "ML service returned 503"
**Cause**: Model still loading on cold start
**Solution**:
- Wait 30-60 seconds (first railway deployment loads model)
- Check Railway logs for import errors
- Verify model file exists: `deliverables/psych_screener_v3.joblib`

### Issue: "ML service timeout"
**Cause**: Audio inference takes >60 seconds
**Solution**:
- Increase `ML_SERVICE_TIMEOUT_MS` in Vercel to 120000
- Verify Railway is not hitting free tier memory limits
- Check pyin audio feature extraction logs

### Issue: "Cannot find module 'tabpfn'"
**Cause**: Incompatible TabPFN version
**Solution**:
- Check Railway logs for resolve_runtime.py output
- Try setting: `ML_TABPFN_CANDIDATES=6.4.1,6.3.2,2.2.1`
- Redeploy Railway

### Issue: "ModuleNotFoundError" on Railway
**Cause**: Missing dependencies
**Solution**:
- Check `ml-service/requirements.txt` is in repo
- Verify `.gitignore` is NOT excluding `deliverables/`
- Force redeploy: Railway → Redeploy

### Issue: CORS errors in browser
**Cause**: Cross-origin request from Vercel to Railway
**Solution**:
- This should be transparent (same-origin from browser perspective)
- If still failing, check Railway allows external requests (it does by default)
- Verify ML_SERVICE_URL is HTTPS

---

## Monitoring & Maintenance

### Daily Checks
- Vercel Analytics: Dashboard → Analytics
- Railway metrics: Dashboard → [Project] → Metrics
- Check error logs weekly

### Cost Monitoring
- **Vercel Free**: 100 GB bandwidth/month, unlimited deployments
- **Railway Free**: $5/month credits (enough for low-traffic apps)
- Set up billing alerts in both platforms

### Scaling (if needed)
- **Vercel**: Auto-scales within free tier limits
- **Railway**: Free tier supports ~1-2 concurrent ML inferences
  - Upgrade to paid plan for higher concurrency

---

## Deployment Checklist

- [ ] GitHub repository is public and contains all files
- [ ] `vercel.json` exists in repo root
- [ ] `Procfile` exists in repo root
- [ ] `deliverables/psych_screener_v3.joblib` is tracked in git (not gitignored)
- [ ] `ml-service/requirements.txt` includes all dependencies
- [ ] Railway service is deployed and has public URL
- [ ] Vercel service is deployed with ML_SERVICE_URL env var set
- [ ] `/healthz` endpoint responds 200 on Railway
- [ ] Frontend loads without console errors
- [ ] Test form submission with sample audio files

---

## Rollback Plan

### If Vercel deployment breaks
1. Vercel Dashboard → Deployments
2. Click previous green deployment
3. Click "Promote to Production"
4. Reverted in <1 minute

### If Railway service breaks
1. Railway Dashboard → Deployments
2. Select previous successful deployment
3. Click "Redeploy"
4. Wait for rebuild (~5 minutes)

---

## Next Steps

1. **DNS & Domain Setup**: Point your domain to Vercel
2. **SSL/TLS**: Both platforms handle this automatically
3. **Monitoring**: Set up alerts in Vercel and Railway dashboards
4. **Analytics**: Monitor user interactions via Vercel Analytics
5. **Performance**: Track ML inference latency in Railway logs

---

## Support & Debugging

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Next.js Docs**: https://nextjs.org/docs

For issues with the ML model specifically, check `ml-service/README.md`.

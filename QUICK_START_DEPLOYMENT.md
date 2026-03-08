# Quick Start: Deploy Teladoc Express (Vercel + Railway)

All configuration files have been created. Follow these steps to deploy.

## Summary of What's Ready

✅ **Configuration Files Created:**
- `vercel.json` - Next.js frontend deployment config
- `Procfile` - Python ML service startup config
- `DEPLOYMENT_GUIDE.md` - Detailed deployment guide
- GitHub repository pushed with all configs

✅ **No Code Changes Required** - Same codebase, just with deployment configs

---

## 🚀 Quick Deployment (5 minutes)

### Step 1: Deploy ML Service to Railway (2 minutes)

```bash
# 1. Go to https://railway.app
# 2. Sign in with GitHub
# 3. Click "New Project" → "Deploy from GitHub repo"
# 4. Select: kolananish/cornell_health_ai
# 5. Click "Deploy"
# 6. Wait 5-10 minutes for build + model loading
```

**After Railway deployment:**
- Copy your public URL from Railway Dashboard
- Example: `https://teladoc-ml-service-prod.railway.app`

### Step 2: Deploy Frontend to Vercel (2 minutes)

```bash
# Option A: Via Vercel CLI (recommended for initial setup)
cd "/Users/anishkolan/Documents/Cornell/Hackathons/AI Cornell Health/cornell_health_ai"
vercel login  # Authenticate with GitHub
vercel deploy --prod --name teladoc-express

# Option B: Via Vercel Web Dashboard
# 1. Go to https://vercel.com
# 2. Sign in with GitHub
# 3. Click "Add New" → "Project"
# 4. Import repo: kolananish/cornell_health_ai
# 5. Click "Deploy"
```

### Step 3: Connect the Services (1 minute)

```bash
# After Vercel deployment completes:
# 1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
# 2. Add new variable:
#    Name: ML_SERVICE_URL
#    Value: https://teladoc-ml-service-prod.railway.app (from Step 1)
#    Scope: Production
# 3. Click "Save"
# 4. Redeploy (commit a change or manually trigger redeploy)
```

---

## 📋 Deployment Checklist

- [ ] Railway project created and deployed
- [ ] Railway shows "Active" deployment (green)
- [ ] Railway public URL retrieved
- [ ] Vercel project created
- [ ] Vercel build successful (shows "Ready")
- [ ] ML_SERVICE_URL env var set in Vercel
- [ ] Vercel redeployed after env var change

---

## ✅ Verify Deployment Works

### Test 1: Frontend Loads
```bash
# Open in browser:
https://teladoc-express.vercel.app
# Should see medical history form
```

### Test 2: ML Service Is Running
```bash
# In browser console:
fetch('https://teladoc-express.vercel.app/api/model/healthz')
  .then(r => r.json())
  .then(console.log)

# Should return:
# {status: "ready", model_name: "...", thresholds: {...}}
```

### Test 3: End-to-End
1. Go to `/voice-recording`
2. Record test audio (30-45 sec each)
3. Submit form
4. Should return risk assessment

---

## 🔗 Direct Links

| Service | Link |
|---------|------|
| **GitHub Repo** | https://github.com/kolananish/cornell_health_ai |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Railway Dashboard** | https://railway.app/dashboard |
| **Frontend** | https://teladoc-express.vercel.app (after deploy) |

---

## 📊 Architecture

```
Browser → Vercel (Next.js) → Railway (FastAPI ML)
                ↓
         https://teladoc-express.vercel.app
                ↓
         ML_SERVICE_URL → Railway ML Service
```

---

## 🛠 Environment Variables

### Vercel (`Settings → Environment Variables`)
```
ML_SERVICE_URL = https://teladoc-ml-service-prod.railway.app
ML_SERVICE_TIMEOUT_MS = 120000  (optional)
```

### Railway (Dashboard → Variables)
```
TABPFN_DISABLE_TELEMETRY = 1
ML_TABPFN_CANDIDATES = 6.4.1,6.3.2,2.2.1
```

---

## 🆘 Troubleshooting

**Q: "ML service returned 503"**
- A: Railway is still loading. Wait 1-2 minutes. Check Railway logs.

**Q: "Cannot connect to ML service"**
- A: Verify ML_SERVICE_URL in Vercel is correct. Must be HTTPS.

**Q: "Inference timeout"**
- A: Increase ML_SERVICE_TIMEOUT_MS to 120000 in Vercel

**Q: Railway build fails with "tabpfn" error**
- A: Check logs. Set ML_TABPFN_CANDIDATES=6.4.1,6.3.2,2.2.1 in Railway

---

## 📚 Full Documentation

See `DEPLOYMENT_GUIDE.md` for:
- Detailed step-by-step instructions
- Architecture explanation
- Troubleshooting guide
- Monitoring & maintenance
- Scaling information
- Cost breakdown

---

## ✨ What's Deployed

### Frontend (Vercel)
- Next.js React app
- Medical history intake form
- Voice recording interface
- Results display

### Backend (Railway)
- Python FastAPI service
- PHQ-9 psychological screener
- Audio feature extraction (librosa)
- TabPFN machine learning model
- Model: `deliverables/psych_screener_v3.joblib` (50MB)

---

## 🎉 Done!

Once deployed, your application is live at:
```
https://teladoc-express.vercel.app
```

No code changes needed. Same functionality as local development.

---

## 📝 Notes

- Vercel auto-scales (free tier: 100GB bandwidth/month)
- Railway free tier: $5/month credits (sufficient for testing)
- Both services have auto-SSL/TLS certificates
- Logs available in both dashboards for debugging
- Easy rollback: revert to previous deployment with one click

For questions, check the detailed `DEPLOYMENT_GUIDE.md`.

# 🚀 Deploy Teladoc Express (Web Dashboard - Fastest Path)

**Total Time: ~15 minutes**

Everything is ready. Just follow these steps in your browser - no CLI commands needed.

---

## PART 1: Deploy ML Service to Railway (5-10 min)

### Step 1.1: Go to Railway
1. Open browser: **https://railway.app**
2. Click **"Login"** (top right)
3. Click **"Continue with GitHub"**
4. Authorize Railway to access your GitHub

### Step 1.2: Create Railway Project
1. Click **"New Project"** button (or dashboard link)
2. Click **"Deploy from GitHub repo"**
3. Find and select: **kolananish/cornell_health_ai**
4. Click **"Deploy"**

### Step 1.3: Wait for Build
Railway dashboard will show:
- Building... (might take 5-10 minutes, especially first time)
- This includes:
  - Installing Python dependencies
  - Loading the 50MB ML model
  - Verifying everything works

Once it says **"Active"** (green), your ML service is running.

### Step 1.4: Get the URL
1. In Railway Dashboard, click your project
2. Look for **"Deployments"** section
3. Find the active deployment
4. Copy the **public URL** (looks like: `https://teladoc-ml-service-prod.railway.app`)
5. **Save this URL - you'll need it next**

---

## PART 2: Deploy Frontend to Vercel (2-3 min)

### Step 2.1: Go to Vercel
1. Open browser: **https://vercel.com**
2. Click **"Sign in"** (top right)
3. Click **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub

### Step 2.2: Create Vercel Project
1. Click **"Add New"** (left sidebar or top menu)
2. Click **"Project"**
3. Under "Import Git Repository"
4. Find and select: **kolananish/cornell_health_ai**
5. Click **"Import"**

### Step 2.3: Configure (Should be auto-filled)
Vercel should auto-detect:
- **Framework Preset**: Next.js ✓
- **Build Command**: `npm run build` ✓
- **Output Directory**: `.next` ✓

Just click **"Deploy"**

### Step 2.4: Wait for Build
Vercel dashboard will show:
- Building... (takes 2-3 minutes)
- Once it says **"Ready"** (green), your frontend is live

### Step 2.5: Get the URL
Your deployment URL appears in the Vercel dashboard.
Example: `https://teladoc-express.vercel.app`

---

## PART 3: Connect the Services (1 min)

### Step 3.1: Set Environment Variable
1. In Vercel Dashboard, click your project
2. Go to **"Settings"** (tab at top)
3. Go to **"Environment Variables"** (left sidebar)
4. Click **"Add New Variable"**

### Step 3.2: Fill In Values
- **Name**: `ML_SERVICE_URL`
- **Value**: (paste the Railway URL from Part 1, Step 1.4)
- **Scope**: Select **"Production"** (important!)
- Click **"Save"**

### Step 3.3: Redeploy
- Vercel should auto-trigger a redeploy
- Or manually: Dashboard → **"Redeploy"** button → confirm

Wait for redeploy to complete (says "Ready" - green).

---

## ✅ VERIFICATION (Test It Works)

### Test 1: Frontend Loads
1. Click your Vercel project URL
2. Example: `https://teladoc-express.vercel.app`
3. Should see: **Medical History Intake Form**
4. No error messages

### Test 2: ML Service Connected
1. Open your Vercel URL in browser
2. Press **F12** (open Developer Tools)
3. Click **"Console"** tab
4. Paste this:
```javascript
fetch('/api/model/healthz').then(r => r.json()).then(console.log)
```
5. Press **Enter**
6. Should see:
```
{
  status: "ready",
  model_name: "...",
  model_hash: "...",
  thresholds: { ... }
}
```

If you see this, **everything is working!** ✅

### Test 3: Full Test (Optional)
1. Go to `/voice-recording` page
2. Grant microphone permission (browser will ask)
3. Record two audio clips (30-45 seconds each):
   - Rainbow Passage (standardized text)
   - Free Speech (any topic)
4. Click **"Analyze"**
5. Wait 30-60 seconds
6. Should see **Risk Assessment** with results

---

## 🎉 You're Done!

Your application is now live at:
```
https://teladoc-express.vercel.app
```

Both services are running:
- ✅ Frontend on Vercel
- ✅ ML Backend on Railway
- ✅ Connected and working together

---

## 📊 Check Logs (If Something Goes Wrong)

### Vercel Logs
1. Vercel Dashboard → Your Project
2. Click **"Deployments"** tab
3. Click active deployment
4. Scroll to see **Logs** section
5. Look for errors

### Railway Logs
1. Railway Dashboard → Your Project
2. Click **"Deployments"** tab
3. Click active deployment
4. Click **"View Logs"** button
5. Look for errors

---

## 🆘 Common Issues

**Issue**: "ML service returned 503"
- **Cause**: Railway still loading model
- **Solution**: Wait 2-3 minutes, refresh page

**Issue**: "Cannot connect to ML service"
- **Cause**: ML_SERVICE_URL env var wrong or not set
- **Solution**: Check it's set in Vercel Settings → double-check it's exact URL from Railway

**Issue**: "Inference times out"
- **Cause**: ML inference taking too long
- **Solution**: Increase ML_SERVICE_TIMEOUT_MS to 120000 in Vercel env vars

**Issue**: Form won't submit
- **Cause**: ML service down or unreachable
- **Solution**: Check Railway deployment is "Active" (green)

---

## ⏱️ Timeline

| Step | Time | Status |
|------|------|--------|
| Deploy Railway | 5-10 min | Do first |
| Deploy Vercel | 2-3 min | Do second |
| Set env var | 1 min | Do third |
| **Total** | **~15 min** | **Ready!** |

---

## 🎯 What Happens Behind the Scenes

1. **Railway Container** runs:
   - Python 3.12 environment
   - FastAPI server on port 8000
   - Loads ML model (50MB joblib)
   - Serves `/healthz` and `/v1/analyze/phq` endpoints

2. **Vercel Serverless** runs:
   - Next.js frontend
   - API route proxy at `/api/model/analyze`
   - Routes requests to Railway ML service

3. **Connection Flow**:
   - User opens browser → Vercel frontend
   - Submits form → Vercel API proxy
   - Proxy forwards to Railway ML service
   - Railway analyzes audio, returns results
   - Vercel displays results to user

---

## 📞 Need Help?

See these files:
- `DEPLOYMENT_GUIDE.md` - Full technical guide
- `DEPLOYMENT_REFERENCE.txt` - Quick reference card
- `QUICK_START_DEPLOYMENT.md` - Alternative walkthrough

---

## ✨ Next Steps

After deployment:
1. Test with different audio samples
2. Monitor logs in both dashboards
3. (Optional) Set up custom domain in Vercel
4. (Optional) Configure Railway alerts
5. Share the URL with others to test

**Your app is production-ready!** 🚀

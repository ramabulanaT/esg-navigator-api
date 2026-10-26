# Railway API Deployment - Final Fix

## Current Problem
Railway build succeeds but deploys the WRONG application:
- ✅ Build completes successfully
- ❌ Builds web app: `npm run build -w @esgnavigator/web`
- ❌ Starts web app: `npm run start` (which runs the web frontend)
- ❌ API never starts

## Root Cause
Railway detects the monorepo workspace structure and uses the root `package.json` scripts, which default to the web app.

## THE SOLUTION - Set Custom Commands in Railway Dashboard

### Step 1: Go to Railway Dashboard
https://railway.app/project/tis-intellimat-esgnavigator-pub

### Step 2: Select Service
Click on service: **esgnavigator**

### Step 3: Configure Settings
Click **Settings** tab and set these EXACT values:

#### Root Directory
```
apps/api
```
(This tells Railway where the API code is)

#### Build Command
```
npm ci && npm run build
```
(This builds ONLY the API, not the web app)

#### Start Command  
```
node dist/index.js
```
(This starts the API server directly)

#### Watch Paths (Optional but recommended)
```
apps/api/**
```

### Step 4: Save and Redeploy
1. Click **Save** on settings
2. Go to **Deployments** tab
3. Click **Redeploy** on latest deployment

## Expected Build Output (After Fix)

You should see:
```
✓ Root Directory: apps/api
✓ Build: npm ci && npm run build
✓ Compiling TypeScript...
✓ Build complete: dist/index.js
✓ Start: node dist/index.js
✓ Backend running on http://localhost:8080
✓ Claude AI: Configured
✓ 9 AI Agents: Active
```

## Verification

### 1. Check Deployment Logs
Should show:
```
🚀 Backend running on http://localhost:8080
🤖 Claude AI: Configured
🔧 9 AI Agents: Active
🔐 Authentication: Enabled
📊 TIS-IntelliMat Suppliers: 5
💰 Portfolio Value: R331M
```

### 2. Test Health Endpoint
```bash
curl https://intellimat-repository-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-21T18:00:00.000Z",
  "claude": "configured",
  "agents": 9,
  "auth": "enabled",
  "suppliers": 5
}
```

### 3. Test from Browser
Visit: https://intellimat-repository-production.up.railway.app/health

Should see the JSON response above.

## Why This Works

1. **Root Directory = `apps/api`**: Railway navigates to the API folder
2. **Build Command**: Runs `npm ci && npm run build` in the API folder (not workspace root)
3. **Start Command**: Directly executes the compiled API server
4. **No workspace detection**: Railway treats `apps/api` as a standalone Node.js app

## Alternative: GitHub Integration

If CLI deployment continues to have issues, connect via GitHub:

1. Push code to GitHub repository
2. In Railway dashboard, click **New** → **Deploy from GitHub**
3. Select repository and branch
4. Set Root Directory: `apps/api`
5. Set Build/Start commands as above
6. Railway will auto-deploy on git push

## Environment Variables Checklist

Ensure these are set in Railway Variables tab:
- ✅ `PORT` = 8080
- ✅ `NODE_ENV` = production
- ✅ `ANTHROPIC_API_KEY` = (your Claude API key)
- ✅ `JWT_SECRET` = (32-character secret)
- ✅ `FRONTEND_URL` = (your frontend URL)

## Success Criteria

- ✅ Build logs show TypeScript compilation
- ✅ Start logs show Express server starting
- ✅ Health endpoint returns 200 OK
- ✅ No "next start" or web app references in logs
- ✅ API accessible at production URL

## If Still Not Working

Contact Railway support with:
- Project ID: tis-intellimat-esgnavigator-pub
- Service: esgnavigator
- Issue: Monorepo workspace detection causing wrong app to deploy
- Request: Deploy only `apps/api` subdirectory as standalone Node.js app
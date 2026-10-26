# URGENT: Railway Root Directory Fix

## The Problem
Railway is failing with error: `directory /var/lib/builderv3/.../apps/api does not exist`

This happens because:
1. We're deploying FROM the `apps/api` directory using `railway up`
2. Railway receives the api files as the root of the upload
3. Railway then tries to navigate to `apps/api` (which doesn't exist in the uploaded files)

## The Solution

### Option 1: Clear Root Directory in Dashboard (RECOMMENDED)
1. Go to https://railway.app/project/tis-intellimat-esgnavigator-pub
2. Select service: **esgnavigator**
3. Click **Settings** tab
4. Find **Root Directory** setting
5. **CLEAR IT** (leave it empty) or set it to `.`
6. Click **Save**
7. Go to **Deployments** tab
8. Click **Redeploy** on the latest deployment

### Option 2: Deploy from Parent Directory
Instead of deploying from `apps/api`, deploy from the workspace root:

```bash
cd IntelliMat-repository/apps/esg-navigator
railway up --service esgnavigator
```

Then in Railway dashboard:
- Set Root Directory to: `apps/api`

## Verification

After fixing, the build should succeed. Check logs for:
```
✓ Backend running on http://localhost:8080
✓ Claude AI: Configured
✓ 9 AI Agents: Active
```

## Current Status
- ❌ Root Directory is set to `apps/api` (WRONG when deploying from api directory)
- ✅ Configuration files are correct
- ✅ Environment variables are set
- ⚠️ Need to clear Root Directory setting

## Quick Test
Once deployed, test:
```bash
curl https://intellimat-repository-production.up.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "claude": "configured",
  "agents": 9
}
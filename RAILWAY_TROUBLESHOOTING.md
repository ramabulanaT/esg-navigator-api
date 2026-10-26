# Railway API Deployment Troubleshooting Guide

## Issue: API Showing Offline

### Root Cause Analysis
The Railway service was deploying from the wrong directory and executing the wrong start command, causing it to start the Next.js web app instead of the Express API.

### Solution Implemented

#### 1. Created Configuration Files

**nixpacks.toml** - Specifies build configuration:
```toml
[phases.setup]
nixPkgs = ["nodejs-20_x"]

[phases.install]
cmds = ["npm ci --only=production"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "node dist/index.js"

[variables]
NODE_ENV = "production"
```

**Procfile** - Defines the start command:
```
web: node dist/index.js
```

**railway.json** - Railway-specific configuration:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci && npm run build"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 2. Critical Railway Settings

In the Railway dashboard, ensure these settings are configured:

**Service Settings:**
- Root Directory: `apps/api` (or deploy from the api directory)
- Build Command: `npm ci && npm run build`
- Start Command: `node dist/index.js`
- Health Check Path: `/health`

**Environment Variables:**
```
PORT=8080
NODE_ENV=production
ANTHROPIC_API_KEY=<your-key>
JWT_SECRET=<your-secret>
FRONTEND_URL=<your-frontend-url>
```

### Verification Steps

1. **Check Deployment Logs:**
```bash
railway logs --service esgnavigator
```

Look for:
- ✅ "Backend running on http://localhost:8080"
- ✅ "Claude AI: Configured"
- ✅ "9 AI Agents: Active"
- ❌ NOT "next start" or "@esgnavigator/web"

2. **Test Health Endpoint:**
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

3. **Check Service Status:**
```bash
railway status --service esgnavigator
```

### Common Issues and Solutions

#### Issue: Wrong App Starting (Next.js instead of Express)
**Symptom:** Logs show "next start" or "@esgnavigator/web"
**Solution:** 
- Ensure Root Directory is set to `apps/api` in Railway dashboard
- Verify Procfile exists with correct command
- Check nixpacks.toml start command

#### Issue: Build Failures
**Symptom:** Deployment fails during build phase
**Solution:**
- Check TypeScript compilation: `npm run build`
- Verify all dependencies in package.json
- Check for TypeScript errors in src/

#### Issue: Runtime Errors
**Symptom:** App starts but crashes immediately
**Solution:**
- Check environment variables are set
- Verify ANTHROPIC_API_KEY is valid
- Ensure JWT_SECRET is configured
- Check logs for specific error messages

#### Issue: Health Check Failing
**Symptom:** Service marked as unhealthy
**Solution:**
- Verify `/health` endpoint is accessible
- Check PORT environment variable is used correctly
- Ensure app listens on 0.0.0.0, not localhost

### Railway Dashboard Checklist

Go to: https://railway.app/project/tis-intellimat-esgnavigator-pub

1. ✅ Service: esgnavigator selected
2. ✅ Settings > Root Directory: `apps/api`
3. ✅ Settings > Start Command: `node dist/index.js`
4. ✅ Variables tab: All required env vars set
5. ✅ Deployments tab: Latest deployment successful
6. ✅ Metrics tab: Service running and healthy

### Manual Redeploy Steps

If automatic deployment doesn't work:

```bash
# From apps/api directory
cd IntelliMat-repository/apps/esg-navigator/apps/api

# Link to Railway service
railway link --service esgnavigator

# Deploy
railway up --service esgnavigator

# Monitor logs
railway logs --service esgnavigator

# Check status
railway status --service esgnavigator
```

### Alternative: Deploy via Railway Dashboard

1. Go to Railway dashboard
2. Select project: tis-intellimat-esgnavigator-pub
3. Select service: esgnavigator
4. Click "Settings"
5. Set Root Directory: `apps/api`
6. Set Start Command: `node dist/index.js`
7. Go to "Deployments" tab
8. Click "Redeploy" on latest deployment

### Support Resources

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Dashboard: https://railway.app/project/tis-intellimat-esgnavigator-pub

### Success Indicators

When deployment is successful, you should see:

1. ✅ Green status indicator in Railway dashboard
2. ✅ Health endpoint returns 200 OK
3. ✅ Logs show Express server starting
4. ✅ No error messages in logs
5. ✅ API accessible at production URL
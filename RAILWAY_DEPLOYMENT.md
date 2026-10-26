# Railway Deployment Guide for IntelliMat ESG Navigator API

## Required Environment Variables

Set these in your Railway dashboard under the service settings:

### Essential Variables
```
PORT=8080
NODE_ENV=production
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
JWT_SECRET=your-secure-32-character-secret-key
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Optional Variables
```
CORS_ORIGIN=https://your-frontend-domain.vercel.app
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://app.esgnavigator.ai
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
ANTHROPIC_MAX_TOKENS=512
LOG_LEVEL=info
API_VERSION=v1
```

## Deployment Steps

### 1. Link Service to Railway Project
```bash
cd IntelliMat-repository/apps/esg-navigator/apps/api
railway link
# Select: tis-intellimat-esgnavigator-pub
# Select service: esgnavigator
```

### 2. Set Environment Variables
```bash
# Set via CLI
railway variables set ANTHROPIC_API_KEY="sk-ant-api03-your-key"
railway variables set JWT_SECRET="your-32-char-secret"
railway variables set FRONTEND_URL="https://your-frontend.vercel.app"
railway variables set PORT="8080"
railway variables set NODE_ENV="production"
```

Or set them in the Railway dashboard:
1. Go to https://railway.app/dashboard
2. Select project: tis-intellimat-esgnavigator-pub
3. Select service: esgnavigator
4. Go to Variables tab
5. Add each variable

### 3. Deploy
```bash
# Deploy from current directory
railway up

# Or trigger redeploy in dashboard
railway redeploy
```

### 4. Check Deployment Status
```bash
# View logs
railway logs

# Check service status
railway status
```

### 5. Verify Health
```bash
# Test health endpoint
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

## Troubleshooting

### API Shows Offline
1. Check Railway dashboard for deployment errors
2. View logs: `railway logs`
3. Verify environment variables are set
4. Check build completed successfully
5. Verify start command is correct: `node dist/index.js`

### Build Failures
- Ensure `package.json` has correct scripts
- Check TypeScript compilation: `npm run build`
- Verify all dependencies are in `package.json`

### Runtime Errors
- Check logs for missing environment variables
- Verify ANTHROPIC_API_KEY is valid
- Ensure JWT_SECRET is set
- Check FRONTEND_URL matches your frontend domain

## Configuration Files

### railway.json
Defines build and deployment configuration for Railway.

### nixpacks.toml
Specifies Node.js version and build commands for Nixpacks builder.

### package.json
Contains build and start scripts:
- `build`: Compiles TypeScript to JavaScript
- `start`: Runs the compiled application

## Health Check

Railway will automatically check `/health` endpoint every 30 seconds.
If it fails 3 times, the service will be marked as unhealthy.

## Port Configuration

Railway automatically assigns a PORT environment variable.
The application listens on `process.env.PORT || 5050`.
Ensure your code uses `process.env.PORT` for Railway compatibility.

## Support

- Railway Docs: https://docs.railway.app
- Project Dashboard: https://railway.app/project/tis-intellimat-esgnavigator-pub
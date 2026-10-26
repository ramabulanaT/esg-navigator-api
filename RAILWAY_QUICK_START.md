# Railway API Quick Start - Get Your API Online

## Current Status
🔴 **API is OFFLINE** at `https://intellimat-repository-production.up.railway.app`

## Quick Fix Steps

### Step 1: Check Railway Dashboard
1. Go to https://railway.app/dashboard
2. Find project: **tis-intellimat-esgnavigator-pub**
3. Select service: **esgnavigator** (API)
4. Check the **Deployments** tab for errors

### Step 2: Verify Environment Variables
In Railway dashboard → Variables tab, ensure these are set:

**Required:**
```
PORT=8080
NODE_ENV=production
JWT_SECRET=your-secure-secret-key-here
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

**Recommended:**
```
FRONTEND_URL=https://your-frontend-domain.vercel.app
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### Step 3: Deploy the API

**Option A: Via Railway Dashboard**
1. Go to your service in Railway dashboard
2. Click **Deploy** → **Redeploy**
3. Wait for build to complete (~2-3 minutes)

**Option B: Via CLI**
```bash
cd IntelliMat-repository/apps/esg-navigator/apps/api
railway link  # Select your project and service
railway up    # Deploy
```

### Step 4: Verify Deployment
Once deployed, test the health endpoint:
```bash
curl https://intellimat-repository-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-21T19:58:00.000Z",
  "claude": "configured",
  "agents": 9,
  "auth": "enabled",
  "suppliers": 5
}
```

## Common Issues & Solutions

### Issue: Build Fails
**Solution:**
- Check Railway logs for specific error
- Verify `package.json` has correct dependencies
- Ensure TypeScript compiles locally: `npm run build`

### Issue: Service Crashes on Start
**Solution:**
- Check environment variables are set correctly
- Verify `ANTHROPIC_API_KEY` is valid
- Ensure `JWT_SECRET` is set
- Check logs: `railway logs`

### Issue: Port Binding Error
**Solution:**
- Railway automatically sets PORT variable
- Ensure your code uses: `process.env.PORT || 5050`
- Don't hardcode port numbers

### Issue: CORS Errors
**Solution:**
- Set `FRONTEND_URL` to your actual frontend domain
- Set `CORS_ORIGIN` to match frontend
- Restart service after changing variables

## What's Deployed

Your API includes:
- ✅ 9 AI Agents (ESG analysis, emissions, energy, etc.)
- ✅ JWT Authentication with bcrypt password hashing
- ✅ Claude AI integration (Anthropic)
- ✅ TIS-IntelliMat portfolio data (R331M, 5 suppliers)
- ✅ Health check endpoint
- ✅ CORS middleware
- ✅ Comprehensive error handling

## API Endpoints

Once online, your API will have:

**Health Check:**
- `GET /health` - Service health status

**Authentication:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

**AI Agents:**
- `POST /api/agents/analyze` - Run AI analysis
- `GET /api/agents` - List available agents

**Suppliers:**
- `GET /api/suppliers` - Get supplier data
- `GET /api/suppliers/:id` - Get specific supplier

**Claude AI:**
- `POST /api/claude/chat` - Chat with Claude
- `POST /api/claude/analyze` - Analyze with Claude

## Next Steps After Deployment

1. **Test Authentication:**
   ```bash
   curl -X POST https://your-api-url/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@tisholdings.co.za","password":"admin123"}'
   ```

2. **Test AI Agent:**
   ```bash
   curl -X POST https://your-api-url/api/agents/analyze \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"query":"Analyze ESG performance"}'
   ```

3. **Update Frontend:**
   - Update `NEXT_PUBLIC_API_URL` in your web app
   - Point to: `https://intellimat-repository-production.up.railway.app`

## Monitoring

**View Logs:**
```bash
railway logs --follow
```

**Check Metrics:**
- Go to Railway dashboard → Metrics tab
- Monitor CPU, Memory, Network usage

**Set Up Alerts:**
- Railway dashboard → Settings → Notifications
- Enable deployment and error notifications

## Support

If issues persist:
1. Check Railway status: https://status.railway.app
2. Review logs: `railway logs`
3. Verify all environment variables are set
4. Ensure Anthropic API credits are available
5. Check build completed successfully in dashboard

## Security Checklist

Before going live:
- ✅ Change default admin passwords
- ✅ Use strong JWT_SECRET (32+ characters)
- ✅ Set CORS_ORIGIN to your actual domain
- ✅ Enable HTTPS only (Railway does this automatically)
- ✅ Monitor API usage and set rate limits
- ✅ Keep Anthropic API key secure
- ✅ Review and rotate secrets regularly

---

**Need Help?** Check the full deployment guide: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ghgEmissionsRouter from './routes/ghg-emissions.routes';
import esgAssessorRouter from './routes/esg-assessor.routes';
import authRouter from './routes/auth.routes';

dotenv.config();

const START_TIME = new Date().toISOString();
const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors({
  origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')
    .concat(['https://app.esgnavigator.ai', 'https://esgnavigator-production.up.railway.app']),
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));

// ── Health checks ─────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'healthy', timestamp: new Date().toISOString(),
  claude: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
  agents: 9, auth: 'enabled', suppliers: 5,
  build: 'ghg-v3', started: START_TIME, commit: process.env.RAILWAY_GIT_COMMIT_SHA,
}));
app.get('/healthz', (_req, res) => res.json({
  status: 'operational', timestamp: new Date().toISOString(),
  claude: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
  agents: 9, auth: 'enabled', suppliers: 5,
  build: 'ghg-v3', started: START_TIME, commit: process.env.RAILWAY_GIT_COMMIT_SHA,
}));

// ── Bearer auth (partner allowlist) ───────────────────────────
// BOB-BRIEF-021: partner tokens were previously hardcoded literals in this
// file. They are now read from the environment only, per the brief's rule that
// tokens stay in environment variables. Rotation no longer needs a redeploy.
// Required Railway vars: WXO_CLIENT_TOKEN, IBM_CLIENT_TOKEN.
function partnerTokens(): Record<string, string> {
  const map: Record<string, string> = {};
  if (process.env.WXO_CLIENT_TOKEN) map[process.env.WXO_CLIENT_TOKEN] = 'IBM-WXO';
  if (process.env.IBM_CLIENT_TOKEN) map[process.env.IBM_CLIENT_TOKEN] = 'IBM-Partner';
  return map;
}

if (Object.keys(partnerTokens()).length === 0) {
  console.error('[auth] No partner tokens configured — set WXO_CLIENT_TOKEN and/or IBM_CLIENT_TOKEN. All authenticated routes will return AUTH_001.');
}

function requireBearer(req: any, res: any, next: any) {
  const auth = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  const partner = partnerTokens()[auth];
  if (!auth || !partner) {
    return res.status(401).json({ success: false, error: 'Invalid or missing Bearer token', code: 'AUTH_001' });
  }
  req.partner = partner;
  next();
}

// ── Governed, database-backed routes (BOB-BRIEF-021) ──────────
// The Exxaro static corpus that previously served /v1/ghg-emissions has been
// REMOVED from the client path. A ticker with no rows in assess.* now returns
// 404 DATA_001 — never fixture data.
app.use('/v1/ghg-emissions', requireBearer, ghgEmissionsRouter);
app.use('/v1/esg-assessor',  requireBearer, esgAssessorRouter);

// ── Auth routes (register, login, /me, logout) ────────────────
app.use('/v1/auth', authRouter);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`IntelliMat API running on port ${PORT}`);
  console.log(`GHG Emissions route: POST /v1/ghg-emissions`);
  console.log(`ESG Assessor route:  POST /v1/esg-assessor`);
  console.log(`Health: GET /healthz`);
});

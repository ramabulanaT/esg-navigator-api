import { Router } from "express";
import { ENV } from "../config/env";
import { analyzeText } from "../services/anthropic.service";
const router = Router();
/** POST /api/v1/ai/analyze { query, context? } */
router.post("/analyze", async (req, res) => {
  try{
    if (!ENV.ANTHROPIC_API_KEY) return res.status(503).json({ ok:false, error: "AI unavailable" });
    const { query, context } = req.body ?? {};
    if (!query || typeof query !== "string" || !query.trim()) return res.status(400).json({ ok:false, error: 'Missing "query" (string)' });
    const answer = await analyzeText(query, context);
    res.status(200).json({ ok:true, model: ENV.ANTHROPIC_MODEL, tokens: ENV.ANTHROPIC_MAX_TOKENS, data:{ answer } });
  } catch(e:any){ console.error("[AI] analyze error:", e?.message); res.status(500).json({ ok:false, error:"AI analyze failed" }); }
});
export default router;

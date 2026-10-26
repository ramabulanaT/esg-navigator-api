import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../config/env";
let client: Anthropic | null = null;
function getClient(){ if(!ENV.ANTHROPIC_API_KEY) throw new Error("Anthropic key not set"); return client ??= new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY }); }
export async function analyzeText(query: string, context?: string){
  const c = getClient();
  const content = (context ? `Context:\n${context}\n\n` : "") + `Task: ESG analysis, concise insights & next actions.\n\nQuery:\n${query}`;
  const r = await c.messages.create({ model: ENV.ANTHROPIC_MODEL, max_tokens: ENV.ANTHROPIC_MAX_TOKENS, messages: [{ role: "user", content }] });
  const txt = (r.content || []).map((b:any)=> b.type==="text"? b.text : "").join("").trim();
  return txt || "No content returned.";
}

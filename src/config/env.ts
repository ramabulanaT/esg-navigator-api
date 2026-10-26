export interface AppEnv {
  NODE_ENV: "production" | "development" | "test";
  PORT: number;
  FRONTEND_URL?: string;
  ALLOWED_ORIGINS: string[];
  CORS_ORIGIN?: string;
  JWT_SECRET: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL: string;
  ANTHROPIC_MAX_TOKENS: number;
  LOG_LEVEL: "silent" | "error" | "warn" | "info" | "debug";
  API_VERSION: string;
}
function csv(v?: string){ return (v ?? "").split(",").map(s=>s.trim()).filter(Boolean); }
function pickLog(v?: string): AppEnv["LOG_LEVEL"] {
  const allowed = ["silent","error","warn","info","debug"] as const;
  const k = (v ?? "info").toLowerCase() as AppEnv["LOG_LEVEL"];
  return (allowed as readonly string[]).includes(k) ? k : "info";
}
export const ENV: AppEnv = {
  NODE_ENV: (process.env.NODE_ENV as any) ?? "production",
  PORT: Number(process.env.PORT ?? 8080),
  FRONTEND_URL: process.env.FRONTEND_URL?.trim(),
  ALLOWED_ORIGINS: (() => {
    const set = new Set<string>();
    csv(process.env.ALLOWED_ORIGINS).forEach(o=>set.add(o));
    if (process.env.CORS_ORIGIN) set.add(process.env.CORS_ORIGIN.trim());
    if (process.env.FRONTEND_URL) set.add(process.env.FRONTEND_URL.trim());
    return [...set].filter(Boolean);
  })(),
  CORS_ORIGIN: process.env.CORS_ORIGIN?.trim(),
  JWT_SECRET: process.env.JWT_SECRET || "",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-sonnet-latest",
  ANTHROPIC_MAX_TOKENS: Number(process.env.ANTHROPIC_MAX_TOKENS ?? 512),
  LOG_LEVEL: pickLog(process.env.LOG_LEVEL),
  API_VERSION: process.env.API_VERSION?.trim() || "v1",
};
if (!ENV.JWT_SECRET) { throw new Error("ENV: JWT_SECRET missing. Set it in Railway."); }

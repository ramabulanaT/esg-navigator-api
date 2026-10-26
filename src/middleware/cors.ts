import cors, { CorsOptionsDelegate } from "cors";
import { ENV } from "../config/env";

/** Allow configured origins + all Vercel preview URLs */
const opts: CorsOptionsDelegate = (req, cb) => {
  const origin = req.headers?.origin ?? "";
  
  // Check if origin is in ALLOWED_ORIGINS (read fresh each time)
  const isAllowed = ENV.ALLOWED_ORIGINS.includes(origin);
  
  // Allow if matches Vercel preview pattern
  const isVercelPreview = origin.match(/https:\/\/(web|esgnavigator)-[a-z0-9]+-dr-terry-ramabulanas-projects\.vercel\.app$/);
  
  // Allow localhost in non-production
  const isLocalhost = origin.includes('localhost');
  
  const ok = isAllowed || !!isVercelPreview || (ENV.NODE_ENV !== "production" && isLocalhost);
  
  cb(null, {
    origin: ok,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  });
};

export default cors(opts);
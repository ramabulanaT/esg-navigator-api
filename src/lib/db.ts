/**
 * Postgres connection pool (Neon).
 *
 * BOB-BRIEF-021. Connection string comes from DATABASE_URL only — never
 * hardcoded, never logged.
 */

import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  // Do not throw at import time: the core health endpoints must keep serving
  // even when the database is unreachable. Routes surface DB_001 instead.
  console.error('[db] DATABASE_URL is not set — database-backed routes will return DB_001');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? undefined : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => console.error('[db] idle client error:', err.message));

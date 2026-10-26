import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { ENV } from '../config/env';

const JWT_EXPIRES_IN = '7d';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'analyst' | 'viewer' | 'super_admin';
  organization: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  role: string;
  organization: string;
  created_at: string;
}

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not configured');
  return neon(url);
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<{ token: string; user: User }> {
    const sql = getSql();
    const rows = await sql.query(
      `SELECT id, email, full_name, password_hash, role, organization, created_at
       FROM users WHERE LOWER(email) = $1 AND active = true`,
      [credentials.email.toLowerCase()]
    ) as UserRow[];

    if (rows.length === 0) throw new Error('Invalid credentials');

    const row = rows[0];
    const valid = await bcrypt.compare(credentials.password, row.password_hash);
    if (!valid) throw new Error('Invalid credentials');

    const user: User = {
      id: String(row.id),
      email: row.email,
      name: row.full_name,
      role: (row.role as User['role']) || 'viewer',
      organization: row.organization || 'TIS Holdings',
      createdAt: row.created_at || new Date().toISOString()
    };

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      ENV.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    return { token, user };
  }

  async register(userData: { email: string; password: string; name: string; organization: string }): Promise<{ token: string; user: User }> {
    const sql = getSql();
    const email = userData.email.toLowerCase();

    const existing = await sql.query(
      `SELECT id FROM users WHERE LOWER(email) = $1`,
      [email]
    ) as { id: string }[];
    if (existing.length > 0) throw new Error('User already exists');

    const password_hash = await bcrypt.hash(userData.password, 10);
    const rows = await sql.query(
      `INSERT INTO users (email, full_name, password_hash, role, organization, active)
       VALUES ($1, $2, $3, 'viewer', $4, true)
       RETURNING id, email, full_name, role, organization, created_at`,
      [email, userData.name, password_hash, userData.organization]
    ) as UserRow[];

    const row = rows[0];
    const user: User = {
      id: String(row.id),
      email: row.email,
      name: row.full_name,
      role: (row.role as User['role']) || 'viewer',
      organization: row.organization || userData.organization,
      createdAt: row.created_at || new Date().toISOString()
    };
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      ENV.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    return { token, user };
  }

  verifyToken(token: string): any {
    return jwt.verify(token, ENV.JWT_SECRET);
  }

  async getUserById(userId: string): Promise<User | null> {
    const sql = getSql();
    const rows = await sql.query(
      `SELECT id, email, full_name, role, organization, created_at
       FROM users WHERE id = $1`,
      [userId]
    ) as UserRow[];

    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: String(row.id),
      email: row.email,
      name: row.full_name,
      role: (row.role as User['role']) || 'viewer',
      organization: row.organization || 'TIS Holdings',
      createdAt: row.created_at || new Date().toISOString()
    };
  }
}

export const authService = new AuthService();

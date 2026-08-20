import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cvr-agencies-secret-key-2026-secure-pavan';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signJwt(payload: { id: string; name: string; isAdmin: boolean }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwt(token: string): { id: string; name: string; isAdmin: boolean } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; name: string; isAdmin: boolean };
  } catch (error) {
    return null;
  }
}

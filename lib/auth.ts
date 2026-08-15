import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_TO_A_RANDOM_32_PLUS_CHARACTER_SECRET';
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'hrms_session';

export interface UserSessionPayload {
  userId: string;
  email: string;
  fullName: string;
  isPlatformStaff: boolean;
  tenantId?: string;
  membershipId?: string;
  roleCodes?: string[];
  iat?: number;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signJwt(payload: Omit<UserSessionPayload, 'iat' | 'exp'>, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyJwt(token: string): UserSessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as UserSessionPayload;
  } catch (err) {
    return null;
  }
}

export function getSessionCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  };
}

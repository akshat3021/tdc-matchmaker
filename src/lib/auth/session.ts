import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getAuthSecret } from '@/lib/env';
import type { SessionUser } from '@/types';

export const SESSION_COOKIE = 'tdc_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // one working day

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ username: user.username, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getAuthSecret());
}

/** Returns the user if the token is valid and unexpired, otherwise null. */
export async function verifySessionToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), { algorithms: ['HS256'] });
    if (!payload.sub || typeof payload.username !== 'string' || typeof payload.name !== 'string') return null;
    return { id: payload.sub, username: payload.username, name: payload.name };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};

/** Current user for server components / route handlers. */
export async function getSessionUser(): Promise<SessionUser | null> {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}

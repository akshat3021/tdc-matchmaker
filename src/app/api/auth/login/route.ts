import bcrypt from 'bcryptjs';
import { ApiError, ok, readJson, route } from '@/lib/api';
import { checkLoginAttempt, clearLoginAttempts } from '@/lib/auth/rateLimit';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/auth/session';
import { findMatchmakerByUsername } from '@/lib/data/repository';
import { loginSchema } from '@/lib/validation';

// Compared against when the username is unknown so response time doesn't reveal valid usernames.
let decoyHash: string | undefined;

export const POST = route(
  async (req) => {
    const { username, password } = loginSchema.parse(await readJson(req));

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
    const limitKey = `${ip}:${username.toLowerCase()}`;
    const gate = checkLoginAttempt(limitKey);
    if (!gate.allowed) {
      throw new ApiError(429, 'TOO_MANY_ATTEMPTS', `Too many attempts. Try again in ${Math.ceil(gate.retryAfterSec / 60)} minutes.`);
    }

    const matchmaker = findMatchmakerByUsername(username);
    decoyHash ??= bcrypt.hashSync('decoy-password', 12);
    const valid = await bcrypt.compare(password, matchmaker?.passwordHash ?? decoyHash);
    if (!matchmaker || !valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Username or password is incorrect.');

    clearLoginAttempts(limitKey);
    const token = await createSessionToken({ id: matchmaker.id, username: matchmaker.username, name: matchmaker.name });
    const res = ok({ name: matchmaker.name });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  },
  { public: true },
);

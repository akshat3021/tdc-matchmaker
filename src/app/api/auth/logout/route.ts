import { ok, route } from '@/lib/api';
import { SESSION_COOKIE } from '@/lib/auth/session';

export const POST = route(async () => {
  const res = ok({ signedOut: true });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
});

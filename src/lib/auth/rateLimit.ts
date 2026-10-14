/**
 * Minimal fixed-window limiter for the login endpoint.
 * NOTE: in-memory => per server instance. On multi-instance/serverless
 * deployments swap this for a shared store (e.g. Upstash Redis); the
 * interface below is deliberately tiny to make that a one-file change.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const hits = new Map<string, { count: number; resetAt: number }>();

export function checkLoginAttempt(key: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function clearLoginAttempts(key: string) {
  hits.delete(key);
}

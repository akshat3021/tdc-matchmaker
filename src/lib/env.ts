/**
 * Central, lazy environment access. Reads happen at call time (not import
 * time) so `next build` never fails just because secrets are absent.
 */
const DEV_FALLBACK_SECRET = 'dev-only-insecure-secret-do-not-use-in-production';
let warned = false;

export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return new TextEncoder().encode(secret);

  if (process.env.NODE_ENV === 'production') {
    // Fail closed: never sign sessions with a guessable key in production.
    throw new Error('AUTH_SECRET must be set (min 32 chars) in production.');
  }
  if (!warned) {
    warned = true;
    console.warn('[tdc] AUTH_SECRET not set — using an insecure development key.');
  }
  return new TextEncoder().encode(DEV_FALLBACK_SECRET);
}

export const env = {
  get openAiKey() { return process.env.OPENAI_API_KEY?.trim() || ''; },
  get openAiModel() { return process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'; },
  get showDemoCredentials() { return process.env.SHOW_DEMO_CREDENTIALS === 'true'; },
  get isProd() { return process.env.NODE_ENV === 'production'; },
};

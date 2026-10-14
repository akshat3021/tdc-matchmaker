import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSessionUser } from '@/lib/auth/session';
import type { SessionUser } from '@/types';

/** Typed error whose message is safe to show to the client. */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export const ok = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json({ success: true, data }, init);

const fail = (status: number, code: string, message: string, headers?: HeadersInit) =>
  NextResponse.json({ success: false, error: { code, message } }, { status, headers });

/**
 * Wraps a route handler: enforces a session (unless `public`), blocks
 * cross-site state-changing requests and converts every failure into the
 * standard error envelope. Stack traces stay in server logs only.
 */
export function route(
  handler: (req: Request, ctx: { user: SessionUser; params: Record<string, string> }) => Promise<Response>,
  options: { public?: boolean } = {},
) {
  return async (req: Request, context: { params: Record<string, string> }) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') assertSameOrigin(req);
      const user = await getSessionUser();
      if (!user && !options.public) throw new ApiError(401, 'UNAUTHENTICATED', 'Please sign in again.');
      return await handler(req, { user: user as SessionUser, params: context?.params ?? {} });
    } catch (err) {
      if (err instanceof ApiError) return fail(err.status, err.code, err.message);
      if (err instanceof ZodError) {
        const first = err.issues[0];
        return fail(400, 'VALIDATION_ERROR', first ? `${first.path.join('.') || 'request'}: ${first.message}` : 'Invalid request.');
      }
      console.error('[api] unhandled error', err instanceof Error ? err.message : err);
      return fail(500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.');
    }
  };
}

/** Defence-in-depth CSRF check on top of SameSite=Lax cookies. */
function assertSameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return; // non-browser clients (curl, tests) carry no Origin
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!host || new URL(origin).host !== host) {
    throw new ApiError(403, 'BAD_ORIGIN', 'Cross-site request blocked.');
  }
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }
}

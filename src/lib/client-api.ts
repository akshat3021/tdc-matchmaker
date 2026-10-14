/** Thin fetch wrapper that unwraps the { success, data | error } envelope. */
export class ClientApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      credentials: 'same-origin',
    });
  } catch {
    throw new ClientApiError(0, 'Can’t reach the server. Check your connection and try again.');
  }

  if (res.status === 401 && typeof window !== 'undefined' && !url.startsWith('/api/auth/login')) {
    window.location.href = '/login';
  }

  let body: { success: boolean; data?: T; error?: { message: string } } | null = null;
  try { body = await res.json(); } catch { /* non-JSON error page */ }

  if (!res.ok || !body?.success) {
    throw new ClientApiError(res.status, body?.error?.message ?? 'Something went wrong. Please try again.');
  }
  return body.data as T;
}

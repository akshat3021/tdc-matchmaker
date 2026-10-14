'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ClientApiError } from '@/lib/client-api';

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : 'Could not sign in. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <label className="field">
        <span>Username</span>
        <input autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
      </label>
      <label className="field">
        <span>Password</span>
        <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy || !username || !password}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

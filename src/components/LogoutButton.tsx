'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client-api';

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* cookie may already be gone */ }
    router.replace('/login');
    router.refresh();
  }

  return (
    <button type="button" className="btn btn-quiet" onClick={signOut} disabled={busy}>
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}

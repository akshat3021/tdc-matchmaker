'use client';
import { useCallback, useState } from 'react';
import { api } from '@/lib/client-api';
import type { InsightResponse } from '@/types/api';

// Shared across the match card and the send modal so a pair is only generated once per session.
const inflight = new Map<string, Promise<InsightResponse>>();

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; data: InsightResponse }
  | { status: 'error'; message: string };

export function useInsight(customerId: string, candidateId: string) {
  const [state, setState] = useState<State>({ status: 'idle' });

  const load = useCallback(async () => {
    const key = `${customerId}:${candidateId}`;
    setState({ status: 'loading' });
    try {
      let p = inflight.get(key);
      if (!p) {
        p = api<InsightResponse>('/api/ai/insight', { method: 'POST', body: JSON.stringify({ customerId, candidateId }) });
        inflight.set(key, p);
        p.catch(() => inflight.delete(key)); // allow retry after failure
      }
      setState({ status: 'done', data: await p });
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : 'Could not load the insight.' });
    }
  }, [customerId, candidateId]);

  return { state, load };
}

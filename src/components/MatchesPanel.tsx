'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import { useDesk } from '@/lib/client-store';
import type { Customer, CustomerStatus } from '@/types';
import type { ApiMatch, MatchesResponse, SendReceipt } from '@/types/api';
import { MatchCard } from './MatchCard';
import { SendMatchModal } from './SendMatchModal';
import { useToast } from './Toast';

type Load = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: MatchesResponse };

export function MatchesPanel({ customer, userId, currentStatus }: { customer: Customer; userId: string; currentStatus: CustomerStatus }) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [sending, setSending] = useState<ApiMatch | null>(null);
  const [showLogic, setShowLogic] = useState(false);
  const { state, recordSent } = useDesk(userId);
  const toast = useToast();
  const sentFor = state.sent[customer.id] ?? [];

  const fetchMatches = useCallback(async () => {
    setLoad({ status: 'loading' });
    try {
      setLoad({ status: 'ready', data: await api<MatchesResponse>(`/api/customers/${customer.id}/matches`) });
    } catch (e) {
      setLoad({ status: 'error', message: e instanceof ClientApiError ? e.message : 'Could not load matches.' });
    }
  }, [customer.id]);

  useEffect(() => { void fetchMatches(); }, [fetchMatches]);

  function handleSent(match: ApiMatch, receipt: SendReceipt) {
    recordSent(customer.id, { candidateId: match.candidate.id, name: match.candidate.firstName, at: receipt.sentAt }, currentStatus);
    toast.push({ title: `${match.candidate.firstName} sent to ${customer.firstName}`, body: `Simulated email to ${receipt.to}` });
  }

  if (load.status === 'loading') {
    return (
      <div className="matches-loading" aria-busy="true" aria-label="Finding matches">
        {[0, 1, 2, 3].map((i) => <div key={i} className="match-skeleton"><i /><div><i /><i /><i /></div></div>)}
      </div>
    );
  }
  if (load.status === 'error') {
    return (
      <div className="empty" role="alert">
        <h3>Couldn’t load matches</h3>
        <p>{load.message}</p>
        <button className="btn btn-primary" onClick={() => void fetchMatches()}>Try again</button>
      </div>
    );
  }

  const { matches, poolSize, logic } = load.data;
  const sentMap = new Map(sentFor.map((s) => [s.candidateId, s]));

  return (
    <div>
      <div className="matches-head">
        <p>
          <strong>{matches.length} suggested matches</strong> from {poolSize} verified {customer.gender === 'Male' ? 'women' : 'men'}, ranked by fit.
        </p>
        <button className="link-btn" onClick={() => setShowLogic((v) => !v)} aria-expanded={showLogic}>
          {showLogic ? 'Hide' : 'How we rank'}
        </button>
      </div>

      {showLogic && (
        <div className="logic">
          <p>{logic.description}</p>
          <ul>
            {logic.weights.map((w) => <li key={w.label}><span>{w.label}</span><b>{w.weight}</b></li>)}
          </ul>
          <small>Pairs outside either person’s stated age range, or with a firm yes against a firm no on kids, are never shown.</small>
        </div>
      )}

      {matches.length === 0 ? (
        <div className="empty">
          <h3>No eligible matches right now</h3>
          <p>Loosening the age range or kids preference in the profile may open up more options.</p>
        </div>
      ) : (
        <div className="match-list">
          {matches.map((m, i) => (
            <MatchCard key={m.candidate.id} customerId={customer.id} match={m} rank={i + 1} sent={sentMap.get(m.candidate.id)} onSend={setSending} />
          ))}
        </div>
      )}

      {sending && (
        <SendMatchModal customer={customer} match={sending} onClose={() => setSending(null)} onSent={(r) => handleSent(sending, r)} />
      )}
    </div>
  );
}

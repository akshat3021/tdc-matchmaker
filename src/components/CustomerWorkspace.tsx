'use client';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { calcAge, formatLocation, fullName } from '@/lib/format';
import { useDesk } from '@/lib/client-store';
import { CUSTOMER_STATUSES, type Customer, type CustomerStatus } from '@/types';
import { Avatar } from './Avatar';
import { MatchesPanel } from './MatchesPanel';
import { NotesPanel } from './NotesPanel';
import { StatusTag } from './StatusTag';

type Tab = 'profile' | 'matches' | 'notes';

export function CustomerWorkspace({ customer, userId, profile }: { customer: Customer; userId: string; profile: ReactNode }) {
  const { state, setStatus } = useDesk(userId);
  const [tab, setTab] = useState<Tab>('profile');
  const [matchesVisited, setMatchesVisited] = useState(false);
  const status: CustomerStatus = state.status[customer.id] ?? customer.status;
  const noteCount = state.notes[customer.id]?.length ?? 0;

  function go(next: Tab) {
    setTab(next);
    if (next === 'matches') setMatchesVisited(true);
  }
  const onKey = (e: React.KeyboardEvent) => {
    const order: Tab[] = ['profile', 'matches', 'notes'];
    const i = order.indexOf(tab);
    if (e.key === 'ArrowRight') go(order[(i + 1) % 3]);
    if (e.key === 'ArrowLeft') go(order[(i + 2) % 3]);
  };

  return (
    <div>
      <Link href="/" className="back">← All clients</Link>

      <header className="hero">
        <Avatar person={customer} size={72} />
        <div className="hero-text">
          <h1>{fullName(customer)}</h1>
          <p>{calcAge(customer.dateOfBirth)} · {customer.designation} at {customer.company} · {formatLocation(customer)}</p>
        </div>
        <div className="hero-controls">
          <span className="verified"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>Verified profile</span>
          <label className="status-select">
            <span className="sr-only">Status</span>
            <StatusTag status={status} />
            <select value={status} onChange={(e) => setStatus(customer.id, e.target.value as CustomerStatus)} aria-label="Change status">
              {CUSTOMER_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          </label>
        </div>
      </header>

      <div className="tabs" role="tablist" aria-label="Client sections" onKeyDown={onKey}>
        {(['profile', 'matches', 'notes'] as Tab[]).map((t) => (
          <button key={t} role="tab" id={`tab-${t}`} aria-selected={tab === t} aria-controls={`panel-${t}`} tabIndex={tab === t ? 0 : -1} onClick={() => go(t)}>
            {t === 'profile' ? 'Profile' : t === 'matches' ? 'Matches' : 'Notes'}
            {t === 'notes' && noteCount > 0 && <b>{noteCount}</b>}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="panel-profile" aria-labelledby="tab-profile" hidden={tab !== 'profile'}>{profile}</div>
      <div role="tabpanel" id="panel-matches" aria-labelledby="tab-matches" hidden={tab !== 'matches'}>
        {matchesVisited && <MatchesPanel customer={customer} userId={userId} currentStatus={status} />}
      </div>
      <div role="tabpanel" id="panel-notes" aria-labelledby="tab-notes" hidden={tab !== 'notes'}>
        <NotesPanel userId={userId} customerId={customer.id} firstName={customer.firstName} />
      </div>
    </div>
  );
}

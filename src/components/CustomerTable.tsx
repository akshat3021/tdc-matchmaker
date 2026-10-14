'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { calcAge, formatLocation, fullName } from '@/lib/format';
import { useDesk } from '@/lib/client-store';
import { CUSTOMER_STATUSES, type Customer, type CustomerStatus } from '@/types';
import { Avatar } from './Avatar';
import { StatusTag } from './StatusTag';

// People who need the matchmaker's attention come first.
const PRIORITY: CustomerStatus[] = ['Actively matching', 'Profile verified', 'New intake', 'Match shared', 'Meeting planned', 'On pause'];

export function CustomerTable({ customers, userId }: { customers: Customer[]; userId: string }) {
  const { state } = useDesk(userId);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CustomerStatus | 'all'>('all');

  const rows = useMemo(
    () =>
      customers
        .map((c) => ({ c, status: state.status[c.id] ?? c.status }))
        .sort((a, b) => PRIORITY.indexOf(a.status) - PRIORITY.indexOf(b.status) || a.c.firstName.localeCompare(b.c.firstName)),
    [customers, state.status],
  );

  const counts = useMemo(() => {
    const m = new Map<CustomerStatus, number>();
    rows.forEach((r) => m.set(r.status, (m.get(r.status) ?? 0) + 1));
    return m;
  }, [rows]);

  const q = query.trim().toLowerCase();
  const visible = rows.filter(
    (r) =>
      (filter === 'all' || r.status === filter) &&
      (!q || `${fullName(r.c)} ${r.c.city} ${r.c.company}`.toLowerCase().includes(q)),
  );

  return (
    <section aria-label="Clients">
      <div className="filters">
        <div className="chips" role="group" aria-label="Filter by status">
          <button type="button" className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            All <b>{rows.length}</b>
          </button>
          {CUSTOMER_STATUSES.filter((s) => counts.get(s)).map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={filter === s} onClick={() => setFilter(s)}>
              {s} <b>{counts.get(s)}</b>
            </button>
          ))}
        </div>
        <label className="search">
          <span className="sr-only">Search clients</span>
          <input type="search" placeholder="Search name, city or company" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <h3>No clients match this view</h3>
          <p>Try a different status or clear the search.</p>
          <button type="button" className="btn" onClick={() => { setQuery(''); setFilter('all'); }}>Clear filters</button>
        </div>
      ) : (
        <div className="table" role="list">
          <div className="table-head" aria-hidden="true">
            <span>Client</span><span>Age</span><span>City</span><span>Marital status</span><span>Status</span>
          </div>
          {visible.map(({ c, status }) => (
            <Link key={c.id} href={`/customers/${c.id}`} className="row" role="listitem">
              <span className="cell-client">
                <Avatar person={c} />
                <span>
                  <strong>{fullName(c)}</strong>
                  <small>{c.designation}, {c.company}</small>
                </span>
              </span>
              <span className="cell" data-label="Age">{calcAge(c.dateOfBirth)}</span>
              <span className="cell" data-label="City">{formatLocation(c)}</span>
              <span className="cell" data-label="Marital status">{c.maritalStatus}</span>
              <span className="cell"><StatusTag status={status} /></span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

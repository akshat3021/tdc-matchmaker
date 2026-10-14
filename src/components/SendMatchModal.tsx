'use client';
import { useEffect, useRef, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import { calcAge, formatHeight, formatIncome, formatLocation, fullName } from '@/lib/format';
import type { ApiMatch, SendReceipt } from '@/types/api';
import type { Customer } from '@/types';
import { Avatar } from './Avatar';
import { useInsight } from './useInsight';

interface Props {
  customer: Customer;
  match: ApiMatch;
  onClose: () => void;
  onSent: (receipt: SendReceipt) => void;
}

export function SendMatchModal({ customer, match, onClose, onSent }: Props) {
  const c = match.candidate;
  const { state: insight, load } = useInsight(customer.id, c.id);
  const [message, setMessage] = useState('');
  const [edited, setEdited] = useState(false);
  const [phase, setPhase] = useState<'compose' | 'sending' | 'sent'>('compose');
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SendReceipt | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Draft the intro as soon as the modal opens.
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (insight.status === 'done' && !edited) setMessage(insight.data.intro);
  }, [insight, edited]);

  // Escape to close, and keep focus inside the dialog while it is open.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button, textarea, a[href], [tabindex]:not([tabindex="-1"])');
        const list = Array.from(focusable).filter((el) => !el.hasAttribute('disabled'));
        if (!list.length) return;
        const first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; previous?.focus(); };
  }, [onClose]);

  async function send() {
    setPhase('sending');
    setError(null);
    try {
      const res = await api<{ receipt: SendReceipt }>('/api/matches/send', {
        method: 'POST',
        body: JSON.stringify({ customerId: customer.id, candidateId: c.id, message }),
      });
      setReceipt(res.receipt);
      setPhase('sent');
      onSent(res.receipt);
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'Could not send. Please try again.');
      setPhase('compose');
    }
  }

  const drafting = insight.status === 'loading' || insight.status === 'idle';

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && phase !== 'sending') onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="send-title" tabIndex={-1} ref={dialogRef}>
        {phase === 'sent' && receipt ? (
          <div className="sent">
            <span className="sent-mark" aria-hidden="true">✓</span>
            <h2 id="send-title">Introduction sent to {customer.firstName}</h2>
            <p className="muted">Simulated for this demo. No real email was delivered.</p>
            <dl className="receipt">
              <div><dt>To</dt><dd>{receipt.to}</dd></div>
              <div><dt>Subject</dt><dd>{receipt.subject}</dd></div>
              <div><dt>Reference</dt><dd>{receipt.messageId}</dd></div>
            </dl>
            <pre className="receipt-body">{receipt.body}</pre>
            <div className="modal-actions"><button className="btn btn-primary" onClick={onClose}>Done</button></div>
          </div>
        ) : (
          <>
            <header className="modal-head">
              <div>
                <h2 id="send-title">Send {c.firstName} to {customer.firstName}</h2>
                <p className="muted">Review the introduction before it goes out.</p>
              </div>
              <button className="icon-btn" onClick={onClose} aria-label="Close" disabled={phase === 'sending'}>✕</button>
            </header>

            <div className="snapshot">
              <Avatar person={c} size={48} />
              <div>
                <strong>{fullName(c)}, {calcAge(c.dateOfBirth)}</strong>
                <span>{c.designation} · {c.company}</span>
                <span>{formatLocation(c)} · {formatHeight(c.heightCm)} · {formatIncome(c.incomeLpa)}</span>
                <span>{c.degree}, {c.college} · {c.religion}, {c.caste}</span>
              </div>
              <span className="snapshot-score">{match.score}<small>{match.tier}</small></span>
            </div>

            <label className="field-label" htmlFor="intro">
              Message to {customer.firstName}
              <span className={`source-badge ${insight.status === 'done' && insight.data.source === 'ai' ? 'is-ai' : ''}`}>
                {drafting ? 'Drafting…' : insight.status === 'done' ? (insight.data.source === 'ai' ? 'Drafted with AI' : 'Template draft') : 'Draft unavailable'}
              </span>
            </label>
            {drafting ? (
              <div className="skeleton-block" aria-label="Drafting introduction"><i /><i /><i /><i style={{ width: '60%' }} /></div>
            ) : (
              <textarea id="intro" rows={9} value={message} maxLength={1800} onChange={(e) => { setMessage(e.target.value); setEdited(true); }} />
            )}
            {insight.status === 'error' && (
              <p className="inline-error">{insight.message} You can still write the note yourself.</p>
            )}
            {insight.status === 'done' && insight.data.source === 'template' && (
              <p className="fineprint">Add an OPENAI_API_KEY to have this drafted by AI. This version is assembled from the match data.</p>
            )}
            {error && <p className="inline-error" role="alert">{error}</p>}

            <footer className="modal-actions">
              <button className="btn" onClick={onClose} disabled={phase === 'sending'}>Cancel</button>
              <button className="btn btn-wine" onClick={send} disabled={phase === 'sending' || drafting || message.trim().length < 20}>
                {phase === 'sending' ? 'Sending…' : `Send to ${customer.firstName}`}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

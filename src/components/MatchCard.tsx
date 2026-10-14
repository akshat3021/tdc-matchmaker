'use client';
import { useState } from 'react';
import { calcAge, formatHeight, formatIncome, formatLocation, fullName } from '@/lib/format';
import type { ApiMatch } from '@/types/api';
import type { SentIntro } from '@/lib/client-store';
import { Avatar } from './Avatar';
import { useInsight } from './useInsight';

interface Props {
  customerId: string;
  match: ApiMatch;
  rank: number;
  sent?: SentIntro;
  onSend: (m: ApiMatch) => void;
}

const tierClass = (t: ApiMatch['tier']) => (t === 'High potential' ? 'tier-high' : t === 'Strong fit' ? 'tier-strong' : 'tier-possible');
const sentSince = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

export function MatchCard({ customerId, match, rank, sent, onSend }: Props) {
  const c = match.candidate;
  const [open, setOpen] = useState(false);
  const { state: insight, load } = useInsight(customerId, c.id);
  const topFactors = [...match.factors].sort((a, b) => b.weight - a.weight).slice(0, 6);
  const panelId = `why-${c.id}`;

  return (
    <article className={`match ${open ? 'is-open' : ''}`}>
      <div className="match-main">
        <span className="match-rank" aria-label={`Rank ${rank}`}>{rank}</span>
        <Avatar person={c} size={48} />
        <div className="match-body">
          <h3>{fullName(c)}<span>, {calcAge(c.dateOfBirth)}</span></h3>
          <p className="match-meta">{c.designation}, {c.company} · {formatLocation(c)}</p>
          <p className="match-meta">{formatHeight(c.heightCm)} · {formatIncome(c.incomeLpa)} · {c.religion}, {c.caste}</p>
          <p className="match-headline">{match.headline}</p>
          <ul className="pips" aria-label="Compatibility by factor">
            {topFactors.map((f) => (
              <li key={f.key} className={`pip pip-${f.sentiment}`} title={f.note}><i aria-hidden="true" />{f.label}</li>
            ))}
          </ul>
        </div>
        <div className="match-side">
          <div className={`score ${tierClass(match.tier)}`}>
            <strong>{match.score}</strong>
            <span>{match.tier}</span>
          </div>
          <div className="match-actions">
            <button className="btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={panelId}>
              {open ? 'Hide detail' : 'Why this match'}
            </button>
            {sent ? (
              <button className="btn btn-sent" onClick={() => onSend(match)} title="Send again">Sent · {sentSince(sent.at)}</button>
            ) : (
              <button className="btn btn-wine" onClick={() => onSend(match)}>Send match</button>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="match-detail" id={panelId}>
          <div className="why-grid">
            <table className="breakdown">
              <caption className="sr-only">Compatibility breakdown</caption>
              <tbody>
                {[...match.factors].sort((a, b) => b.weight - a.weight).map((f) => (
                  <tr key={f.key}>
                    <th scope="row">{f.label}</th>
                    <td><span className="bar"><i className={`bar-${f.sentiment}`} style={{ width: `${Math.round(f.score * 100)}%` }} /></span></td>
                    <td className="note">{f.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="insight">
              <h4>Matchmaker’s read</h4>
              {insight.status === 'idle' && (
                <>
                  <p className="muted">Get a short, specific read on this pair with talking points for your next call.</p>
                  <button className="btn btn-primary" onClick={() => void load()}>Generate read</button>
                </>
              )}
              {insight.status === 'loading' && <div className="skeleton-block"><i /><i /><i style={{ width: '70%' }} /></div>}
              {insight.status === 'error' && (
                <>
                  <p className="inline-error">{insight.message}</p>
                  <button className="btn" onClick={() => void load()}>Try again</button>
                </>
              )}
              {insight.status === 'done' && (
                <>
                  <p className="insight-text">{insight.data.fit}</p>
                  <ul className="talking">
                    {insight.data.talkingPoints.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                  <span className={`source-badge ${insight.data.source === 'ai' ? 'is-ai' : ''}`}>
                    {insight.data.source === 'ai' ? 'Written with AI from the profile data' : 'Template summary. Add an API key for AI'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

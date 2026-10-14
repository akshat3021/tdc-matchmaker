'use client';
import { useState } from 'react';
import { useDesk } from '@/lib/client-store';

const stamp = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export function NotesPanel({ userId, customerId, firstName }: { userId: string; customerId: string; firstName: string }) {
  const { state, addNote, deleteNote } = useDesk(userId);
  const [text, setText] = useState('');
  const notes = state.notes[customerId] ?? [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    addNote(customerId, clean.slice(0, 1000));
    setText('');
  }

  return (
    <div className="notes">
      <form onSubmit={submit} className="note-form">
        <label htmlFor="note" className="sr-only">New note</label>
        <textarea
          id="note"
          value={text}
          maxLength={1000}
          rows={3}
          placeholder={`What came up in your last conversation with ${firstName}?`}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit(e); }}
        />
        <div className="note-actions">
          <small>{text.length}/1000 · Ctrl/⌘ + Enter to save</small>
          <button className="btn btn-primary" type="submit" disabled={!text.trim()}>Save note</button>
        </div>
      </form>

      {notes.length === 0 ? (
        <div className="empty empty-inline">
          <h3>No notes yet</h3>
          <p>Capture call takeaways, family preferences or feedback on matches here.</p>
        </div>
      ) : (
        <ul className="note-list">
          {notes.map((n) => (
            <li key={n.id}>
              <p>{n.text}</p>
              <div>
                <time dateTime={n.at}>{stamp(n.at)}</time>
                <button type="button" className="link-btn" onClick={() => deleteNote(customerId, n.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="fineprint">Notes are saved in this browser for the demo. In production they would live in the database.</p>
    </div>
  );
}

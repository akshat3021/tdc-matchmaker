'use client';
/**
 * Per-matchmaker working state (notes, sent introductions, status changes),
 * persisted in localStorage. This is a deliberate MVP shortcut: serverless
 * hosting has no writable disk, and the task is about the workflow. The
 * shape below maps 1:1 onto three DB tables (notes, introductions,
 * client_status) when a database is added.
 */
import { useCallback, useSyncExternalStore } from 'react';
import type { CustomerStatus } from '@/types';

export interface Note { id: string; text: string; at: string }
export interface SentIntro { candidateId: string; name: string; at: string }
export interface DeskState {
  notes: Record<string, Note[]>;
  sent: Record<string, SentIntro[]>;
  status: Record<string, CustomerStatus>;
}

const EMPTY: DeskState = { notes: {}, sent: {}, status: {} };
const EVENT = 'tdc-desk-change';
const keyFor = (userId: string) => `tdc:v1:${userId}`;
const parsedCache = new Map<string, { raw: string | null; state: DeskState }>();

function read(userId: string): DeskState {
  const raw = window.localStorage.getItem(keyFor(userId));
  const cached = parsedCache.get(userId);
  if (cached && cached.raw === raw) return cached.state; // stable reference for useSyncExternalStore
  let state = EMPTY;
  try { if (raw) state = { ...EMPTY, ...JSON.parse(raw) }; } catch { /* corrupted entry: start fresh */ }
  parsedCache.set(userId, { raw, state });
  return state;
}

function write(userId: string, next: DeskState) {
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(next));
  } catch { /* storage full or blocked: keep the UI working in-memory only */ }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener('storage', cb); };
}

export function useDesk(userId: string) {
  const state = useSyncExternalStore(subscribe, () => read(userId), () => EMPTY);

  const addNote = useCallback((customerId: string, text: string) => {
    const s = read(userId);
    const note: Note = { id: crypto.randomUUID(), text, at: new Date().toISOString() };
    write(userId, { ...s, notes: { ...s.notes, [customerId]: [note, ...(s.notes[customerId] ?? [])] } });
  }, [userId]);

  const deleteNote = useCallback((customerId: string, noteId: string) => {
    const s = read(userId);
    write(userId, { ...s, notes: { ...s.notes, [customerId]: (s.notes[customerId] ?? []).filter((n) => n.id !== noteId) } });
  }, [userId]);

  const setStatus = useCallback((customerId: string, status: CustomerStatus) => {
    const s = read(userId);
    write(userId, { ...s, status: { ...s.status, [customerId]: status } });
  }, [userId]);

  /** Records a sent introduction and moves the client to "Match shared" unless further along. */
  const recordSent = useCallback((customerId: string, intro: SentIntro, currentStatus: CustomerStatus) => {
    const s = read(userId);
    const advance = currentStatus === 'Actively matching' || currentStatus === 'Profile verified' || currentStatus === 'New intake';
    write(userId, {
      ...s,
      sent: { ...s.sent, [customerId]: [intro, ...(s.sent[customerId] ?? []).filter((x) => x.candidateId !== intro.candidateId)] },
      status: advance ? { ...s.status, [customerId]: 'Match shared' } : s.status,
    });
  }, [userId]);

  return { state, addNote, deleteNote, setStatus, recordSent };
}

/**
 * Data access layer. The MVP reads static JSON; every function here is the
 * only place that knows that. Swapping in Postgres/Firebase means
 * re-implementing this file — nothing above it changes.
 *
 * Authorisation lives here too: clients are only ever returned for the
 * matchmaker who owns them.
 */
import customersJson from '@/data/customers.json';
import candidatesJson from '@/data/candidates.json';
import matchmakersJson from '@/data/matchmakers.json';
import type { Customer, Gender, Matchmaker, Profile } from '@/types';

const customers = customersJson as unknown as Customer[];
const candidates = candidatesJson as unknown as Profile[];
const matchmakers = matchmakersJson as Matchmaker[];

export function findMatchmakerByUsername(username: string): Matchmaker | undefined {
  return matchmakers.find((m) => m.username === username.trim().toLowerCase());
}

export function listCustomersFor(matchmakerId: string): Customer[] {
  return customers.filter((c) => c.matchmakerId === matchmakerId);
}

/** Returns null both for "doesn't exist" and "belongs to someone else". */
export function getCustomerFor(matchmakerId: string, customerId: string): Customer | null {
  return customers.find((c) => c.id === customerId && c.matchmakerId === matchmakerId) ?? null;
}

export function listCandidates(gender: Gender): Profile[] {
  return candidates.filter((c) => c.gender === gender && c.verified);
}

export function getCandidate(candidateId: string): Profile | null {
  return candidates.find((c) => c.id === candidateId) ?? null;
}

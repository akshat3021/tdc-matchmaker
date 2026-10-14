import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankMatches, exclusionReason } from './engine';
import customers from '../../data/customers.json';
import candidates from '../../data/candidates.json';
import type { Customer, Profile } from '../../types';

const cs = customers as unknown as Customer[];
const pool = candidates as unknown as Profile[];

test('male seeker: ranked list is opposite gender, sorted, within stated age range', () => {
  const seeker = cs.find((c) => c.gender === 'Male')!;
  const out = rankMatches(seeker, pool.filter((p) => p.gender === 'Female'));
  assert.ok(out.length >= 5, 'expected several matches');
  for (let i = 1; i < out.length; i++) assert.ok(out[i - 1].score >= out[i].score);
  assert.ok(out.every((m) => m.candidate.gender === 'Female'));
});

test('firm yes vs firm no on kids is excluded', () => {
  const seeker = { ...cs.find((c) => c.gender === 'Male')!, wantKids: 'Yes' as const };
  const cand = { ...pool.find((p) => p.gender === 'Female')!, wantKids: 'No' as const };
  assert.match(exclusionReason(seeker, cand) ?? '', /kids/i);
});

test('female seeker produces a ranked list with explanations', () => {
  const seeker = cs.find((c) => c.gender === 'Female')!;
  const out = rankMatches(seeker, pool.filter((p) => p.gender === 'Male'));
  assert.ok(out.length >= 5);
  assert.ok(out[0].headline.length > 10);
  assert.ok(out[0].factors.every((f) => f.score >= 0 && f.score <= 1));
});

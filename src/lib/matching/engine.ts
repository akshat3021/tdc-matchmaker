import type { Profile } from '@/types';
import { matchProfileFor } from './profiles';
import type { FactorBreakdown, MatchProfile, MatchResult, MatchTier } from './types';

export const TIER_THRESHOLDS = { high: 82, strong: 70 } as const;
const MIN_SCORE = 55;

const tierFor = (score: number): MatchTier =>
  score >= TIER_THRESHOLDS.high ? 'High potential' : score >= TIER_THRESHOLDS.strong ? 'Strong fit' : 'Worth exploring';

const sentimentFor = (score: number): FactorBreakdown['sentiment'] =>
  score >= 0.8 ? 'positive' : score >= 0.5 ? 'neutral' : 'concern';

const list = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`;

/** Why a pair is excluded outright, or null if it's eligible. */
export function exclusionReason(seeker: Profile, candidate: Profile, profile: MatchProfile = matchProfileFor(seeker.gender)): string | null {
  for (const filter of profile.hardFilters) {
    const reason = filter(seeker, candidate);
    if (reason) return reason;
  }
  return null;
}

/** Scores one pair (assumes the pair already passed the hard filters). */
export function scorePair(seeker: Profile, candidate: Profile, profile: MatchProfile = matchProfileFor(seeker.gender)): MatchResult {
  const totalWeight = profile.factors.reduce((sum, f) => sum + f.weight, 0);

  const factors: FactorBreakdown[] = profile.factors.map((f) => {
    const result = f.fn(seeker, candidate);
    return {
      key: f.key,
      label: f.label,
      score: result.score,
      note: result.note,
      weight: f.weight,
      contribution: (f.weight / totalWeight) * result.score * 100,
      sentiment: sentimentFor(result.score),
    };
  });

  // Raw weighted fit is generous (most eligible pairs land at 85+). Squaring it
  // spreads the top end so tiers actually separate strong from merely good.
  const rawFit = factors.reduce((sum, f) => sum + f.contribution, 0) / 100;
  const score = Math.round(rawFit * rawFit * 100);
  const tier = tierFor(score);
  const phrase = (key: string) => profile.factors.find((f) => f.key === key)!.phrase;

  // Highlights: strongest weighted positives. Concerns: weighty factors that score poorly.
  const strengths = factors.filter((f) => f.score >= 0.85 && f.weight >= 6).sort((a, b) => b.weight - a.weight);
  const concernFactors = factors.filter((f) => f.score < 0.5 && f.weight >= 6).sort((a, b) => b.weight - a.weight);

  const topPhrases = strengths.slice(0, 3).map((f) => phrase(f.key));
  const concernPhrase = concernFactors[0] ? phrase(concernFactors[0].key) : null;

  let headline: string;
  if (tier === 'High potential') headline = `High potential: ${list(topPhrases) || 'broad alignment'} align strongly`;
  else if (tier === 'Strong fit') headline = `Strong fit: ${list(topPhrases) || 'good overall alignment'} line up well`;
  else headline = `Worth exploring: ${list(topPhrases.slice(0, 2)) || 'some common ground'} work${concernPhrase ? `, ${concernPhrase} needs a conversation` : ''}`;

  return {
    candidate, score, tier, headline,
    highlights: strengths.slice(0, 4).map((f) => `${f.label}: ${f.note}`),
    concerns: concernFactors.slice(0, 3).map((f) => `${f.label}: ${f.note}`),
    factors,
  };
}

export interface RankOptions { limit?: number; minScore?: number }

/** Filters, scores and ranks a pool. O(n · factors); trivially fast for thousands of profiles. */
export function rankMatches(seeker: Profile, pool: Profile[], { limit = 12, minScore = MIN_SCORE }: RankOptions = {}): MatchResult[] {
  const profile = matchProfileFor(seeker.gender);
  const scored = pool
    .filter((c) => c.id !== seeker.id && !exclusionReason(seeker, c, profile))
    .map((c) => scorePair(seeker, c, profile))
    .sort((a, b) => b.score - a.score || b.candidate.incomeLpa - a.candidate.incomeLpa);

  const strong = scored.filter((m) => m.score >= minScore);
  // Never show an empty list when a handful of eligible people exist.
  return (strong.length >= 5 ? strong : scored.slice(0, 5)).slice(0, limit);
}

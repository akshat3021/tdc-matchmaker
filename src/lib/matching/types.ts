import type { Profile } from '@/types';

export type FactorKey =
  | 'age' | 'height' | 'income' | 'kids' | 'location' | 'community' | 'values'
  | 'lifestyle' | 'lifeStage' | 'languages' | 'manglik' | 'education' | 'career';

/** One scored dimension of compatibility between a seeker and a candidate. */
export interface FactorResult {
  key: FactorKey;
  label: string;
  /** 0 (poor) … 1 (excellent). */
  score: number;
  /** Short, human-readable observation about this specific pair. */
  note: string;
}

export type FactorFn = (seeker: Profile, candidate: Profile) => Omit<FactorResult, 'key' | 'label'>;

export interface WeightedFactor {
  key: FactorKey;
  label: string;
  /** Short noun phrase used in headlines, e.g. "kids preference". */
  phrase: string;
  weight: number;
  fn: FactorFn;
}

/** Returns a reason string if the pair must never be suggested. */
export type HardFilter = (seeker: Profile, candidate: Profile) => string | null;

/** A complete, swappable recipe: who to exclude and how to score the rest. */
export interface MatchProfile {
  id: string;
  description: string;
  hardFilters: HardFilter[];
  factors: WeightedFactor[];
}

export type MatchTier = 'High potential' | 'Strong fit' | 'Worth exploring';

export interface FactorBreakdown extends FactorResult {
  weight: number;
  /** Share of the total score this factor contributes, in points. */
  contribution: number;
  sentiment: 'positive' | 'neutral' | 'concern';
}

export interface MatchResult {
  candidate: Profile;
  /** 0–100 */
  score: number;
  tier: MatchTier;
  headline: string;
  highlights: string[];
  concerns: string[];
  factors: FactorBreakdown[];
}

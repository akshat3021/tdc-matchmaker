import type { FactorBreakdown, MatchTier } from '@/lib/matching/types';
import type { Profile } from '@/types';

/** Pool candidates as sent to the browser: contact details are stripped server-side. */
export type CandidateView = Omit<Profile, 'email' | 'phone'>;

export interface ApiMatch {
  candidate: CandidateView;
  score: number;
  tier: MatchTier;
  headline: string;
  highlights: string[];
  concerns: string[];
  factors: FactorBreakdown[];
}

export interface MatchesResponse {
  poolSize: number;
  logic: { id: string; description: string; weights: { label: string; weight: number }[] };
  matches: ApiMatch[];
}

export interface InsightResponse {
  fit: string;
  talkingPoints: string[];
  intro: string;
  source: 'ai' | 'template';
}

export interface SendReceipt {
  to: string;
  subject: string;
  body: string;
  messageId: string;
  sentAt: string;
  simulated: true;
}

/**
 * Gender-specific matching recipes. Weights are relative and normalised at
 * scoring time, so you can add/remove a factor without rebalancing by hand.
 *
 * Male seekers  -> the brief's explicit preferences dominate (age, height,
 *                  income, kids), with culture and location as support.
 * Female seekers -> a values-first model: family outlook, relocation and
 *                  life-stage readiness carry the most weight, plus career
 *                  and education parity.
 */
import { calcAge } from '@/lib/format';
import * as f from './factors';
import type { HardFilter, MatchProfile, WeightedFactor } from './types';

// ── Hard filters (shared) ──
const oppositeGender: HardFilter = (s, c) => (s.gender === c.gender ? 'Same gender' : null);
const withinStatedAgeRanges: HardFilter = (s, c) => {
  const sAge = calcAge(s.dateOfBirth);
  const cAge = calcAge(c.dateOfBirth);
  if (cAge < s.partnerAgeMin || cAge > s.partnerAgeMax) return 'Outside the client’s preferred age range';
  if (sAge < c.partnerAgeMin || sAge > c.partnerAgeMax) return 'Client is outside the candidate’s preferred age range';
  return null;
};
/** A clear yes against a clear no on kids is the one dealbreaker we never soften. */
const kidsDealbreaker: HardFilter = (s, c) =>
  (s.wantKids === 'Yes' && c.wantKids === 'No') || (s.wantKids === 'No' && c.wantKids === 'Yes')
    ? 'Opposite, firm views on having kids'
    : null;

const factor = (
  key: WeightedFactor['key'], label: string, phrase: string, weight: number, fn: WeightedFactor['fn'],
): WeightedFactor => ({ key, label, phrase, weight, fn });

export const maleSeekerProfile: MatchProfile = {
  id: 'male-seeker',
  description:
    'Prefers a candidate who is younger, earns less or similar, is shorter or similar in height and shares views on children. Culture, location and life stage refine the ranking.',
  hardFilters: [oppositeGender, withinStatedAgeRanges, kidsDealbreaker],
  factors: [
    factor('age', 'Age', 'age', 18, f.ageYoungerPreferred),
    factor('kids', 'Kids', 'kids preference', 14, f.kidsAlignment),
    factor('height', 'Height', 'height', 12, f.heightShorterPreferred),
    factor('income', 'Income', 'income', 12, f.incomeLessOrSimilar),
    factor('location', 'Location', 'location', 10, f.locationAndRelocation),
    factor('community', 'Community', 'community', 10, f.communityFit),
    factor('values', 'Family values', 'family outlook', 8, f.familyValuesAlignment),
    factor('lifestyle', 'Lifestyle', 'lifestyle', 6, f.lifestyleFit),
    factor('lifeStage', 'Life stage', 'timeline', 6, f.lifeStageAndIntent),
    factor('languages', 'Languages', 'languages', 2, f.languageOverlap),
    factor('manglik', 'Manglik', 'manglik status', 2, f.manglikCompatibility),
  ],
};

export const femaleSeekerProfile: MatchProfile = {
  id: 'female-seeker',
  description:
    'Values-first. Family outlook, relocation flexibility, life-stage readiness and lifestyle lead, with career, education and earning parity alongside age and height.',
  hardFilters: [oppositeGender, withinStatedAgeRanges, kidsDealbreaker],
  factors: [
    factor('values', 'Family values', 'family outlook', 14, f.familyValuesAlignment),
    factor('location', 'Location & relocation', 'relocation plans', 14, f.locationAndRelocation),
    factor('kids', 'Kids', 'kids preference', 12, f.kidsAlignment),
    factor('lifeStage', 'Life stage & intent', 'timeline', 10, f.lifeStageAndIntent),
    factor('lifestyle', 'Lifestyle', 'lifestyle', 10, f.lifestyleFit),
    factor('career', 'Career', 'career', 10, f.careerCompatibility),
    factor('education', 'Education', 'education', 8, f.educationParity),
    factor('community', 'Community', 'community', 8, f.communityFit),
    factor('income', 'Income', 'earning level', 6, f.incomeAmbitionMatch),
    factor('age', 'Age', 'age', 6, f.ageOlderPreferred),
    factor('height', 'Height', 'height', 3, f.heightTallerPreferred),
    factor('languages', 'Languages', 'languages', 2, f.languageOverlap),
    factor('manglik', 'Manglik', 'manglik status', 2, f.manglikCompatibility),
  ],
};

export const matchProfileFor = (gender: 'Male' | 'Female'): MatchProfile =>
  gender === 'Male' ? maleSeekerProfile : femaleSeekerProfile;

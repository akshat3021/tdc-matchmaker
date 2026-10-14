/**
 * Pure scoring functions. Each one compares a seeker with a candidate on a
 * single dimension and returns a 0–1 score plus a plain-English note.
 * They know nothing about weights or gender-specific preferences — that
 * lives in profiles.ts. To add a dimension: write a function here, then
 * register it (with a weight) in a profile.
 */
import { calcAge, formatIncome } from '@/lib/format';
import type { Diet, Profile } from '@/types';
import type { FactorFn } from './types';

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const sharedMetro = (a: string, b: string) => {
  const ncr = ['Delhi', 'Gurugram', 'Noida'];
  return a === b || (ncr.includes(a) && ncr.includes(b));
};

// ───────────────────────────── age ─────────────────────────────
/** Male seeker: candidate ideally 1–5 years younger. */
export const ageYoungerPreferred: FactorFn = (s, c) => {
  const d = calcAge(s.dateOfBirth) - calcAge(c.dateOfBirth); // >0 => candidate younger
  let score = 0.15;
  if (d >= 1 && d <= 5) score = 1;
  else if (d === 0 || d === 6) score = 0.75;
  else if (d === 7 || d === 8) score = 0.5;
  else if (d < 0 && d >= -2) score = 0.4;
  const note = d > 0 ? `${plural(d, 'year')} younger` : d === 0 ? 'Same age' : `${plural(-d, 'year')} older`;
  return { score, note };
};

/** Female seeker: candidate ideally the same age to ~5 years older. */
export const ageOlderPreferred: FactorFn = (s, c) => {
  const d = calcAge(c.dateOfBirth) - calcAge(s.dateOfBirth); // >0 => candidate older
  let score = 0.25;
  if (d >= 0 && d <= 5) score = 1;
  else if (d === 6 || d === 7) score = 0.7;
  else if (d < 0 && d >= -2) score = 0.6;
  else if (d >= 8) score = 0.4;
  const note = d > 0 ? `${plural(d, 'year')} older` : d === 0 ? 'Same age' : `${plural(-d, 'year')} younger`;
  return { score, note };
};

// ───────────────────────────── height ─────────────────────────────
export const heightShorterPreferred: FactorFn = (s, c) => {
  const d = s.heightCm - c.heightCm; // >0 => candidate shorter
  let score = 0.15;
  if (d >= 8 && d <= 25) score = 1;
  else if (d >= 3 && d <= 7) score = 0.8;
  else if (d > 25) score = 0.6;
  else if (d >= 0) score = 0.55;
  const note = d > 0 ? `${d} cm shorter` : d === 0 ? 'Same height' : `${-d} cm taller`;
  return { score, note };
};

export const heightTallerPreferred: FactorFn = (s, c) => {
  const d = c.heightCm - s.heightCm; // >0 => candidate taller
  let score = 0.2;
  if (d >= 5) score = 1;
  else if (d >= 1) score = 0.7;
  else if (d === 0) score = 0.55;
  const note = d > 0 ? `${d} cm taller` : d === 0 ? 'Same height' : `${-d} cm shorter`;
  return { score, note };
};

// ───────────────────────────── income / career ─────────────────────────────
/** Male seeker: candidate earns less than or similar to him. */
export const incomeLessOrSimilar: FactorFn = (s, c) => {
  const r = c.incomeLpa / s.incomeLpa;
  let score = 0.3;
  if (r <= 1.05 && r >= 0.4) score = 1;
  else if (r < 0.4) score = 0.75;
  else if (r <= 1.3) score = 0.6;
  const note =
    r <= 1.05 ? `Earns ${formatIncome(c.incomeLpa)} vs ${formatIncome(s.incomeLpa)}` : `Earns more (${formatIncome(c.incomeLpa)} vs ${formatIncome(s.incomeLpa)})`;
  return { score, note };
};

/** Female seeker: looks for a partner at a comparable or higher earning level. */
export const incomeAmbitionMatch: FactorFn = (s, c) => {
  const r = c.incomeLpa / s.incomeLpa;
  const score = r >= 0.95 ? 1 : r >= 0.75 ? 0.75 : r >= 0.5 ? 0.5 : 0.3;
  return { score, note: `Earns ${formatIncome(c.incomeLpa)} vs ${formatIncome(s.incomeLpa)}` };
};

const CORPORATE = ['Technology', 'Consulting', 'Finance', 'Business & Management'];
export const careerCompatibility: FactorFn = (s, c) => {
  if (s.industry === c.industry) return { score: 1, note: `Both in ${s.industry.toLowerCase()}` };
  if (CORPORATE.includes(s.industry) && CORPORATE.includes(c.industry)) {
    return { score: 0.8, note: 'Adjacent corporate careers, with similar rhythms' };
  }
  return { score: 0.6, note: `${c.industry} vs ${s.industry}, with different working rhythms` };
};

const EDU_RANK: Record<string, number> = {
  "Bachelor's": 1, "Master's": 2, MBA: 2, 'Professional (MD / CA / LLB)': 2, Doctorate: 3,
};
export const educationParity: FactorFn = (s, c) => {
  const d = EDU_RANK[c.educationLevel] - EDU_RANK[s.educationLevel];
  const score = d >= 0 ? 1 : d === -1 ? 0.6 : 0.3;
  return { score, note: `${c.educationLevel} (${c.postGraduation ?? c.degree})` };
};

// ───────────────────────────── kids ─────────────────────────────
export const kidsAlignment: FactorFn = (s, c) => {
  if (s.wantKids === c.wantKids) {
    return { score: s.wantKids === 'Maybe' ? 0.85 : 1, note: `Both say ${s.wantKids.toLowerCase()} to kids` };
  }
  if (s.wantKids === 'Maybe' || c.wantKids === 'Maybe') {
    return { score: 0.6, note: `Kids: ${c.wantKids.toLowerCase()} vs ${s.wantKids.toLowerCase()}, one side undecided` };
  }
  return { score: 0, note: `Kids: ${c.wantKids.toLowerCase()} vs ${s.wantKids.toLowerCase()}` };
};

// ───────────────────────────── location ─────────────────────────────
const openness = (p: Profile) => (p.openToRelocate === 'Yes' ? 1 : p.openToRelocate === 'Maybe' ? 0.5 : 0);
export const locationAndRelocation: FactorFn = (s, c) => {
  if (sharedMetro(s.city, c.city)) {
    return { score: 1, note: s.city === c.city ? `Both in ${s.city}` : 'Both in Delhi NCR' };
  }
  const best = Math.max(openness(s), openness(c));
  const worst = Math.min(openness(s), openness(c));
  if (s.country === c.country) {
    return {
      score: 0.45 + 0.45 * best,
      note: best > 0 ? `${c.city} vs ${s.city}, at least one open to relocating` : `${c.city} vs ${s.city}, neither wants to relocate`,
    };
  }
  return {
    score: Math.min(1, 0.1 + 0.5 * best + 0.25 * worst),
    note: best > 0 ? `${c.city} vs ${s.city}, cross-border with relocation open` : `${c.city} vs ${s.city}, cross-border and neither open to moving`,
  };
};

// ───────────────────────────── community & values ─────────────────────────────
export const communityFit: FactorFn = (s, c) => {
  const strict = s.communityPreference === 'Same community preferred' || c.communityPreference === 'Same community preferred';
  if (s.religion === c.religion && s.caste === c.caste) return { score: 1, note: `Same community (${c.caste})` };
  if (s.religion === c.religion) {
    return { score: strict ? 0.4 : 0.85, note: `${c.caste} vs ${s.caste}${strict ? ', with a same-community preference on record' : ', and both are open'}` };
  }
  return { score: strict ? 0.05 : 0.5, note: `${c.religion} vs ${s.religion}${strict ? ', with a same-community preference on record' : ', and both are open'}` };
};

const VALUE_ORDER = { Traditional: 0, Moderate: 1, Liberal: 2 } as const;
export const familyValuesAlignment: FactorFn = (s, c) => {
  const gap = Math.abs(VALUE_ORDER[s.familyValues] - VALUE_ORDER[c.familyValues]);
  const valuesScore = gap === 0 ? 1 : gap === 1 ? 0.65 : 0.2;
  const typeScore = s.familyType === c.familyType ? 1 : 0.6;
  const note =
    gap === 0
      ? `Both ${s.familyValues.toLowerCase()} in outlook; ${c.familyType.toLowerCase()} family`
      : `${c.familyValues} vs ${s.familyValues} family outlook; ${c.familyType.toLowerCase()} family`;
  return { score: 0.7 * valuesScore + 0.3 * typeScore, note };
};

// ───────────────────────────── lifestyle ─────────────────────────────
const DIET_STRICTNESS: Record<Diet, number> = { Jain: 0, Vegetarian: 1, Vegan: 1, Eggetarian: 2, 'Non-vegetarian': 3 };
const DRINK_ORDER = { Never: 0, Socially: 1, Regularly: 2 } as const;
const SMOKE_ORDER = { Never: 0, Occasionally: 1, Regularly: 2 } as const;

export const lifestyleFit: FactorFn = (s, c) => {
  const dietGap = Math.abs(DIET_STRICTNESS[s.diet] - DIET_STRICTNESS[c.diet]);
  const diet = [1, 0.75, 0.45, 0.2][Math.min(dietGap, 3)];
  const drink = [1, 0.75, 0.3][Math.abs(DRINK_ORDER[s.drinking] - DRINK_ORDER[c.drinking])];
  const smoke = [1, 0.6, 0.15][Math.abs(SMOKE_ORDER[s.smoking] - SMOKE_ORDER[c.smoking])];
  const pets = s.openToPets === c.openToPets ? 1 : s.openToPets === 'Maybe' || c.openToPets === 'Maybe' ? 0.75 : 0.3;
  const score = 0.4 * diet + 0.25 * drink + 0.15 * smoke + 0.2 * pets;

  const issues: string[] = [];
  if (diet <= 0.45) issues.push(`diet (${c.diet.toLowerCase()} vs ${s.diet.toLowerCase()})`);
  if (drink <= 0.3) issues.push('drinking habits');
  if (smoke <= 0.15) issues.push('smoking');
  if (pets <= 0.3) issues.push('pets');
  return { score, note: issues.length ? `Differences on ${issues.join(', ')}` : 'Aligned on diet, habits and pets' };
};

// ───────────────────────────── life stage & intent ─────────────────────────────
const INTENT_ORDER = { 'Marriage within 12 months': 0, 'Marriage in 1–2 years': 1, 'Open to the right person': 2 } as const;
export const lifeStageAndIntent: FactorFn = (s, c) => {
  const gap = Math.abs(INTENT_ORDER[s.relationshipIntent] - INTENT_ORDER[c.relationshipIntent]);
  let score = [1, 0.7, 0.4][gap];
  let note = gap === 0 ? `Same timeline: ${c.relationshipIntent.toLowerCase()}` : `Timelines differ: ${c.relationshipIntent.toLowerCase()}`;
  if (s.maritalStatus === 'Never married' && c.maritalStatus !== 'Never married') {
    score *= 0.7;
    note += `, ${c.maritalStatus.toLowerCase()} (worth raising early)`;
  }
  return { score, note };
};

// ───────────────────────────── small signals ─────────────────────────────
export const languageOverlap: FactorFn = (s, c) => {
  const shared = s.languages.filter((l) => c.languages.includes(l));
  const score = shared.length >= 2 ? 1 : shared.length === 1 ? 0.8 : 0.3;
  return { score, note: shared.length ? `Share ${shared.join(', ')}` : 'No shared language' };
};

export const manglikCompatibility: FactorFn = (s, c) => {
  if (s.manglik === 'Not applicable' || c.manglik === 'Not applicable') return { score: 1, note: 'Not a factor' };
  if (s.manglik === c.manglik) return { score: 1, note: 'Manglik status matches' };
  if (s.manglik === 'Anshik' || c.manglik === 'Anshik') return { score: 0.7, note: 'Partial manglik (usually workable)' };
  return { score: 0.35, note: 'Manglik mismatch (families may want a kundli check)' };
};

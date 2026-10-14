/**
 * AI layer. The deterministic engine decides WHO is a fit and by how much;
 * the LLM explains WHY in a matchmaker's voice and drafts the intro. Keeping
 * those roles apart means scores stay explainable and auditable, and the
 * model can never silently reorder or invent matches.
 */
import { z } from 'zod';
import { calcAge, formatHeight, formatIncome } from '@/lib/format';
import type { MatchResult } from '@/lib/matching';
import type { Profile } from '@/types';
import { chatJson } from './openai';
import { templateInsight } from './fallback';

export interface Insight {
  /** 2–3 sentences on why this pair could work, and the one thing to watch. */
  fit: string;
  /** Two concrete things for the matchmaker to bring up. */
  talkingPoints: string[];
  /** Email draft to the client introducing the candidate. */
  intro: string;
  source: 'ai' | 'template';
}

const outputSchema = z.object({
  fit: z.string().min(20).max(700),
  talkingPoints: z.array(z.string().min(5).max(220)).min(1).max(3),
  intro: z.string().min(60).max(1400),
});

const SYSTEM = `You are a senior matchmaker at The Date Crew, a premium, human-first matchmaking service for relationship-ready professionals in India and abroad. You write for fellow matchmakers and their clients.

Voice: warm, precise, grounded in the specific people in front of you. Indian-English professional register. No clichés ("soulmate", "perfect match", "made for each other"), no exclamation marks, no emojis, no mention of scores or algorithms.

Rules:
- Use only facts present in the dossier. Never invent details.
- Be honest: name one real tension or open question if the data shows one, framed constructively.
- Never include email addresses, phone numbers or surnames of the candidate in the intro.
- "fit": 2–3 sentences for the matchmaker explaining why these two could work and what to watch.
- "talkingPoints": exactly 2 short, concrete prompts for the matchmaker's call with the client.
- "intro": an email body from the matchmaker to the client introducing the candidate. 70–100 words. Open with "Hi <client first name>,". Mention 2–3 specific, human details (work, interests, outlook) rather than a résumé. End with a light invitation to share thoughts, then "Warm regards," and the matchmaker's first name.
Return JSON with keys fit, talkingPoints, intro.`;

/** Strips contact details: the model gets what it needs and nothing more. */
function dossier(p: Profile) {
  return {
    firstName: p.firstName,
    age: calcAge(p.dateOfBirth),
    city: `${p.city}, ${p.country}`,
    role: `${p.designation} at ${p.company}`,
    education: `${p.degree}, ${p.college}${p.postGraduation ? `; ${p.postGraduation}` : ''}`,
    income: formatIncome(p.incomeLpa),
    height: formatHeight(p.heightCm),
    religionAndCommunity: `${p.religion}, ${p.caste}`,
    maritalStatus: p.maritalStatus,
    familyOutlook: `${p.familyValues}, ${p.familyType.toLowerCase()} family`,
    diet: p.diet,
    kids: p.wantKids,
    relocation: p.openToRelocate,
    intent: p.relationshipIntent,
    interests: p.interests,
    about: p.about,
  };
}

// Small in-memory cache: the same pair is requested by the card and the send modal.
const cache = new Map<string, { value: Insight; at: number }>();
const TTL_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 300;

export async function generateInsight(matchmakerName: string, seeker: Profile, match: MatchResult): Promise<Insight> {
  const key = `${matchmakerName}|${seeker.id}|${match.candidate.id}|${match.score}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  const userPrompt = JSON.stringify({
    matchmaker: matchmakerName,
    client: dossier(seeker),
    candidate: dossier(match.candidate),
    compatibility: {
      headline: match.headline,
      strengths: match.highlights,
      tensions: match.concerns,
      byFactor: match.factors.map((f) => `${f.label}: ${f.note}`),
    },
  });

  let value: Insight;
  try {
    const parsed = outputSchema.parse(await chatJson(SYSTEM, userPrompt));
    value = { ...parsed, talkingPoints: parsed.talkingPoints.slice(0, 2), source: 'ai' };
  } catch (err) {
    // Any failure (no key, timeout, malformed JSON) degrades to the template draft.
    if (process.env.NODE_ENV !== 'production') console.warn('[ai] falling back to template:', err instanceof Error ? err.message : err);
    value = templateInsight(matchmakerName, seeker, match);
  }

  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(key, { value, at: Date.now() });
  return value;
}

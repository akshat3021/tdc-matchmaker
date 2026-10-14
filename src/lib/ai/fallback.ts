/**
 * Deterministic drafts used when no LLM is configured or the call fails.
 * Built from the engine's own highlights so they stay specific to the pair,
 * and labelled `source: "template"` in the UI so nobody mistakes them for AI.
 */
import { calcAge, pronoun } from '@/lib/format';
import type { MatchResult } from '@/lib/matching';
import type { Profile } from '@/types';
import type { Insight } from './insight';

const strip = (note: string) => note.replace(/^[^:]+:\s*/, '');
const article = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a');
const INTENT_PHRASE: Record<Profile['relationshipIntent'], string> = {
  'Marriage within 12 months': 'hoping to marry within the next year',
  'Marriage in 1–2 years': 'hoping to marry in the next one to two years',
  'Open to the right person': 'open to the right person, with no fixed timeline',
};
/** "Age: 5 years younger" -> "age (5 years younger)" */
const shared = (h: string) => { const [label, ...rest] = h.split(':'); return `${label.toLowerCase()} (${rest.join(':').trim()})`; };

export function templateInsight(matchmakerName: string, seeker: Profile, match: MatchResult): Insight {
  const c = match.candidate;
  const they = pronoun(c);
  const best = match.highlights.slice(0, 2).map((h) => h.split(':')[0].toLowerCase());
  const concern = match.concerns[0];

  const fit =
    `${c.firstName} lines up with ${seeker.firstName} on ${best.join(' and ') || 'several fronts'}. ` +
    `${they[0].toUpperCase()}${they.slice(1)} is ${article(c.designation)} ${c.designation} at ${c.company} in ${c.city}, ` +
    `${INTENT_PHRASE[c.relationshipIntent]}.` +
    (concern ? ` Worth discussing early: ${concern.charAt(0).toLowerCase()}${concern.slice(1)}.` : '');

  const talkingPoints = [
    `Shared ground: ${match.highlights[0] ? shared(match.highlights[0]) : 'see the breakdown'}`,
    concern ? `Raise gently: ${strip(concern).toLowerCase()}` : `Ask what ${c.firstName} enjoys on a free weekend (${c.interests.slice(0, 2).join(', ').toLowerCase()})`,
  ];

  const intro =
    `Hi ${seeker.firstName},\n\n` +
    `I'd like to introduce you to ${c.firstName}, ${calcAge(c.dateOfBirth)}, ${article(c.designation)} ${c.designation} at ${c.company} in ${c.city}. ` +
    `Beyond the profile, ${c.firstName} enjoys ${c.interests.slice(0, 2).join(' and ').toLowerCase()}, and I noticed you two align on ${best.join(' and ') || 'what matters most'}.` +
    `${concern ? ` One thing worth a conversation: ${strip(concern).toLowerCase()}.` : ''}\n\n` +
    `Have a look and tell me what you think. If it feels right, I'll set up a first call.\n\nWarm regards,\n${matchmakerName.split(' ')[0]}`;

  return { fit, talkingPoints, intro, source: 'template' };
}

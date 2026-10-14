import type { Profile } from '@/types';

/** Whole years between a date of birth and `now`. */
export function calcAge(dateOfBirth: string, now: Date = new Date()): number {
  const dob = new Date(dateOfBirth);
  let age = now.getFullYear() - dob.getFullYear();
  const hadBirthday =
    now.getMonth() > dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}

/** 170 -> 5'7" (170 cm) */
export function formatHeight(cm: number): string {
  const totalInches = Math.round(cm / 2.54);
  return `${Math.floor(totalInches / 12)}'${totalInches % 12}" (${cm} cm)`;
}

/** 62 -> ₹62 LPA, 125 -> ₹1.25 Cr */
export function formatIncome(lpa: number): string {
  return lpa >= 100 ? `₹${parseFloat((lpa / 100).toFixed(2))} Cr` : `₹${lpa} LPA`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const fullName = (p: Pick<Profile, 'firstName' | 'lastName'>) => `${p.firstName} ${p.lastName}`;
export const initials = (p: Pick<Profile, 'firstName' | 'lastName'>) => `${p.firstName[0]}${p.lastName[0]}`;
export const pronoun = (p: Pick<Profile, 'gender'>) => (p.gender === 'Male' ? 'he' : 'she');

export function formatSiblings(s: Profile['siblings']): string {
  const parts: string[] = [];
  if (s.brothers) parts.push(`${s.brothers} brother${s.brothers > 1 ? 's' : ''}`);
  if (s.sisters) parts.push(`${s.sisters} sister${s.sisters > 1 ? 's' : ''}`);
  return parts.length ? parts.join(', ') : 'Only child';
}

export function formatLocation(p: Pick<Profile, 'city' | 'country'>): string {
  return p.country === 'India' ? p.city : `${p.city}, ${p.country}`;
}

/**
 * Domain model for the TDC matchmaker desk.
 * Every person (client or pool candidate) shares the `Profile` shape so the
 * matching engine can treat both sides symmetrically.
 */

export type Gender = 'Male' | 'Female';
export type YesNoMaybe = 'Yes' | 'No' | 'Maybe';
export type MaritalStatus = 'Never married' | 'Divorced' | 'Widowed';
export type Diet = 'Vegetarian' | 'Eggetarian' | 'Non-vegetarian' | 'Vegan' | 'Jain';
export type Manglik = 'Yes' | 'No' | 'Anshik' | 'Not applicable';
export type FamilyType = 'Nuclear' | 'Joint';
export type FamilyValues = 'Traditional' | 'Moderate' | 'Liberal';
export type Drinking = 'Never' | 'Socially' | 'Regularly';
export type Smoking = 'Never' | 'Occasionally' | 'Regularly';
export type EducationLevel =
  | "Bachelor's"
  | "Master's"
  | 'MBA'
  | 'Professional (MD / CA / LLB)'
  | 'Doctorate';
export type RelationshipIntent =
  | 'Marriage within 12 months'
  | 'Marriage in 1–2 years'
  | 'Open to the right person';
export type CommunityPreference = 'Same community preferred' | 'Open to all';
export type Industry =
  | 'Technology'
  | 'Consulting'
  | 'Finance'
  | 'Healthcare'
  | 'Law'
  | 'Business & Management'
  | 'Media & Design';

export interface Profile {
  id: string;
  // Core biodata
  firstName: string;
  lastName: string;
  gender: Gender;
  /** ISO date. Age is always derived, never stored, so it can't go stale. */
  dateOfBirth: string;
  country: string;
  city: string;
  heightCm: number;
  email: string;
  phone: string;
  college: string; // undergraduate
  degree: string;
  postGraduation?: string;
  educationLevel: EducationLevel;
  /** Annual income normalised to INR lakhs (LPA) so cross-border profiles compare. */
  incomeLpa: number;
  company: string;
  designation: string;
  industry: Industry;
  maritalStatus: MaritalStatus;
  languages: string[];
  siblings: { brothers: number; sisters: number };
  caste: string;
  religion: string;
  wantKids: YesNoMaybe;
  openToRelocate: YesNoMaybe;
  openToPets: YesNoMaybe;
  // Matrimonial-specific additions
  familyType: FamilyType;
  familyValues: FamilyValues;
  diet: Diet;
  manglik: Manglik;
  drinking: Drinking;
  smoking: Smoking;
  communityPreference: CommunityPreference;
  relationshipIntent: RelationshipIntent;
  partnerAgeMin: number;
  partnerAgeMax: number;
  // Narrative
  interests: string[];
  about: string;
  verified: boolean;
  verifiedOn: string;
}

export const CUSTOMER_STATUSES = [
  'New intake',
  'Profile verified',
  'Actively matching',
  'Match shared',
  'Meeting planned',
  'On pause',
] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export interface Customer extends Profile {
  matchmakerId: string;
  status: CustomerStatus;
  joinedOn: string;
  intakeNote: string;
}

export interface Matchmaker {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
}

export interface SessionUser {
  id: string;
  username: string;
  name: string;
}

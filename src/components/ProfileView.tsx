import type { ReactNode } from 'react';
import { calcAge, formatDate, formatHeight, formatIncome, formatLocation, formatSiblings } from '@/lib/format';
import type { Customer, YesNoMaybe } from '@/types';

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="block">
      <div className="block-head">
        <h3>{title}</h3>
        {hint && <p>{hint}</p>}
      </div>
      <dl className="facts">{children}</dl>
    </section>
  );
}

const GLYPH: Record<YesNoMaybe, string> = { Yes: '✓', No: '✕', Maybe: '~' };
function Stance({ value }: { value: YesNoMaybe }) {
  return (
    <span className={`stance stance-${value.toLowerCase()}`}>
      <b aria-hidden="true">{GLYPH[value]}</b>
      {value}
    </span>
  );
}

/** Read-only profile, laid out as a narrative rather than a form dump. */
export function ProfileView({ c }: { c: Customer }) {
  const age = calcAge(c.dateOfBirth);
  return (
    <div className="profile-grid">
      <div className="profile-main">
        <blockquote className="about">
          <p>{c.about}</p>
          <footer>Profile summary · verified {formatDate(c.verifiedOn)}</footer>
        </blockquote>

        <dl className="glance">
          <div><dt>Looking for</dt><dd>{c.relationshipIntent}</dd></div>
          <div><dt>Height</dt><dd>{formatHeight(c.heightCm)}</dd></div>
          <div><dt>Income</dt><dd>{formatIncome(c.incomeLpa)}</dd></div>
          <div><dt>Education</dt><dd>{c.educationLevel}</dd></div>
        </dl>

        <Section title="Background">
          <Fact label="Date of birth">{formatDate(c.dateOfBirth)} ({age})</Fact>
          <Fact label="Gender">{c.gender}</Fact>
          <Fact label="Lives in">{formatLocation(c)}</Fact>
          <Fact label="Marital status">{c.maritalStatus}</Fact>
          <Fact label="Languages">{c.languages.join(', ')}</Fact>
          <Fact label="Siblings">{formatSiblings(c.siblings)}</Fact>
          <Fact label="Religion">{c.religion}</Fact>
          <Fact label="Caste / community">{c.caste}</Fact>
        </Section>

        <Section title="Career and education">
          <Fact label="Current company">{c.company}</Fact>
          <Fact label="Designation">{c.designation}</Fact>
          <Fact label="Industry">{c.industry}</Fact>
          <Fact label="Income">{formatIncome(c.incomeLpa)} per year</Fact>
          <Fact label="Undergraduate college">{c.college}</Fact>
          <Fact label="Degree">{c.degree}</Fact>
          {c.postGraduation && <Fact label="Postgraduate">{c.postGraduation}</Fact>}
          <Fact label="Education level">{c.educationLevel}</Fact>
        </Section>

        <Section title="Family and culture" hint="What families usually ask about first.">
          <Fact label="Family type">{c.familyType}</Fact>
          <Fact label="Family outlook">{c.familyValues}</Fact>
          <Fact label="Diet">{c.diet}</Fact>
          <Fact label="Manglik">{c.manglik}</Fact>
          <Fact label="Community preference">{c.communityPreference}</Fact>
        </Section>

        <Section title="Life together" hint="Where views need to line up.">
          <Fact label="Wants kids"><Stance value={c.wantKids} /></Fact>
          <Fact label="Open to relocate"><Stance value={c.openToRelocate} /></Fact>
          <Fact label="Open to pets"><Stance value={c.openToPets} /></Fact>
          <Fact label="Drinking">{c.drinking}</Fact>
          <Fact label="Smoking">{c.smoking}</Fact>
          <Fact label="Interests">{c.interests.join(', ')}</Fact>
        </Section>
      </div>

      <aside className="profile-aside">
        <section className="aside-block">
          <h4>Partner preferences</h4>
          <dl className="facts facts-tight">
            <Fact label="Age range">{c.partnerAgeMin}–{c.partnerAgeMax} years</Fact>
            <Fact label="Timeline">{c.relationshipIntent}</Fact>
            <Fact label="Community">{c.communityPreference}</Fact>
          </dl>
        </section>
        <section className="aside-block">
          <h4>Contact</h4>
          <dl className="facts facts-tight">
            <Fact label="Email"><a href={`mailto:${c.email}`}>{c.email}</a></Fact>
            <Fact label="Phone">{c.phone}</Fact>
          </dl>
        </section>
        <section className="aside-block aside-note">
          <h4>From the intake call</h4>
          <p>{c.intakeNote}</p>
          <small>Joined {formatDate(c.joinedOn)}</small>
        </section>
      </aside>
    </div>
  );
}

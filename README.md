# TDC Matchmaker Desk

Internal MVP for The Date Crew: matchmakers sign in, see only their own clients, review verified profiles, get ranked and explained match suggestions, and send introductions.

## Run locally

```bash
npm install
cp .env.example .env.local     # optional for local dev (a dev-only secret is used if missing)
npm run dev                    # http://localhost:3000
```

**Sample logins** (password for both: `Welcome@TDC26`)

| Username | Matchmaker       | Clients |
|----------|------------------|---------|
| `priya`  | Priya Raghavan   | 7       |
| `arjun`  | Arjun Malhotra   | 7       |

Other commands: `npm test` (matching engine), `npm run typecheck`, `npm run lint`, `npm run seed` (regenerate demo data, deterministic).

## Deploy (Vercel)

1. Import the repo into Vercel (framework auto-detected).
2. Set environment variables: `AUTH_SECRET` (**required**, `openssl rand -base64 48`), `OPENAI_API_KEY` (optional), `SHOW_DEMO_CREDENTIALS=true` (shows logins on the sign-in page; remove for a real deployment).
3. Deploy. Render/Netlify also work: `npm run build` / `npm start`.

| Variable | Required | Purpose |
|---|---|---|
| `AUTH_SECRET` | prod | Signs session cookies. The app refuses to start sessions in production without it. |
| `OPENAI_API_KEY` | no | Enables LLM-written fit reasoning and intro drafts. Without it, labelled template drafts are used. |
| `OPENAI_MODEL` | no | Defaults to `gpt-4o-mini`. |
| `SHOW_DEMO_CREDENTIALS` | no | Shows sample logins on the login screen. |

## Architecture

```
src/
  middleware.ts            First auth gate: pages redirect, /api returns 401
  app/                     Routes (server components) + route handlers under api/
  components/              UI; client components only where state is needed
  lib/
    auth/                  JWT session (jose), login rate limit
    data/repository.ts     ONLY file that knows data is static JSON; also enforces ownership
    matching/              factors.ts (pure scoring) · profiles.ts (weights per gender) · engine.ts (filter, score, rank, explain)
    ai/                    openai.ts (client) · insight.ts (prompt + validation + cache) · fallback.ts (template drafts)
    api.ts                 route() wrapper: session check, CSRF origin check, error envelope
    mail.ts                Mail boundary (simulated)
  data/                    Generated JSON: 14 clients, 240 candidates (120 women, 120 men), 2 matchmakers
```

Request flow for matches: `GET /api/customers/:id/matches` → session → ownership check → opposite-gender pool → hard filters → weighted factors → ranked results with per-factor notes (contact details stripped). `POST /api/ai/insight` adds the LLM read; `POST /api/matches/send` validates and simulates the email.

### Data model

`Profile` (shared by clients and pool candidates): the required biodata fields plus **familyType, familyValues, diet, manglik, drinking, smoking, communityPreference, relationshipIntent, partnerAgeMin/Max, educationLevel, postGraduation, interests, about**. `Customer = Profile + matchmakerId, status, joinedOn, intakeNote`. Age is derived from `dateOfBirth`; income is normalised to INR lakhs (LPA) so cross-border profiles compare. See `src/types/index.ts`.

## Matching logic

1. **Hard filters (never shown):** same gender; either person outside the other's stated partner age range; a firm *yes* against a firm *no* on kids.
2. **Weighted factors** (each returns 0–1 plus a plain-English note), combined with weights that are normalised, then squared so tiers separate (≥82 High potential, ≥70 Strong fit, otherwise Worth exploring).
   - **Male clients** (`maleSeekerProfile`): age (younger) 18, kids 14, height (shorter) 12, income (less or similar) 12, location 10, community 10, family outlook 8, lifestyle 6, timeline 6, languages 2, manglik 2.
   - **Female clients** (`femaleSeekerProfile`, values-first): family outlook 14, location & relocation 14, kids 12, life stage & intent 10, lifestyle 10, career 10, education 8, community 8, earning level 6, age (same to older) 6, height 3, languages 2, manglik 2.
3. To extend: write a function in `factors.ts`, add it with a weight in `profiles.ts`. To add a new recipe (e.g. for second marriages), export another `MatchProfile`.

## How AI is used

The engine decides *who* fits and by how much, which keeps scores auditable. The LLM then explains *why*, in a matchmaker's voice: a 2–3 sentence read with one honest tension, two talking points for the call, and a personalised intro email (70–100 words) that feeds the Send Match modal. The model receives a dossier with contact details removed, output is validated with Zod, and any failure (no key, timeout, bad JSON) falls back to a clearly labelled template draft built from the same match data.

## Security notes

httpOnly, SameSite=Lax, Secure (prod) JWT cookie, 8h expiry · bcrypt (cost 12) with decoy compare to blunt username enumeration · login rate limiting · Zod validation on all inputs · ownership checks on every client/candidate lookup (other matchmakers' clients return 404) · Origin check on state-changing requests · secrets only from env · generic errors, no stack traces · security headers · candidate emails/phones never sent to the browser · `noindex`.

## Assumptions and known limits

- **Persistence:** notes, status changes and "sent" records live in the browser's localStorage because serverless hosting has no writable disk. `lib/client-store.ts` maps directly onto three DB tables. Production needs a database (Postgres/Supabase/Firestore) behind `repository.ts`.
- **Email is simulated** (`lib/mail.ts`); swap in Resend/SES there.
- The login rate limiter is in-memory (per instance); use Redis/Upstash when scaling out.
- Profiles are synthetic and generated by `scripts/generate-data.mjs`; the pool never contains real people.
- The male-client rules (younger, earns less, shorter) come from the brief. They are encoded as soft, tunable weights, not absolute rules, except the stated age ranges and the kids dealbreaker.
- Matching is O(pool × factors). For 100k+ profiles, pre-filter with the hard filters in SQL and score only the top candidates.

## Write-up (for the submission email)

**Tech choices.** Next.js 14 (App Router) with TypeScript gives one deployable unit for UI and API on Vercel. Data sits behind a repository interface over generated JSON (14 clients, 240 verified candidates), so a real database is a one-file swap. Auth is a signed JWT in an httpOnly cookie, enforced in middleware and again in every route handler along with per-matchmaker ownership checks; inputs are validated with Zod. Styling is hand-written CSS with design tokens: Newsreader for people and headings, Hanken Grotesk for the interface, and a restrained spruce and wine palette, to feel like a premium, calm internal tool rather than a SaaS template.

**Matching logic.** A pair must first pass hard filters (opposite gender, both partner age ranges, no firm kids conflict). Remaining candidates are scored on weighted factors that each return a score and a human-readable note. Male clients use the brief's explicit preferences (younger, earns less or similar, shorter or similar, kids alignment) as the heaviest weights. Female clients use a values-first recipe led by family outlook, relocation and life-stage readiness, then career, education and lifestyle. Weights, filters and factors are plain data, so the team can tune or add recipes without touching the engine.

**AI usage and assumptions.** The deterministic engine ranks and the LLM explains: each match gets a matchmaker-style read with one honest tension and talking points, and the Send Match modal pre-drafts a personalised intro the matchmaker can edit. Contact details are never sent to the model, output is schema-validated, and a labelled template fallback keeps the product usable without a key. Assumptions: income is normalised to INR LPA, notes and status persist in localStorage for the demo, and email sending is simulated.

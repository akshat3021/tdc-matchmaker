# TDC Matchmaker Desk

Internal MVP for The Date Crew: matchmakers sign in, see only their own clients, review verified profiles, get ranked and explained match suggestions, and send introductions.

## Run Locally

### Prerequisites

- Node.js and npm
- An OpenAI API key (optional; the application uses template-based fallbacks when no key is configured)

### Installation

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env.local
```

This step is optional for local development if the application supports its development-only fallback secret. For production, configure a secure `AUTH_SECRET`.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Accounts

The following demo accounts are available for local testing:

| Username | Matchmaker | Clients |
|---|---|---:|
| `priya` | Priya Raghavan | 7 |
| `arjun` | Arjun Malhotra | 7 |

**Demo password:** `Welcome@TDC26`

These credentials are intended for demo use only. Do not reuse them for real accounts or production deployments.

### Available Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the application for production |
| `npm start` | Start the production server |
| `npm test` | Run matching-engine tests |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Run linting |
| `npm run seed` | Regenerate deterministic demo data |

## Deployment

The application is designed for deployment on Vercel. Other Node.js-compatible hosting platforms may also work, depending on their runtime and storage requirements.

### Deploy on Vercel

1. Import the GitHub repository into Vercel.
2. Configure the required environment variables.
3. Deploy the application.
4. Verify authentication, profile access, matching, and introduction workflows.

### Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `AUTH_SECRET` | Yes, in production | Signs session cookies. Use a strong, randomly generated secret. |
| `OPENAI_API_KEY` | No | Enables AI-generated match explanations and introduction drafts. |
| `OPENAI_MODEL` | No | Selects the OpenAI model. Defaults to `gpt-4o-mini`. |
| `SHOW_DEMO_CREDENTIALS` | No | Controls whether demo login credentials are displayed on the sign-in page. |

Generate a production secret with:

```bash
openssl rand -base64 48
```

Never commit `.env.local`, API keys, production secrets, or real customer data to Git.

For production, disable the display of demo credentials and use secure, unique account credentials.

## Architecture

```text
src/
  middleware.ts
  app/
    api/
  components/
  lib/
    auth/
    data/
      repository.ts
    matching/
      factors.ts
      profiles.ts
      engine.ts
    ai/
      openai.ts
      insight.ts
      fallback.ts
    api.ts
    mail.ts
  data/

scripts/
  generate-data.mjs
```

### Main Components

- **Middleware:** Provides an initial authentication gate. Pages redirect unauthenticated users, while API routes return unauthorized responses.
- **Application routes:** Contain the UI and API route handlers.
- **Components:** Provide the interface, using client-side components where interaction or local state is required.
- **Authentication:** Manages JWT-based sessions and login rate limiting.
- **Data repository:** Centralizes access to the current static JSON data source and enforces ownership checks.
- **Matching engine:** Applies hard filters, calculates weighted scores, ranks candidates, and explains the results.
- **AI layer:** Generates match insights and personalized introduction drafts, with schema validation and fallback templates.
- **Mail boundary:** Simulates email delivery and provides a boundary for integrating a real email provider.
- **Generated data:** Contains synthetic demo profiles for 14 clients, 240 candidates (120 women and 120 men), and two matchmakers.

### Match Request Flow

```text
Matchmaker signs in
        |
        v
Opens an assigned client
        |
        v
GET /api/customers/:id/matches
        |
        v
Session and ownership checks
        |
        v
Hard filters and weighted scoring
        |
        v
Ranked match suggestions
        |
        v
AI-generated explanation (optional)
        |
        v
Review and edit introduction
        |
        v
POST /api/matches/send
        |
        v
Simulated email delivery
```

The matching engine determines which candidates qualify and how they rank. The AI layer explains the results and drafts introductions. Candidate contact details are excluded from the AI dossier.

## Data Model

The shared `Profile` model contains biodata and matching preferences, including:

- Family type and family values
- Diet, drinking, smoking, and manglik preferences
- Community preferences
- Relationship intent
- Preferred partner age range
- Education level and postgraduate education
- Interests and personal description

`Customer` extends `Profile` with matchmaker ownership, status, joining date, and intake notes.

Age is derived from date of birth. Income is normalized to Indian rupees in lakhs per annum (LPA) so profiles can be compared consistently.

Refer to `src/types/index.ts` for the implementation of the data types.

## Matching Logic

The matching engine uses two stages: hard filtering and weighted scoring.

### 1. Hard Filters

Candidates are excluded when they fail essential compatibility requirements:

- The candidate has the same gender as the client.
- Either person's age falls outside the other person's stated partner-age range.
- One person firmly wants children while the other firmly does not.

These filters are applied before candidates are ranked.

### 2. Weighted Compatibility Scoring

Each matching factor returns a normalized score between 0 and 1, along with a plain-English explanation.

The weighted scores are combined and transformed to separate compatibility tiers:

| Score | Compatibility tier |
|---|---|
| 82 and above | High potential |
| 70–81.99 | Strong fit |
| Below 70 | Worth exploring |

### Male Client Matching Profile

The male-client matching profile uses the following weights:

| Factor | Weight |
|---|---:|
| Age (younger) | 18 |
| Children preferences | 14 |
| Height (shorter) | 12 |
| Income (less or similar) | 12 |
| Location | 10 |
| Community | 10 |
| Family outlook | 8 |
| Lifestyle | 6 |
| Relationship timeline | 6 |
| Languages | 2 |
| Manglik | 2 |

### Female Client Matching Profile

The female-client profile follows a values-first approach:

| Factor | Weight |
|---|---:|
| Family outlook | 14 |
| Location and relocation | 14 |
| Children preferences | 12 |
| Life stage and relationship intent | 10 |
| Lifestyle | 10 |
| Career | 10 |
| Education | 8 |
| Community | 8 |
| Earning level | 6 |
| Age (same to older) | 6 |
| Height | 3 |
| Languages | 2 |
| Manglik | 2 |

The weights reflect the project brief and are tunable configuration values, rather than universal rules for relationship compatibility.

### Extending the Matching Engine

To introduce a new compatibility factor:

1. Implement the scoring function in `factors.ts`.
2. Add the factor and its weight to the relevant profile in `profiles.ts`.
3. Add or update tests for the new behavior.
4. Adjust the weights and thresholds as needed.

Additional matching profiles, such as profiles designed for second marriages, can be introduced without rewriting the core scoring engine.

## How AI Is Used

The deterministic matching engine decides which profiles qualify and calculates their compatibility scores. The language model adds explanations and communication support.

For each match, the AI layer can generate:

- A two- to three-sentence compatibility summary in a matchmaker's voice.
- An honest discussion of a potential compatibility concern.
- Two talking points for the matchmaker's conversation.
- A personalized introduction email of approximately 70–100 words.

The introduction is provided as a draft that the matchmaker can review and edit.

### AI Reliability and Privacy

- Contact details are removed from the dossier sent to the model.
- AI output is validated with Zod.
- Failures such as a missing API key, timeout, or invalid JSON trigger a clearly labelled template fallback.
- The matching engine remains responsible for scoring and ranking candidates.

AI-generated explanations supplement the matching logic; they do not replace its compatibility filters or scoring rules.

## Security

The application includes several security measures:

- JWT session cookies with `httpOnly`, `SameSite=Lax`, and `Secure` in production.
- Eight-hour session expiry.
- Password hashing with bcrypt using a cost factor of 12.
- Login rate limiting and a decoy password comparison to reduce username-enumeration signals.
- Zod validation for inputs.
- Ownership checks for client and candidate lookups.
- Unauthorized access to another matchmaker's clients returns a 404 response.
- Origin checks for state-changing requests.
- Environment-based secret configuration.
- Generic error responses without stack traces.
- Security headers and `noindex` directives.
- Removal of candidate email addresses and phone numbers from browser-facing match data.

These controls should be reviewed and tested before the application is used with real customer information.

## Current Limitations and Future Improvements

### Persistence

Notes, status changes, and sent-match records currently use browser `localStorage`. This supports the demo but is not suitable for reliable multi-user production workflows.

The repository abstraction provides a boundary for replacing the current static JSON source with a persistent database. A production implementation should use a database such as PostgreSQL, Supabase, or Firestore, with appropriate authorization and access controls.

### Email Delivery

Email delivery is currently simulated through `lib/mail.ts`. A production implementation could integrate a provider such as Resend or Amazon SES.

### Rate Limiting

The login rate limiter is in-memory and operates per application instance. A distributed solution such as Redis or Upstash would be more appropriate when scaling across instances.

### Synthetic Data

All demo profiles are synthetic and generated by `scripts/generate-data.mjs`. The candidate pool is not intended to contain real people.

### Matching Assumptions

Some preferences in the male-client profile, such as younger age, lower or similar income, and shorter height, come from the project brief. They are implemented as tunable weighted preferences rather than absolute filters, except where an explicit hard filter applies.

The compatibility results are decision-support suggestions, not guarantees of relationship success.

### Scaling

The current matching approach has computational complexity proportional to the candidate pool size multiplied by the number of matching factors.

For a much larger candidate pool, hard filtering could be performed in the database before scoring the remaining candidates.

## Project Write-up

### Technology Choices

The project uses Next.js App Router and TypeScript to provide a unified application for the user interface and API routes. The current data repository uses generated JSON, allowing a future database implementation to be introduced behind the repository boundary.

Authentication uses signed JWTs in HTTP-only cookies, with middleware checks and route-level authorization. Inputs are validated using Zod.

The interface uses custom CSS and design tokens, with Newsreader for headings and people-focused content and Hanken Grotesk for the interface. The restrained spruce and wine color palette is intended to create a premium, calm internal tool rather than a generic SaaS template.

### Matching Logic

Candidates must pass hard filters for gender, mutual age-range compatibility, and firm disagreements about having children.

Eligible candidates are then scored using weighted factors that return normalized scores and human-readable explanations. The male-client profile reflects the preferences specified in the project brief, while the female-client profile prioritizes family outlook, relocation, life stage, career, education, and lifestyle.

The scoring factors, weights, and profiles are configurable so that the team can refine the matching approach without rewriting the engine.

### AI Usage and Assumptions

The deterministic engine ranks candidates, while the AI layer explains compatibility and drafts personalized introductions that matchmakers can review and edit.

Contact details are excluded from AI requests, generated output is schema-validated, and labelled template drafts provide a fallback when AI generation is unavailable.

The current demo uses synthetic profiles, local browser storage for certain workflow changes, and simulated email delivery. These components would need production-grade persistence, email integration, and operational safeguards before handling real customer data.

---

**TDC Matchmaker Desk** is a demonstration of a matchmaker-focused workflow combining profile management, explainable compatibility scoring, AI-assisted communication, and access-control considerations in a single web application.
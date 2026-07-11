# Charly — system design

One-page mental model for the morning. Everything lives in one Next.js 16 app;
AI runs on DigitalOcean; persistence is a JSON file.

## The big picture

```
                       ┌────────────────────────────────────────────┐
                       │        Next.js app (App Router, TS)        │
  Browser ────────────▶│                                            │
                       │  Pages (server components)                 │
   /            landing│  /join      survey (client stepper)       │
   /signin      auth   │  /profile   account page                  │
   /groups/[id] crews  │  /orgs/[id] Org HQ                        │
   /dashboard   charts │                                            │
                       │  API routes (route handlers)               │
                       │  /api/survey   followup + complete        │
                       │  /api/plan     crew action plans          │
                       │  /api/copilot  org ops copilot            │
                       │  /api/events   create/signup/log          │
                       │  /api/auth/*   google oauth + guest      │
                       └───────┬──────────────┬─────────────┬──────┘
                               │              │             │
                    ┌──────────▼───┐   ┌──────▼──────┐   ┌──▼──────────────┐
                    │ DigitalOcean │   │ data/*.json │   │ DataSF (SODA)   │
                    │ AI (3 tiers) │   │ file store  │   │ SF311 open data │
                    └──────────────┘   └─────────────┘   └─────────────────┘
```

## The AI layer — three tiers, per call site

Every AI call resolves through `src/lib/do-ai.ts` → `resolveAgent(role)`:

1. **Agent Platform agent** (if `<ROLE>_ENDPOINT`/`<ROLE>_KEY` set) — a dedicated
   DO-hosted agent with its own HTTPS endpoint, OpenAI-compatible
   (`{endpoint}/api/v1/chat/completions`, `model: "n/a"`). Agents can carry a
   **knowledge base** → real RAG with citations (`include_retrieval_info`).
2. **Serverless inference** (if `DIGITAL_OCEAN_MODEL_ACCESS_KEY` set — ✅ live) —
   direct model calls to `https://inference.do-ai.run/v1/`, system prompt inlined
   from `src/lib/prompts.ts`.
3. **Mock** — deterministic canned output so the demo never dies.

### The three agent roles (each gets its own endpoint)

| Role | Job | Model idea | KB (RAG)? |
|---|---|---|---|
| `charly` | mascot persona, member-facing tone | Claude Sonnet | no |
| `planner` | organizing logistics → 2-week crew action plans | Claude Sonnet | yes — `charly-orgs` |
| `scout` | org discovery/info; powers the Org HQ copilot | cheap (Llama/Haiku) | yes — `charly-orgs` |

Cheap model (`llama3.3-70b-instruct`) also runs three inference-only jobs:
survey follow-up question, profile summary, interest→crew classifier
(`src/lib/matching.ts`).

Provision agents without the console: `node scripts/provision-do-agents.mjs`
(needs `DIGITALOCEAN_API_TOKEN`; KB file upload stays a console step). See SETUP.md.

## Member flow (the demo spine)

```
/signin (google oauth or guest → HMAC cookie, src/lib/auth.ts)
   │
/join  survey: causes ▸ styles ▸ time ▸ AI follow-up (cheap model writes ONE
   │   personalized question)            [/api/survey action=followup]
   ▼
complete: cheap model → interests + summary; classifier → crew
   │   member saved to state             [/api/survey action=complete]
   ▼
crew reveal → /groups/[id]: members, partner orgs, event callouts ("I'm in"
   signup), action plan button           [/api/plan]
   ▼
/profile: avatar, crew card, interests, signups, retake survey
```

## Org flow (the second persona)

`/orgs/[id]` (Org HQ): post recruiting events → events appear as **crew
callouts** on matching group pages; rosters + log notes = lightweight
recordkeeping; **ops copilot** (`/api/copilot`, scout role) answers questions
over live records (records are inlined; the KB adds RAG background on orgs).

## Civic data (DataSF)

`src/lib/sfdata.ts` pulls SF311 cases (dataset `vw6y-z8j6`) via the public SODA
API — top request categories mapped to crews + encampment/cleaning hotspots by
neighborhood. 30-min in-memory cache, bundled snapshot fallback
(`data/sf311-snapshot.json`). Surfaces:
- **Dashboard**: "City pulse" chart — where SF actually needs hands
- **Planner prompt**: real numbers injected so action plans cite live city data

## Persistence

`data/state.json` (gitignored) — seeded on first read from `seed-members.json` +
`seed-events.json`. Shape: `{ members[], plans{groupId→plan}, events[] }`.
Static catalogs: `groups.json` (6 crews), `orgs.json` (20 partner orgs — also
the knowledge-base source). **Delete state.json to reset the demo.**

## Auth

Hand-rolled, no deps (`src/lib/auth.ts`): Google OAuth code flow
(`/api/auth/google` → `/api/auth/callback`) or guest name → session JSON in an
HMAC-signed `charly-session` cookie. `googleConfigured()` toggles the button.

## Key files

```
src/lib/do-ai.ts      agent resolution + clients        src/lib/prompts.ts   all system prompts
src/lib/matching.ts   classifier + keyword fallback     src/lib/survey.ts    survey options/shape
src/lib/store.ts      JSON state I/O                    src/lib/auth.ts      sessions
src/lib/sfdata.ts     DataSF/311 pulse                  scripts/provision-do-agents.mjs
src/components/CharlyMascot.tsx   swaps to public/charly.gif automatically
```

## Env matrix (.env.local)

| Var | Powers | Status |
|---|---|---|
| `DIGITAL_OCEAN_MODEL_ACCESS_KEY` | all serverless inference | ✅ set |
| `CHARLY_/PLANNER_/SCOUT_ENDPOINT+KEY` | tier-2 agents + RAG | pending |
| `GOOGLE_CLIENT_ID/SECRET`, `AUTH_SECRET` | oauth | pending |

## Judging talking points

Three dedicated DO agents (own endpoints) + knowledge-base RAG with visible
citations + serverless inference for cheap adaptive UX + real civic data
grounding the plans + graceful degradation at every call site.

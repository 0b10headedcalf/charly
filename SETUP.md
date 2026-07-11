# DigitalOcean + auth setup

The app has tiers and works at every one — do them in order, stop when out of time:

| Tier | What you get | What you need |
|---|---|---|
| 0 | Demo mode: canned survey follow-up, template plans/copilot | nothing |
| 1 ✅ | Live survey AI, live plans, live classifier, live copilot | 1 model access key (**already done**) |
| 2 | Dedicated **Agent Platform agents** + **knowledge-base RAG** with citations | 3 agents + 1 KB |
| 3 | Google OAuth sign-in (guest mode always works) | 1 Google OAuth client |

## Tier 1 — model access key ✅ (done — key in `.env.local`)

Console → **INFERENCE** → **Manage** → **Create model access key** → paste as
`DIGITAL_OCEAN_MODEL_ACCESS_KEY`. All calls go to the OpenAI-compatible endpoint
`https://inference.do-ai.run/v1/`.

## Tier 2 — the three agents + knowledge base

Charly uses three separate agents, each with **its own endpoint and access key**:

| Agent | Job | Env vars |
|---|---|---|
| `charly` | member-facing persona | `CHARLY_ENDPOINT` / `CHARLY_KEY` |
| `planner` | organizing logistics → group action plans | `PLANNER_ENDPOINT` / `PLANNER_KEY` |
| `scout` | org discovery/info + Org HQ copilot, **RAG** over the orgs KB | `SCOUT_ENDPOINT` / `SCOUT_KEY` |

### Option A — scripted (no web console)

```bash
# console → API → Generate New Token (write scope) — the only console visit
export DIGITALOCEAN_API_TOKEN=dop_v1_...
node scripts/provision-do-agents.mjs
```

The script creates all three agents + access keys + an empty `charly-orgs`
knowledge base attached to planner & scout, then prints ready-to-paste
`.env.local` lines. **One console step remains:** open the knowledge base →
add data source → upload `data/orgs.json` → wait for indexing.

### Option B — console clicks

Console → **INFERENCE** → **Agent Platform**:
1. **Knowledge base**: create `charly-orgs` → data source: file upload → `data/orgs.json` → wait for indexing.
2. Create each agent from the table above. Instructions to paste: `CHARLY_SYSTEM_PROMPT`, `PLANNER_SYSTEM_PROMPT`, `ORG_COPILOT_SYSTEM_PROMPT` from `src/lib/prompts.ts` respectively. Attach the KB to `planner` and `scout` (Resources tab).
3. Per agent: Endpoint → make available + create access key → copy endpoint + key into `.env.local`.

Restart the dev server after. The copilot and plan footers will switch from
"serverless inference" to "agent + knowledge base" with RAG citations.

## Tier 3 — Google OAuth

1. [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services →
   **OAuth consent screen** (External, add yourself as test user) → **Credentials** →
   Create Credentials → OAuth client ID → Web application:
   - Authorized JavaScript origin: `http://localhost:3000`
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback`
2. Put `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (+ random `AUTH_SECRET`) in `.env.local`, restart.
3. The "Continue with Google" button appears on `/signin` automatically.
   Guest sign-in (name only) always works, so the demo never blocks on this.

## Judging story cheat-sheet

- **Three Agent Platform agents** (own endpoints): persona / logistics / RAG org scout.
- **Knowledge base RAG**: scout + planner cite `orgs.json` retrievals (`include_retrieval_info`).
- **Serverless inference**: cheap model (`llama3.3-70b-instruct`) powers the adaptive
  welcome-survey question, profile summary, and interest→crew classifier.
- Graceful degradation: agent → inference → deterministic mock at every call site.
- Reset demo data: delete `data/state.json`.

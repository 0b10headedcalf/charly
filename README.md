# Charly 🧡

**Find your people. Fix your corner of the world.**

Charly is a grassroots community-organizing platform built for the MLH **AI for
Social Good** hackathon. Charli, the mascot agent, chats with new members about
what they care about, an AI matcher sorts them into neighborhood volunteer
crews, and a planner agent drafts each crew's next two weeks in coordination
with real local aid organizations.

## Powered by DigitalOcean Gradient AI

| Feature | Where |
|---|---|
| **Agent Platform agent** (Charli persona, structured matching output) | onboarding chat |
| **Agent Platform agent + Knowledge Base RAG** (org data, retrieval citations) | crew action plans |
| **Serverless inference** (`llama3.3-70b-instruct`) | interest → crew classification |

Every AI call degrades gracefully: console agent → serverless inference →
deterministic demo mode, so the app runs even with zero keys configured.

## Run it

```bash
npm install
cp .env.example .env.local   # optional — add DigitalOcean keys (see SETUP.md)
npm run dev                  # http://localhost:3000
```

See **SETUP.md** for the 15-minute DigitalOcean console setup (model access
key, agents, knowledge base).

## Tour

- `/` — the neighborhood board: crews pinned as flyers
- `/chat` — meet Charli, get matched into a crew
- `/groups/<id>` — crew page: members, partner orgs, AI action plan
- `/dashboard` — community board: live matching + capacity charts

## Stack

Next.js 16 (App Router) · Tailwind 4 · Recharts · OpenAI SDK pointed at
DigitalOcean's OpenAI-compatible endpoints · JSON file store (hackathon-grade
persistence, no DB required).

> 🎨 Mascot note: `src/components/CharliMascot.tsx` is placeholder SVG art —
> swap in the hand-drawn Charli when ready.

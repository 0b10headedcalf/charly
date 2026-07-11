#!/usr/bin/env node
/**
 * Provision Charly's three DigitalOcean Agent Platform agents from the CLI —
 * no web console needed (except one optional knowledge-base file upload).
 *
 * Usage:
 *   export DIGITALOCEAN_API_TOKEN=dop_v1_...   # console → API → Generate New Token (write scope)
 *   node scripts/provision-do-agents.mjs
 *
 * Creates: charli (survey persona), planner (organizing logistics),
 * scout (org info / RAG) + an access key for each, prints .env.local lines.
 * Also creates an empty knowledge base and attaches it to scout + planner;
 * uploading data/orgs.json into it is the one step left for the console.
 */

const API = "https://api.digitalocean.com/v2";
const TOKEN = process.env.DIGITALOCEAN_API_TOKEN;
if (!TOKEN) {
  console.error("Set DIGITALOCEAN_API_TOKEN first (console → API → Generate New Token).");
  process.exit(1);
}

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = {};
  try { json = JSON.parse(text); } catch { /* empty */ }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Keep in sync with src/lib/prompts.ts (which stays the source of truth for
// the inference-fallback path).
const AGENTS = [
  {
    envPrefix: "CHARLI",
    name: "charly-charli",
    description: "Charli persona: member-facing conversation for Charly",
    wantModel: /claude.*(sonnet|haiku)/i,
    instruction:
      "You are Charli, the warm, slightly goofy flame-heart mascot of Charly, a grassroots volunteering platform in San Francisco. Be brief, playful, encouraging; 1-3 short sentences per reply. Help neighbors figure out how they want to help their community.",
    attachKb: false,
  },
  {
    envPrefix: "PLANNER",
    name: "charly-planner",
    description: "Community organizing logistics: 2-week action plans",
    wantModel: /claude.*sonnet/i,
    instruction:
      "You are the coordination planner for Charly, a grassroots volunteering platform in San Francisco. Given a volunteer group and local partner organizations (from your knowledge base), produce a practical 2-week action plan in markdown with sections: ## This Week, ## Next Week, ## Who We Need. Be specific and actionable, reference only real organizations from your knowledge base, keep it under 300 words.",
    attachKb: true,
  },
  {
    envPrefix: "SCOUT",
    name: "charly-scout",
    description: "Org discovery & info with RAG over the orgs knowledge base",
    wantModel: /llama|claude.*haiku/i,
    instruction:
      "You are the org scout and operations copilot for Charly, a grassroots volunteering platform in San Francisco. Answer questions about partner aid organizations using your knowledge base, and about an organization's live records (events, signups, log notes) when they are provided in the prompt. Be concise and practical; never invent volunteers, orgs, dates, or numbers.",
    attachKb: true,
  },
];

console.log("Looking up models, project, and region…");
const models = (await call("GET", "/gen-ai/models?per_page=200")).models ?? [];
const project =
  ((await call("GET", "/projects?per_page=200")).projects ?? []).find((p) => p.is_default) ??
  (await call("GET", "/projects?per_page=200")).projects?.[0];
if (!project) throw new Error("No DO project found on this account.");

let region = "tor1";
try {
  const regions = (await call("GET", "/gen-ai/regions")).regions ?? [];
  if (regions.length) region = regions[0].region ?? regions[0].name ?? region;
} catch { /* keep default */ }

function pickModel(re) {
  const chat = models.filter((m) => !/embed/i.test(m.name ?? ""));
  return chat.find((m) => re.test(m.name ?? "")) ?? chat[0];
}

// Optional knowledge base (attached to scout + planner).
let kbUuid = null;
try {
  const embedding = models.find((m) => /embed/i.test(m.name ?? ""));
  const kb = await call("POST", "/gen-ai/knowledge_bases", {
    name: "charly-orgs",
    project_id: project.id,
    region,
    ...(embedding ? { embedding_model_uuid: embedding.uuid } : {}),
  });
  kbUuid = kb.knowledge_base?.uuid ?? kb.uuid ?? null;
  console.log(`Knowledge base charly-orgs created (${kbUuid}).`);
  console.log("→ One console step left: open it and upload data/orgs.json, then wait for indexing.");
} catch (e) {
  console.warn(`Knowledge base creation failed (${e.message}) — create it in the console instead (SETUP.md).`);
}

const envLines = [];
for (const spec of AGENTS) {
  const model = pickModel(spec.wantModel);
  console.log(`\nCreating agent ${spec.name} (model: ${model?.name})…`);
  const created = await call("POST", "/gen-ai/agents", {
    name: spec.name,
    description: spec.description,
    instruction: spec.instruction,
    model_uuid: model.uuid,
    project_id: project.id,
    region,
    ...(spec.attachKb && kbUuid ? { knowledge_base_uuid: [kbUuid] } : {}),
  });
  const uuid = created.agent?.uuid ?? created.uuid;

  // wait for deployment + grab endpoint url
  let url = created.agent?.deployment?.url ?? "";
  for (let i = 0; i < 30 && !url; i++) {
    await sleep(4000);
    const info = await call("GET", `/gen-ai/agents/${uuid}`);
    url = info.agent?.deployment?.url ?? "";
    const status = info.agent?.deployment?.status ?? "…";
    process.stdout.write(`  deployment: ${status}\r`);
  }
  console.log(`\n  endpoint: ${url || "(still deploying — check console for the URL)"}`);

  // make the endpoint publicly callable
  try {
    await call("PUT", `/gen-ai/agents/${uuid}/deployment_visibility`, {
      uuid,
      visibility: "VISIBILITY_PUBLIC",
    });
  } catch (e) {
    console.warn(`  couldn't set endpoint visibility (${e.message}) — toggle it in the console if calls 401.`);
  }

  const keyRes = await call("POST", `/gen-ai/agents/${uuid}/api_keys`, {
    agent_uuid: uuid,
    name: `${spec.name}-key`,
  });
  const secret = keyRes.api_key_info?.secret_key ?? keyRes.api_key?.secret_key ?? "";
  envLines.push(`${spec.envPrefix}_ENDPOINT=${url}`);
  envLines.push(`${spec.envPrefix}_KEY=${secret}`);
}

console.log("\n=== Add to .env.local ===\n" + envLines.join("\n"));
console.log("\nThen restart the dev server. Done.");

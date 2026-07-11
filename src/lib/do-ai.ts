import OpenAI from "openai";

// DigitalOcean serverless inference — one key, every model.
// https://inference.do-ai.run/v1/ is OpenAI-compatible.
const INFERENCE_BASE_URL = "https://inference.do-ai.run/v1/";
export const CLASSIFIER_MODEL = process.env.DO_CLASSIFIER_MODEL || "llama3.3-70b-instruct";
export const FALLBACK_CHAT_MODEL = process.env.DO_CHAT_MODEL || "anthropic-claude-4.6-sonnet";

export type AiMode = "agent" | "inference" | "mock";

function agentClient(endpoint: string, key: string): OpenAI {
  // Console-created DO agents expose {endpoint}/api/v1/chat/completions,
  // authed with the agent's own access key. model is ignored ("n/a").
  const base = endpoint.replace(/\/+$/, "");
  return new OpenAI({ baseURL: `${base}/api/v1/`, apiKey: key });
}

export function inferenceClient(): OpenAI | null {
  const key = process.env.DIGITAL_OCEAN_MODEL_ACCESS_KEY;
  if (!key) return null;
  return new OpenAI({ baseURL: INFERENCE_BASE_URL, apiKey: key });
}

// Each role maps to its own DO Agent Platform agent (own endpoint + key):
//   charly  — persona / member-facing conversation
//   planner — community organizing logistics (action plans)
//   scout   — org discovery & info, RAG over the orgs knowledge base
// Resolution order per role:
// 1. dedicated DO console agent (best: uses Agent Platform + knowledge base)
// 2. DO serverless inference with the system prompt inlined
// 3. mock (no keys yet — lets the app run before console setup)
export type AgentRole = "charly" | "planner" | "scout";

const AGENT_ENV: Record<AgentRole, { endpoint?: string; key?: string }> = {
  charly: { endpoint: process.env.CHARLY_ENDPOINT, key: process.env.CHARLY_KEY },
  planner: { endpoint: process.env.PLANNER_ENDPOINT, key: process.env.PLANNER_KEY },
  scout: { endpoint: process.env.SCOUT_ENDPOINT, key: process.env.SCOUT_KEY },
};

export function resolveAgent(role: AgentRole): {
  mode: AiMode;
  client: OpenAI | null;
  model: string;
} {
  const { endpoint, key } = AGENT_ENV[role];
  if (endpoint && key) {
    return { mode: "agent", client: agentClient(endpoint, key), model: "n/a" };
  }
  const inference = inferenceClient();
  if (inference) {
    return { mode: "inference", client: inference, model: FALLBACK_CHAT_MODEL };
  }
  return { mode: "mock", client: null, model: "mock" };
}

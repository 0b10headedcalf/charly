import { FALLBACK_CHAT_MODEL, inferenceClient } from "./do-ai";
import { HANDOUT_SYSTEM_PROMPT, handoutUserPrompt } from "./prompts";
import { readState, saveHandout } from "./store";
import type { ActionPlan, Group, Handout } from "./types";

type HandoutDraft = Pick<Handout, "headline" | "intro" | "weeks" | "bring" | "roles">;

// Deterministic transform of the plan markdown — keeps the handout working in
// demo mode (no keys) and when the model returns unparseable JSON.
function fallbackDraft(group: Group, plan: ActionPlan): HandoutDraft {
  const sections = plan.markdown.split(/^## +/m).filter((s) => s.trim());
  const weeks: HandoutDraft["weeks"] = [];
  const roles: string[] = [];

  for (const section of sections) {
    const [rawTitle, ...rest] = section.split("\n");
    const title = rawTitle.trim();
    const bullets = rest
      .filter((l) => /^[-*] /.test(l.trim()))
      .map((l) => l.trim().replace(/^[-*] /, "").replace(/\*\*/g, ""));
    if (/who we need/i.test(title)) {
      roles.push(...bullets);
    } else if (bullets.length > 0) {
      weeks.push({
        title,
        items: bullets.map((b) => ({ action: b, org: "", when: "" })),
      });
    }
  }

  return {
    headline: `${group.name}: the next two weeks`,
    intro: `Here's what our crew is up to. Grab a slot, bring a friend, and let's show up for the neighborhood.`,
    weeks,
    bring: ["Comfortable shoes", "Water bottle", "A friend who wants in"],
    roles,
  };
}

async function aiDraft(group: Group, plan: ActionPlan): Promise<HandoutDraft | null> {
  const client = inferenceClient();
  if (!client) return null;
  const res = await client.chat.completions.create({
    model: FALLBACK_CHAT_MODEL,
    messages: [
      { role: "system", content: HANDOUT_SYSTEM_PROMPT },
      {
        role: "user",
        content: handoutUserPrompt({
          groupName: group.name,
          groupTagline: group.tagline,
          planMarkdown: plan.markdown,
        }),
      },
    ],
    max_completion_tokens: 900,
    temperature: 0.3,
  }, {
    // Tighter than the client default: this runs during handout page render,
    // and the deterministic fallback is good enough to not keep a tab hanging.
    timeout: 15_000,
  });
  const raw = res.choices[0]?.message?.content ?? "";
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return null;
  try {
    const draft = JSON.parse(json) as HandoutDraft;
    if (!draft.headline || !Array.isArray(draft.weeks)) return null;
    return {
      headline: draft.headline,
      intro: draft.intro ?? "",
      weeks: draft.weeks.map((w) => ({
        title: w.title ?? "Coming up",
        items: (w.items ?? []).map((i) => ({
          action: i.action ?? "",
          org: i.org ?? "",
          when: i.when ?? "",
        })),
      })),
      bring: Array.isArray(draft.bring) ? draft.bring : [],
      roles: Array.isArray(draft.roles) ? draft.roles : [],
    };
  } catch {
    return null;
  }
}

// Returns the cached handout when it matches the current plan, otherwise
// regenerates via Gradient AI (or the deterministic fallback) and caches it.
export async function getOrCreateHandout(group: Group, plan: ActionPlan): Promise<Handout> {
  const state = await readState();
  const cached = state.handouts[group.id];
  if (cached && cached.planGeneratedAt === plan.generatedAt) return cached;

  let draft: HandoutDraft | null = null;
  let source: Handout["source"] = "mock";
  try {
    draft = await aiDraft(group, plan);
    if (draft) source = "inference";
  } catch (err) {
    console.error("handout generation failed, using fallback:", err);
  }
  if (!draft) draft = fallbackDraft(group, plan);

  const handout: Handout = {
    groupId: group.id,
    ...draft,
    source,
    generatedAt: new Date().toISOString(),
    planGeneratedAt: plan.generatedAt,
  };
  await saveHandout(handout);
  return handout;
}

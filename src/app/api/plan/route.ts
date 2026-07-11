import { NextResponse } from "next/server";
import orgs from "../../../../data/orgs.json";
import { resolveAgent } from "@/lib/do-ai";
import { groupById } from "@/lib/matching";
import { PLANNER_SYSTEM_PROMPT, plannerUserPrompt } from "@/lib/prompts";
import { getCityPulse, pulseForGroup } from "@/lib/sfdata";
import { readState, savePlan } from "@/lib/store";
import type { ActionPlan, Org } from "@/lib/types";

function mockPlan(groupOrgs: Org[]): string {
  const [a, b, c] = groupOrgs;
  return `## This Week
- **Kickoff shift with ${a?.name ?? "a local partner"}** (${a?.neighborhood ?? "nearby"}) — cover their top need: ${a?.needs[0] ?? "volunteering"}. Saturday 10am.
- **Supply check-in with ${b?.name ?? "a second partner"}** — ${b?.needs[0] ?? "help out"}. Wednesday evening.

## Next Week
- **Group outing to ${c?.name ?? a?.name ?? "a partner org"}** — bring 5+ members for ${c?.needs[0] ?? "a work day"}.
- Debrief over coffee: what worked, who wants to lead next round.

## Who We Need
${groupOrgs.slice(0, 3).flatMap((o) => o.needs.slice(0, 1).map((n) => `- ${n} → ${o.name}`)).join("\n")}

*(Demo plan — connect DigitalOcean keys for a live agent-generated plan.)*`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as { groupId: string; force?: boolean };
  const group = groupById(body.groupId);
  if (!group) {
    return NextResponse.json({ error: "Unknown group" }, { status: 400 });
  }

  const state = await readState();
  if (!body.force && state.plans[group.id]) {
    return NextResponse.json({ plan: state.plans[group.id], cached: true });
  }

  const groupOrgs = (orgs as Org[]).filter((o) => o.groupIds.includes(group.id));
  const members = state.members.filter((m) => m.groupId === group.id);
  const interests = [...new Set(members.flatMap((m) => m.interests))].slice(0, 12);
  const orgsBlock = groupOrgs
    .map(
      (o) =>
        `- ${o.name} (${o.neighborhood}): ${o.mission} Needs: ${o.needs.join("; ")}. Capacity: ${o.capacity} volunteers.`
    )
    .join("\n");

  const citySignals = pulseForGroup(await getCityPulse(), group.id);

  const { mode, client, model } = resolveAgent("planner");
  let markdown: string;
  const citations: string[] = [];

  try {
    if (mode === "mock" || !client) {
      markdown = mockPlan(groupOrgs);
    } else if (mode === "agent") {
      // Console agent: org data lives in its knowledge base (RAG).
      // include_retrieval_info surfaces which KB files it used.
      const res = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: plannerUserPrompt({
              groupName: group.name,
              groupDescription: group.description,
              memberCount: members.length,
              interests,
              orgsBlock: "(use your knowledge base of partner organizations)",
              citySignals,
            }),
          },
        ],
        max_completion_tokens: 800,
        ...({ include_retrieval_info: true } as object),
      });
      markdown = res.choices[0]?.message?.content ?? "";
      const retrieval = (res as unknown as {
        retrieval?: { retrieved_data?: { file_name?: string; source?: string }[] };
      }).retrieval;
      for (const r of retrieval?.retrieved_data ?? []) {
        const label = r.file_name || r.source;
        if (label && !citations.includes(label)) citations.push(label);
      }
    } else {
      const res = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: PLANNER_SYSTEM_PROMPT },
          {
            role: "user",
            content: plannerUserPrompt({
              groupName: group.name,
              groupDescription: group.description,
              memberCount: members.length,
              interests,
              orgsBlock,
              citySignals,
            }),
          },
        ],
        max_completion_tokens: 800,
        temperature: 0.4,
      });
      markdown = res.choices[0]?.message?.content ?? "";
    }
  } catch (err) {
    console.error("planner failed:", err);
    return NextResponse.json(
      { error: "Plan generation failed. Check DigitalOcean keys in .env.local." },
      { status: 502 }
    );
  }

  if (!markdown.trim()) {
    markdown = mockPlan(groupOrgs);
  }

  const plan: ActionPlan = {
    groupId: group.id,
    markdown,
    citations,
    source: mode,
    generatedAt: new Date().toISOString(),
  };
  await savePlan(plan);
  return NextResponse.json({ plan, cached: false });
}

import { NextResponse } from "next/server";
import orgsData from "../../../../data/orgs.json";
import { resolveAgent } from "@/lib/do-ai";
import { copilotUserPrompt, ORG_COPILOT_SYSTEM_PROMPT } from "@/lib/prompts";
import { readState } from "@/lib/store";
import type { Org, OrgEvent } from "@/lib/types";

function recordsBlock(org: Org, events: OrgEvent[]): string {
  const eventLines = events.map((e) => {
    const signups = e.signups.map((s) => s.name).join(", ") || "none yet";
    const log = e.log.map((l) => `    note: ${l.text}`).join("\n");
    return `- ${e.title} (${e.when || "date TBD"})\n    needs: ${e.needs.join("; ") || "-"}\n    signed up (${e.signups.length}): ${signups}${log ? "\n" + log : ""}`;
  });
  return `Organization: ${org.name} (${org.neighborhood})
Mission: ${org.mission}
Standing volunteer needs: ${org.needs.join("; ")}
Volunteer capacity: ${org.capacity}

Events:
${eventLines.length ? eventLines.join("\n") : "- no events posted yet"}`;
}

function mockAnswer(org: Org, events: OrgEvent[]): string {
  const total = events.reduce((acc, e) => acc + e.signups.length, 0);
  return `Here's where ${org.name} stands: ${events.length} event${events.length === 1 ? "" : "s"} posted, ${total} signup${total === 1 ? "" : "s"} total.\n\n${events
    .map((e) => `**${e.title}** — ${e.signups.length} signed up (${e.signups.map((s) => s.name).join(", ") || "nobody yet"}); still needs: ${e.needs.join(", ") || "nothing listed"}.`)
    .join("\n")}\n\n*(Demo answer — add a DigitalOcean key for a live copilot.)*`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as { orgId: string; question: string };
  const org = (orgsData as Org[]).find((o) => o.id === body.orgId);
  if (!org) return NextResponse.json({ error: "Unknown org" }, { status: 400 });
  const question = (body.question ?? "").trim().slice(0, 500);
  if (!question) return NextResponse.json({ error: "Ask something" }, { status: 400 });

  const state = await readState();
  const events = state.events.filter((e) => e.orgId === org.id);
  const records = recordsBlock(org, events);

  // The scout agent's job is org discovery & info: with a console agent
  // configured, its knowledge base adds RAG background on every partner org
  // beyond the live records passed inline below.
  const { mode, client, model } = resolveAgent("scout");
  let answer: string;
  try {
    if (mode === "mock" || !client) {
      answer = mockAnswer(org, events);
    } else {
      const messages =
        mode === "inference"
          ? [
              { role: "system" as const, content: ORG_COPILOT_SYSTEM_PROMPT },
              { role: "user" as const, content: copilotUserPrompt(records, question) },
            ]
          : [
              {
                role: "user" as const,
                content: `${ORG_COPILOT_SYSTEM_PROMPT}\n\n${copilotUserPrompt(records, question)}`,
              },
            ];
      const res = await client.chat.completions.create({
        model,
        messages,
        max_completion_tokens: 500,
        temperature: 0.3,
      });
      answer = res.choices[0]?.message?.content ?? "";
      if (!answer.trim()) answer = mockAnswer(org, events);
    }
  } catch (err) {
    console.error("copilot failed:", err);
    return NextResponse.json(
      { error: "Copilot couldn't reach the DigitalOcean model. Check keys in .env.local." },
      { status: 502 }
    );
  }

  return NextResponse.json({ answer, mode });
}

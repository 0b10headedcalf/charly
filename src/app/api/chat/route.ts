import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { resolveAgent } from "@/lib/do-ai";
import { allGroups, classifyGroup, keywordMatch } from "@/lib/matching";
import { CHARLY_SYSTEM_PROMPT } from "@/lib/prompts";
import { addMember } from "@/lib/store";
import type { ChatMessage, Member } from "@/lib/types";

const MATCH_RE = /MATCH_READY:\s*(\{[\s\S]*\})/;

function mockReply(messages: ChatMessage[]): string {
  const userTurns = messages.filter((m) => m.role === "user");
  if (userTurns.length <= 1) {
    return "Ooh, I love that! How do you like to help — hands-on stuff, driving things around, teaching, cooking...?";
  }
  if (userTurns.length === 2) {
    return "Amazing. Last one: how much time do you have — a couple hours a month, or every week?";
  }
  const allText = userTurns.map((m) => m.content).join(" ").toLowerCase();
  // pull out words that match any group's keyword vocabulary
  const vocab = new Set(allGroups.flatMap((g) => g.keywords));
  const interests = [...new Set(allText.split(/[^a-z]+/).filter((w) => vocab.has(w)))].slice(0, 4);
  return `Okay okay okay — I found your people!
MATCH_READY: {"interests": ${JSON.stringify(interests.length ? interests : ["helping neighbors"])}, "summary": "A neighbor ready to pitch in."}`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as { name?: string; messages: ChatMessage[] };
  const messages = (body.messages ?? []).slice(-20);
  const name = (body.name || "Neighbor").slice(0, 40);

  const { mode, client, model } = resolveAgent("charly");
  let reply: string;
  try {
    if (mode === "mock" || !client) {
      reply = mockReply(messages);
    } else {
      const withSystem =
        mode === "inference"
          ? [{ role: "system" as const, content: CHARLY_SYSTEM_PROMPT }, ...messages]
          : messages; // console agent already carries its instructions
      const res = await client.chat.completions.create({
        model,
        messages: withSystem,
        max_completion_tokens: 400,
        temperature: 0.7,
      });
      reply = res.choices[0]?.message?.content ?? "Hmm, say that again?";
    }
  } catch (err) {
    console.error("charly chat failed:", err);
    return NextResponse.json(
      { error: "Charly couldn't reach the DigitalOcean model. Check your keys in .env.local." },
      { status: 502 }
    );
  }

  const match = reply.match(MATCH_RE);
  if (!match) {
    return NextResponse.json({ reply: reply.trim(), mode });
  }

  // Charly signalled a match: strip the protocol line, classify, save member.
  const visible = reply.replace(MATCH_RE, "").trim();
  let interests: string[] = [];
  let summary = "";
  try {
    const parsed = JSON.parse(match[1]) as { interests?: string[]; summary?: string };
    interests = (parsed.interests ?? []).slice(0, 5);
    summary = parsed.summary ?? "";
  } catch {
    interests = [];
  }
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");
  const group =
    mode !== "mock" && interests.length > 0
      ? await classifyGroup(interests, summary)
      : keywordMatch(userText);

  const member: Member = {
    id: randomUUID(),
    name,
    groupId: group.id,
    interests,
    joinedAt: new Date().toISOString(),
  };
  await addMember(member);

  return NextResponse.json({
    reply: visible || "I found your people!",
    mode,
    matched: { group, member, interests, summary },
  });
}

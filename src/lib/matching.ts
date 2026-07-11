import groups from "../../data/groups.json";
import { CLASSIFIER_MODEL, inferenceClient } from "./do-ai";
import type { Group } from "./types";

export const allGroups = groups as Group[];

export function groupById(id: string): Group | undefined {
  return allGroups.find((g) => g.id === id);
}

// Deterministic fallback: score groups by keyword hits across the user's words.
export function keywordMatch(text: string): Group {
  const lower = text.toLowerCase();
  let best = allGroups[0];
  let bestScore = -1;
  for (const g of allGroups) {
    const score = g.keywords.reduce(
      (acc, kw) => acc + (lower.includes(kw) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      best = g;
      bestScore = score;
    }
  }
  return best;
}

// Classify interests -> group via DO serverless inference; falls back to
// keyword matching if no key is configured or the call fails.
export async function classifyGroup(interests: string[], summary: string): Promise<Group> {
  const client = inferenceClient();
  const text = `${interests.join(", ")}. ${summary}`;
  if (!client) return keywordMatch(text);
  try {
    const res = await client.chat.completions.create({
      model: CLASSIFIER_MODEL,
      messages: [
        {
          role: "user",
          content: `Pick the single best volunteer group for a person with these interests: "${text}".
Groups:\n${allGroups.map((g) => `- ${g.id}: ${g.description}`).join("\n")}
Reply with ONLY the group id, nothing else.`,
        },
      ],
      max_completion_tokens: 20,
      temperature: 0,
    });
    const id = res.choices[0]?.message?.content?.trim().toLowerCase() ?? "";
    return groupById(id) ?? keywordMatch(text);
  } catch {
    return keywordMatch(text);
  }
}

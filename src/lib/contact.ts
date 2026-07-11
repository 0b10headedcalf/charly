import type { Member } from "./types";

// Deterministic synthetic contact info for demo purposes.
// Derived from the member id so it's stable across renders without
// touching stored data. Uses 555-01xx numbers and example.com — both
// reserved for fiction, never real.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function syntheticContact(member: Member): { email: string; phone: string } {
  const h = hash(member.id);
  const slug = member.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "member";
  const email = `${slug}${(h % 90) + 10}@example.com`;
  const phone = `(415) 555-01${String(h % 100).padStart(2, "0")}`;
  return { email, phone };
}

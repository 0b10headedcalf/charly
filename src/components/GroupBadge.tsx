import type { Group } from "@/lib/types";

// Two-letter monogram chip in the group's color — the professional stand-in
// for the old emoji identity. "Food Security Crew" → FS, "Animal Allies" → AA.
export function monogram(name: string): string {
  const words = name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w));
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function GroupBadge({ group, size = 40 }: { group: Group; size?: number }) {
  return (
    <span
      aria-hidden
      className="font-display inline-flex shrink-0 items-center justify-center rounded-xl font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: `${group.color}1f`,
        color: group.color,
        border: `1.5px solid ${group.color}55`,
      }}
    >
      {monogram(group.name)}
    </span>
  );
}

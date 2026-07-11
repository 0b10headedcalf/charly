import Link from "next/link";
import type { Group } from "@/lib/types";

export function GroupFlyer({
  group,
  memberCount,
  index = 0,
}: {
  group: Group;
  memberCount?: number;
  index?: number;
}) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className={`flyer block p-5 ${index % 2 === 0 ? "tilt-l" : "tilt-r"}`}
      style={{ "--pin-color": group.color } as React.CSSProperties}
    >
      <div className="text-3xl">{group.emoji}</div>
      <h3 className="mt-2 text-lg font-bold leading-tight">{group.name}</h3>
      <p className="mt-1 text-sm font-semibold" style={{ color: group.color }}>
        {group.tagline}
      </p>
      <p className="mt-2 text-sm leading-snug text-clay">{group.description}</p>
      {memberCount !== undefined && (
        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-ink/60">
          {memberCount} neighbor{memberCount === 1 ? "" : "s"} joined
        </p>
      )}
    </Link>
  );
}

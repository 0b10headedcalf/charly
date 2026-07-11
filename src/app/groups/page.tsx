import { GroupFlyer } from "@/components/GroupFlyer";
import { allGroups } from "@/lib/matching";
import { readState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const state = await readState();
  const counts = new Map<string, number>();
  for (const m of state.members) {
    counts.set(m.groupId, (counts.get(m.groupId) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">The crews</h1>
      <p className="mt-1 text-clay">Pick a board, meet the neighbors, see the plan.</p>
      <div className="grid gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-3">
        {allGroups.map((g, i) => (
          <GroupFlyer key={g.id} group={g} memberCount={counts.get(g.id) ?? 0} index={i} />
        ))}
      </div>
    </div>
  );
}

import orgsData from "../../../data/orgs.json";
import { CityHeatmap } from "@/components/CityHeatmap";
import { DashboardCharts } from "@/components/DashboardCharts";
import { allGroups } from "@/lib/matching";
import { getCityPulse, getHeatmap } from "@/lib/sfdata";
import { readState } from "@/lib/store";
import type { Org } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [state, pulse, heat] = await Promise.all([readState(), getCityPulse(), getHeatmap()]);
  const orgs = orgsData as Org[];

  const crewData = allGroups.map((g) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    color: g.color,
    members: state.members.filter((m) => m.groupId === g.id).length,
    capacity: orgs
      .filter((o) => o.groupIds.includes(g.id))
      .reduce((acc, o) => acc + o.capacity, 0),
  }));

  const tagCounts = new Map<string, number>();
  for (const m of state.members) {
    for (const tag of m.interests) {
      const key = tag.toLowerCase();
      tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1);
    }
  }
  const interests = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));

  const tiles = [
    { label: "neighbors mobilized", value: state.members.length },
    { label: "volunteer crews", value: allGroups.length },
    { label: "partner orgs", value: orgs.length },
    { label: "action plans drafted", value: Object.keys(state.plans).length },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Community board</h1>
      <p className="mt-1 text-clay">
        What the neighborhood is up to, live from Charly&apos;s matching data.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl bg-white/80 p-4 shadow-sm">
            <div className="font-display text-3xl font-extrabold">{t.value}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wide text-clay">
              {t.label}
            </div>
          </div>
        ))}
      </div>

      <CityHeatmap heat={heat} />
      <DashboardCharts crewData={crewData} interests={interests} pulse={pulse} />
    </div>
  );
}

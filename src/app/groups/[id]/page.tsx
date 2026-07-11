import Link from "next/link";
import { notFound } from "next/navigation";
import orgsData from "../../../../data/orgs.json";
import { EventCallouts } from "@/components/EventCallouts";
import { PlanSection } from "@/components/PlanSection";
import { groupById } from "@/lib/matching";
import { readState } from "@/lib/store";
import type { Org } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const group = groupById(id);
  if (!group) notFound();

  const state = await readState();
  const members = state.members
    .filter((m) => m.groupId === group.id)
    .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
  const orgs = (orgsData as Org[]).filter((o) => o.groupIds.includes(group.id));
  const existingPlan = state.plans[group.id] ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href="/groups" className="text-sm font-bold text-clay hover:text-ink">
        ← All crews
      </Link>

      <header className="mt-4 flex items-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-4xl"
          style={{ backgroundColor: `${group.color}22` }}
        >
          {group.emoji}
        </div>
        <div>
          <h1 className="text-3xl font-extrabold leading-tight">{group.name}</h1>
          <p className="font-semibold" style={{ color: group.color }}>
            {group.tagline}
          </p>
        </div>
      </header>
      <p className="mt-3 max-w-2xl text-clay">{group.description}</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <PlanSection groupId={group.id} groupColor={group.color} initialPlan={existingPlan} />

          <EventCallouts
            initialEvents={state.events.filter((e) => e.groupIds.includes(group.id))}
            orgNames={Object.fromEntries((orgsData as Org[]).map((o) => [o.id, o.name]))}
            color={group.color}
          />

          <section className="mt-10">
            <h2 className="text-xl font-bold">Partner orgs on the board</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {orgs.map((o, i) => (
                <div
                  key={o.id}
                  className={`flyer p-4 ${i % 2 === 0 ? "tilt-r" : "tilt-l"}`}
                  style={{ "--pin-color": group.color } as React.CSSProperties}
                >
                  <h3 className="font-bold leading-tight">{o.name}</h3>
                  <p className="text-xs font-bold uppercase tracking-wide text-clay">
                    {o.neighborhood}
                  </p>
                  <p className="mt-2 text-sm leading-snug">{o.mission}</p>
                  <ul className="mt-2 space-y-1 text-sm text-clay">
                    {o.needs.map((n) => (
                      <li key={n}>• {n}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside>
          <h2 className="text-xl font-bold">
            The crew{" "}
            <span className="text-base font-semibold text-clay">({members.length})</span>
          </h2>
          <ul className="mt-4 space-y-3">
            {members.slice(0, 14).map((m) => (
              <li key={m.id} className="rounded-xl bg-white/80 px-4 py-2.5 shadow-sm">
                <span className="font-bold">{m.name}</span>
                {m.interests.length > 0 && (
                  <span className="block text-xs text-clay">{m.interests.join(" · ")}</span>
                )}
              </li>
            ))}
          </ul>
          {members.length === 0 && (
            <p className="mt-4 text-sm text-clay">
              Nobody here yet — <Link href="/chat" className="font-bold text-coral">chat with Charli</Link> to join first.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

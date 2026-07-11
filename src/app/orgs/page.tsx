import Link from "next/link";
import orgsData from "../../../data/orgs.json";
import { groupById } from "@/lib/matching";
import { readState } from "@/lib/store";
import type { Org } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrgsPage() {
  const orgs = orgsData as Org[];
  const state = await readState();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Org HQ</h1>
      <p className="mt-1 max-w-2xl text-clay">
        For partner organizations: post events to recruit from Charly&apos;s crews,
        track signups, and keep your records — with an AI copilot that knows them.
      </p>
      <div className="grid gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-3">
        {orgs.map((o, i) => {
          const events = state.events.filter((e) => e.orgId === o.id);
          const signups = events.reduce((acc, e) => acc + e.signups.length, 0);
          const color = groupById(o.groupIds[0])?.color ?? "#e5543f";
          return (
            <Link
              key={o.id}
              href={`/orgs/${o.id}`}
              className={`flyer block p-4 ${i % 2 === 0 ? "tilt-l" : "tilt-r"}`}
              style={{ "--pin-color": color } as React.CSSProperties}
            >
              <h2 className="font-bold leading-tight">{o.name}</h2>
              <p className="text-xs font-bold uppercase tracking-wide text-clay">
                {o.neighborhood}
              </p>
              <p className="mt-2 text-sm leading-snug text-clay">{o.mission}</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-ink/60">
                {events.length} event{events.length === 1 ? "" : "s"} · {signups} signup
                {signups === 1 ? "" : "s"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

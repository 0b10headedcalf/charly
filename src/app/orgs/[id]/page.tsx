import Link from "next/link";
import { notFound } from "next/navigation";
import orgsData from "../../../../data/orgs.json";
import { OrgHQ } from "@/components/OrgHQ";
import { groupById } from "@/lib/matching";
import { readState } from "@/lib/store";
import type { Org } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrgPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = (orgsData as Org[]).find((o) => o.id === id);
  if (!org) notFound();

  const state = await readState();
  const events = state.events
    .filter((e) => e.orgId === org.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const color = groupById(org.groupIds[0])?.color ?? "#e5543f";
  const crews = org.groupIds
    .map((gid) => groupById(gid))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href="/orgs" className="text-sm font-bold text-clay hover:text-ink">
        ← All orgs
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl font-extrabold leading-tight">{org.name}</h1>
        <p className="mt-1 text-sm font-bold uppercase tracking-wide text-clay">
          {org.neighborhood} · capacity {org.capacity} volunteers
        </p>
        <p className="mt-2 max-w-2xl text-clay">{org.mission}</p>
        <p className="mt-2 text-sm">
          Recruits from:{" "}
          {crews.map((g) => (
            <Link
              key={g.id}
              href={`/groups/${g.id}`}
              className="mr-2 font-bold"
              style={{ color: g.color }}
            >
              {g.emoji} {g.name}
            </Link>
          ))}
        </p>
      </header>

      <OrgHQ org={org} initialEvents={events} color={color} />
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { getOrCreateHandout } from "@/lib/handout";
import { groupById } from "@/lib/matching";
import { readState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HandoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const group = groupById(id);
  if (!group) notFound();

  const state = await readState();
  const plan = state.plans[group.id];
  if (!plan) redirect(`/groups/${group.id}`);

  const handout = await getOrCreateHandout(group, plan);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 print:py-0" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/groups/${group.id}`} className="text-sm font-bold text-clay hover:text-ink">
          ← Back to {group.name}
        </Link>
        <PrintButton color={group.color} />
      </div>

      <article className="handout rounded-2xl bg-white p-8 shadow-sm">
        <header className="border-b-4 pb-5" style={{ borderColor: group.color }}>
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: group.color }}>
            {group.emoji} {group.name} · volunteer handout
          </p>
          <h1 className="mt-1 font-display text-4xl font-extrabold leading-tight">
            {handout.headline}
          </h1>
          <p className="mt-3 text-lg leading-snug text-clay">{handout.intro}</p>
        </header>

        {handout.weeks.map((week) => (
          <section key={week.title} className="mt-6">
            <h2 className="text-xl font-bold" style={{ color: group.color }}>
              {week.title}
            </h2>
            <ul className="mt-2 space-y-3">
              {week.items.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="mt-1 inline-block h-4 w-4 shrink-0 rounded border-2"
                    style={{ borderColor: group.color }}
                  />
                  <div>
                    <p className="font-semibold leading-snug">{item.action}</p>
                    {(item.org || item.when) && (
                      <p className="text-sm text-clay">
                        {[item.org, item.when].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {handout.bring.length > 0 && (
            <section className="rounded-xl bg-kraft/60 p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide">What to bring</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {handout.bring.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
            </section>
          )}
          {handout.roles.length > 0 && (
            <section className="rounded-xl bg-kraft/60 p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide">Still needed</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {handout.roles.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <footer className="mt-8 border-t border-ink/10 pt-3 text-xs text-clay">
          {group.tagline} · handout drafted by DigitalOcean Gradient AI · charly
          {" · "}
          {new Date(handout.generatedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })}
        </footer>
      </article>
    </div>
  );
}

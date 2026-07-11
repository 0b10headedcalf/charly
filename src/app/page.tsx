import Link from "next/link";
import { CharlyMascot } from "@/components/CharlyMascot";
import { GroupFlyer } from "@/components/GroupFlyer";
import { allGroups } from "@/lib/matching";
import { readState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const state = await readState();
  const counts = new Map<string, number>();
  for (const m of state.members) {
    counts.set(m.groupId, (counts.get(m.groupId) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* hero */}
      <section className="flex flex-col items-center gap-6 py-14 text-center sm:py-20">
        <div className="sun-glow bounce-soft">
          <CharlyMascot size={132} />
        </div>
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
          Find <span className="marker">your people</span>.
          <br />
          Fix your corner of the world.
        </h1>
        <p className="max-w-xl text-lg text-clay">
          Take Charly&apos;s two-minute welcome survey. Get matched with a
          neighborhood crew, and let our AI agents coordinate the plan with local
          aid orgs — so you can just show up and help.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/join"
            className="rounded-full bg-coral px-7 py-3 text-lg font-bold text-white shadow-md transition hover:bg-coral-deep hover:shadow-lg"
          >
            Meet Charly 🧡
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border-2 border-ink/15 px-7 py-3 text-lg font-bold text-ink transition hover:bg-kraft"
          >
            See the community board
          </Link>
        </div>
      </section>

      {/* how it works */}
      <section className="grid gap-4 py-8 sm:grid-cols-3">
        {[
          {
            step: "Survey",
            text: "Charly's welcome survey — a few taps, plus one question an AI writes just for you.",
            emoji: "📝",
          },
          {
            step: "Match",
            text: "A DigitalOcean AI agent sorts you into the right neighborhood crew.",
            emoji: "🧭",
          },
          {
            step: "Mobilize",
            text: "A planner agent drafts your crew's next two weeks with real local orgs.",
            emoji: "📌",
          },
        ].map((s) => (
          <div key={s.step} className="rounded-xl bg-kraft/60 p-5">
            <div className="text-2xl">{s.emoji}</div>
            <h2 className="mt-1 text-xl font-bold">{s.step}</h2>
            <p className="mt-1 text-sm leading-snug text-clay">{s.text}</p>
          </div>
        ))}
      </section>

      {/* group board */}
      <section className="py-10">
        <h2 className="text-2xl font-bold">The crews</h2>
        <p className="mb-6 mt-1 text-clay">
          Six standing groups, each partnered with real organizations nearby.
        </p>
        <div className="grid gap-6 pt-2 sm:grid-cols-2 lg:grid-cols-3">
          {allGroups.map((g, i) => (
            <GroupFlyer key={g.id} group={g} memberCount={counts.get(g.id) ?? 0} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

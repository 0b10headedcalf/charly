import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { groupById } from "@/lib/matching";
import { readState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/signin");

  const state = await readState();
  // newest membership for this account (falls back to name match for guests
  // who joined before signing in)
  const member =
    [...state.members].reverse().find((m) => m.userId === session.id) ??
    [...state.members].reverse().find((m) => m.name === session.name);
  const group = member ? groupById(member.groupId) : undefined;
  const signups = state.events.filter((e) =>
    e.signups.some((s) => s.name.toLowerCase() === session.name.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center gap-4">
        {session.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.avatarUrl}
            alt=""
            width={72}
            height={72}
            className="rounded-full border-2 border-ink/10"
          />
        ) : (
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-kraft text-3xl font-bold">
            {session.name[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-extrabold leading-tight">{session.name}</h1>
          <p className="text-sm font-bold uppercase tracking-wide text-clay">
            {session.provider === "google" ? "Signed in with Google" : "Guest account"}
          </p>
        </div>
        <form action="/api/auth/signout" method="POST" className="ml-auto">
          <button className="rounded-full border-2 border-ink/15 px-4 py-2 text-sm font-bold hover:bg-kraft">
            Sign out
          </button>
        </form>
      </div>

      {member && group ? (
        <div className="mt-8">
          <div
            className="flyer p-6"
            style={{ "--pin-color": group.color } as React.CSSProperties}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-clay">Your crew</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-3xl">{group.emoji}</span>
              <div>
                <h2 className="text-xl font-extrabold leading-tight">{group.name}</h2>
                <p className="text-sm font-semibold" style={{ color: group.color }}>
                  {group.tagline}
                </p>
              </div>
              <Link
                href={`/groups/${group.id}`}
                className="ml-auto rounded-full px-5 py-2 text-sm font-bold text-white"
                style={{ backgroundColor: group.color }}
              >
                Open →
              </Link>
            </div>
            {member.summary && <p className="mt-3 text-sm text-clay">{member.summary}</p>}
            {member.interests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {member.interests.map((tag) => (
                  <span key={tag} className="rounded-full bg-kraft px-3 py-1 text-xs font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="mt-3 text-sm text-clay">
            Interests changed?{" "}
            <Link href="/join" className="font-bold text-coral hover:text-coral-deep">
              Retake the welcome survey
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded-xl bg-kraft/60 p-6 text-center">
          <p className="font-bold">You haven&apos;t met your crew yet.</p>
          <Link
            href="/join"
            className="mt-3 inline-block rounded-full bg-coral px-6 py-2.5 font-bold text-white hover:bg-coral-deep"
          >
            Take Charly&apos;s welcome survey
          </Link>
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-bold">Your signups</h2>
        {signups.length === 0 ? (
          <p className="mt-2 text-sm text-clay">
            No event signups yet — check your crew page for callouts.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {signups.map((e) => (
              <li key={e.id} className="rounded-xl bg-white/80 px-4 py-3 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-bold">{e.title}</span>
                  <span className="text-sm text-clay">{e.when}</span>
                </div>
                <Link
                  href={`/orgs/${e.orgId}`}
                  className="text-xs font-bold uppercase tracking-wide text-clay hover:text-ink"
                >
                  event details →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

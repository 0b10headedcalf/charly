import { redirect } from "next/navigation";
import { CharliMascot } from "@/components/CharliMascot";
import { getSession, githubConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/join");
  const { error } = await searchParams;
  const hasGithub = githubConfigured();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-20 text-center">
      <CharliMascot size={110} />
      <h1 className="text-3xl font-extrabold">Join the neighborhood</h1>
      <p className="text-clay">
        Sign in, take Charli&apos;s two-minute welcome survey, and get matched with
        your volunteer crew.
      </p>

      {error && (
        <div className="w-full rounded-xl border-2 border-coral/40 bg-coral/10 px-4 py-3 text-sm">
          {error === "github-not-configured"
            ? "GitHub sign-in isn't configured yet — continue as a guest below."
            : error === "name-required"
              ? "Please enter a name to continue."
              : "Sign-in didn't work — try again or continue as a guest."}
        </div>
      )}

      {hasGithub && (
        <a
          href="/api/auth/github"
          className="w-full rounded-full bg-ink px-6 py-3 font-bold text-white shadow-md hover:opacity-90"
        >
          Continue with GitHub
        </a>
      )}

      <div className="flex w-full items-center gap-3 text-xs font-bold uppercase tracking-wide text-clay">
        <span className="h-px flex-1 bg-ink/10" />
        {hasGithub ? "or" : "quick start"}
        <span className="h-px flex-1 bg-ink/10" />
      </div>

      <form action="/api/auth/guest" method="POST" className="flex w-full gap-2">
        <input
          name="name"
          required
          maxLength={40}
          placeholder="Your name"
          className="flex-1 rounded-full border-2 border-ink/15 bg-white px-5 py-3 outline-none focus:border-coral"
        />
        <button
          type="submit"
          className="rounded-full bg-coral px-6 py-3 font-bold text-white hover:bg-coral-deep"
        >
          Continue
        </button>
      </form>
      {!hasGithub && (
        <p className="text-xs text-clay">
          (GitHub OAuth appears here once GITHUB_CLIENT_ID/SECRET are set — see SETUP.md)
        </p>
      )}
    </div>
  );
}

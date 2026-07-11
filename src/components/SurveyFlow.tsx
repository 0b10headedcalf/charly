"use client";

import Link from "next/link";
import { useState } from "react";
import { CharlyMascot } from "@/components/CharlyMascot";
import { GroupBadge } from "@/components/GroupBadge";
import { CAUSE_OPTIONS, STYLE_OPTIONS, TIME_OPTIONS } from "@/lib/survey";
import type { MatchResult } from "@/lib/types";

type Step = "intro" | "causes" | "styles" | "time" | "followup" | "reveal";

const STEP_ORDER: Step[] = ["intro", "causes", "styles", "time", "followup", "reveal"];

const BUBBLES: Record<Step, string> = {
  intro: "Hi, I'm Charly. Five quick taps and I'll find the crew where you'll do the most good. No forms, promise — well, one tiny fun one.",
  causes: "What pulls at your heart? Pick as many as you like.",
  styles: "How do you actually like to help?",
  time: "How much time feels right?",
  followup: "Okay, last one. This one's just between us — I wrote it only for you, and there's no wrong answer:",
  reveal: "Drumroll…",
};

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition ${
        selected
          ? "border-coral bg-coral text-white shadow-sm"
          : "border-ink/15 bg-white hover:border-coral/50"
      }`}
    >
      {label}
    </button>
  );
}

export function SurveyFlow({ userName }: { userName: string }) {
  const [step, setStep] = useState<Step>("intro");
  const [causes, setCauses] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [followup, setFollowup] = useState<{ question: string; options: string[] } | null>(null);
  const [followupAnswer, setFollowupAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<MatchResult | null>(null);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const answers = () => ({
    causes,
    styles,
    time,
    followupQuestion: followup?.question,
    followupAnswer,
  });

  async function loadFollowup() {
    setStep("followup");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "followup", answers: answers() }),
      });
      const data = await res.json();
      setFollowup({ question: data.question, options: data.options ?? [] });
    } catch {
      setFollowup({
        question:
          "Think of a time someone showed up for you when it really mattered. What would it mean to be that person for a neighbor this month?",
        options: [],
      });
    } finally {
      setBusy(false);
    }
  }

  async function complete(finalAnswer: string) {
    setFollowupAnswer(finalAnswer);
    setStep("reveal");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          answers: { ...answers(), followupAnswer: finalAnswer },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setMatched(data.matched as MatchResult);
      try {
        localStorage.setItem(
          "charly-member",
          JSON.stringify({ name: userName, groupId: data.matched.group.id })
        );
      } catch {
        // storage unavailable — event signups will prompt for a name
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-12">
      {/* progress */}
      <div className="mb-8 flex gap-2">
        {STEP_ORDER.slice(1).map((s, i) => (
          <div
            key={s}
            className={`h-2 w-8 rounded-full transition ${
              i < stepIndex ? "bg-coral" : "bg-ink/10"
            }`}
          />
        ))}
      </div>

      {/* Charly + speech bubble */}
      <div className="flex w-full items-start gap-3">
        <div className="shrink-0">
          <CharlyMascot size={64} />
        </div>
        <div className="relative flex-1 rounded-2xl rounded-bl-sm bg-white px-5 py-4 shadow-sm">
          {step === "intro" ? (
            <>
              <span className="font-bold">Hey {userName}!</span> {BUBBLES.intro}
            </>
          ) : (
            BUBBLES[step]
          )}
        </div>
      </div>

      <div className="mt-8 w-full">
        {step === "intro" && (
          <button
            onClick={() => setStep("causes")}
            className="mx-auto block rounded-full bg-coral px-8 py-3 text-lg font-bold text-white shadow-md hover:bg-coral-deep"
          >
            Let&apos;s go
          </button>
        )}

        {step === "causes" && (
          <StepShell
            onNext={() => setStep("styles")}
            nextDisabled={causes.length === 0}
          >
            <div className="flex flex-wrap gap-2">
              {CAUSE_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  label={o.label}
                  selected={causes.includes(o.id)}
                  onClick={() => toggle(causes, setCauses, o.id)}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === "styles" && (
          <StepShell
            onBack={() => setStep("causes")}
            onNext={() => setStep("time")}
            nextDisabled={styles.length === 0}
          >
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  label={o.label}
                  selected={styles.includes(o.id)}
                  onClick={() => toggle(styles, setStyles, o.id)}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === "time" && (
          <StepShell onBack={() => setStep("styles")} onNext={loadFollowup} nextDisabled={!time}>
            <div className="flex flex-col gap-2">
              {TIME_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  label={o.label}
                  selected={time === o.id}
                  onClick={() => setTime(o.id)}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === "followup" && (
          <div>
            {busy || !followup ? (
              <p className="animate-pulse text-center text-clay">
                Charly is thinking of the perfect question…
              </p>
            ) : (
              <>
                <p className="text-center text-lg font-bold">{followup.question}</p>
                <div className="mt-4 flex flex-col items-stretch gap-2">
                  {followup.options.map((o) => (
                    <Chip key={o} label={o} selected={false} onClick={() => complete(o)} />
                  ))}
                </div>
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (followupAnswer.trim()) complete(followupAnswer.trim());
                  }}
                >
                  <input
                    value={followupAnswer}
                    onChange={(e) => setFollowupAnswer(e.target.value)}
                    placeholder="…or tell me the real story, in your own words"
                    className="flex-1 rounded-full border-2 border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-coral"
                  />
                  <button
                    type="submit"
                    disabled={!followupAnswer.trim()}
                    className="rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {step === "reveal" && (
          <div className="flex flex-col items-center">
            {busy && (
              <p className="animate-pulse text-center text-clay">
                Matching you with your crew…
              </p>
            )}
            {error && (
              <div className="rounded-xl border-2 border-coral/40 bg-coral/10 px-4 py-3 text-sm">
                {error}{" "}
                <button onClick={() => complete(followupAnswer)} className="font-bold underline">
                  Try again
                </button>
              </div>
            )}
            {matched && (
              <div
                className="flyer w-full max-w-sm p-6 text-center"
                style={{ "--pin-color": matched.group.color } as React.CSSProperties}
              >
                <div className="flex justify-center">
                  <GroupBadge group={matched.group} size={56} />
                </div>
                <h2 className="mt-2 text-2xl font-extrabold">{matched.group.name}</h2>
                <p className="mt-1 font-semibold" style={{ color: matched.group.color }}>
                  {matched.group.tagline}
                </p>
                {matched.summary && <p className="mt-2 text-sm text-clay">{matched.summary}</p>}
                {matched.interests.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {matched.interests.map((tag) => (
                      <span key={tag} className="rounded-full bg-kraft px-3 py-1 text-xs font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-5 flex flex-col gap-2">
                  <Link
                    href={`/groups/${matched.group.id}`}
                    className="rounded-full bg-coral px-6 py-2.5 font-bold text-white hover:bg-coral-deep"
                  >
                    Meet your crew →
                  </Link>
                  <Link href="/profile" className="text-sm font-bold text-clay hover:text-ink">
                    See your profile
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StepShell({
  children,
  onBack,
  onNext,
  nextDisabled,
}: {
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextDisabled: boolean;
}) {
  return (
    <div>
      {children}
      <div className="mt-6 flex items-center justify-between">
        {onBack ? (
          <button onClick={onBack} className="text-sm font-bold text-clay hover:text-ink">
            ← Back
          </button>
        ) : (
          <span />
        )}
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="rounded-full bg-coral px-7 py-2.5 font-bold text-white shadow-sm disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

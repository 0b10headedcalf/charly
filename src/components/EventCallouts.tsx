"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { OrgEvent } from "@/lib/types";

// Set by the chat page after Charli matches the user.
export const MEMBER_STORAGE_KEY = "charly-member";

export function EventCallouts({
  initialEvents,
  orgNames,
  color,
}: {
  initialEvents: OrgEvent[];
  orgNames: Record<string, string>;
  color: string;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MEMBER_STORAGE_KEY);
      if (saved) setName((JSON.parse(saved) as { name?: string }).name ?? "");
    } catch {
      // ignore bad localStorage
    }
  }, []);

  async function join(eventId: string) {
    const who = name.trim() || window.prompt("Your name for the signup sheet?")?.trim();
    if (!who) return;
    setName(who);
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signup", eventId, name: who }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      setEvents((prev) => prev.map((e) => (e.id === data.event.id ? data.event : e)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signup failed");
    }
  }

  if (events.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold">Crew callouts</h2>
      <p className="mt-1 text-sm text-clay">
        Partner orgs are recruiting this crew right now.
      </p>
      {error && (
        <div className="mt-3 rounded-xl border-2 border-coral/40 bg-coral/10 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      <div className="mt-4 space-y-4">
        {events.map((ev) => {
          const joined = ev.signups.some(
            (s) => s.name.toLowerCase() === name.trim().toLowerCase() && name.trim()
          );
          return (
            <div key={ev.id} className="rounded-xl bg-white/80 p-5 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-bold">{ev.title}</h3>
                <span className="text-sm font-bold text-clay">{ev.when}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-clay">
                <Link href={`/orgs/${ev.orgId}`} className="hover:text-ink">
                  {orgNames[ev.orgId] ?? ev.orgId}
                </Link>
              </p>
              {ev.description && <p className="mt-2 text-sm text-clay">{ev.description}</p>}
              {ev.needs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ev.needs.map((n) => (
                    <span key={n} className="rounded-full bg-kraft px-3 py-1 text-xs font-bold">
                      {n}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-sm text-clay">
                  {ev.signups.length} in so far
                  {ev.signups.length > 0 && ` — ${ev.signups.map((s) => s.name).join(", ")}`}
                </span>
                <button
                  onClick={() => join(ev.id)}
                  disabled={joined}
                  className="shrink-0 rounded-full px-5 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-50"
                  style={{ backgroundColor: color }}
                >
                  {joined ? "You're in ✓" : "I'm in"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

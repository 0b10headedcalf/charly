"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Org, OrgEvent } from "@/lib/types";

export function OrgHQ({
  org,
  initialEvents,
  color,
}: {
  org: Org;
  initialEvents: OrgEvent[];
  color: string;
}) {
  const [events, setEvents] = useState<OrgEvent[]>(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", when: "", needs: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post(body: object): Promise<OrgEvent | null> {
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data.event as OrgEvent;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      return null;
    }
  }

  async function createEvent(e: { preventDefault: () => void }) {
    e.preventDefault();
    setBusy(true);
    const event = await post({ action: "create", orgId: org.id, ...form });
    setBusy(false);
    if (event) {
      setEvents((prev) => [event, ...prev]);
      setForm({ title: "", description: "", when: "", needs: "" });
      setShowForm(false);
    }
  }

  async function addLog(eventId: string, text: string) {
    const event = await post({ action: "log", eventId, text });
    if (event) setEvents((prev) => prev.map((ev) => (ev.id === event.id ? event : ev)));
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold">Events & recruiting</h2>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-full px-5 py-2 text-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: color }}
          >
            {showForm ? "Cancel" : "+ Post an event"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border-2 border-coral/40 bg-coral/10 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={createEvent} className="mt-4 space-y-3 rounded-xl bg-white/80 p-5 shadow-sm">
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Event title"
              className="w-full rounded-lg border-2 border-ink/15 bg-white px-4 py-2.5 outline-none focus:border-coral"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's happening and why it matters"
              rows={2}
              className="w-full rounded-lg border-2 border-ink/15 bg-white px-4 py-2.5 outline-none focus:border-coral"
            />
            <div className="flex flex-wrap gap-3">
              <input
                value={form.when}
                onChange={(e) => setForm({ ...form, when: e.target.value })}
                placeholder="When (e.g. Saturday 10am)"
                className="flex-1 rounded-lg border-2 border-ink/15 bg-white px-4 py-2.5 outline-none focus:border-coral"
              />
              <input
                value={form.needs}
                onChange={(e) => setForm({ ...form, needs: e.target.value })}
                placeholder="Needs, comma-separated"
                className="flex-1 rounded-lg border-2 border-ink/15 bg-white px-4 py-2.5 outline-none focus:border-coral"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-coral px-6 py-2.5 font-bold text-white disabled:opacity-40"
            >
              {busy ? "Posting…" : "Post to the crews"}
            </button>
            <p className="text-xs text-clay">
              Posts to: crews this org partners with. Members see it on their group page.
            </p>
          </form>
        )}

        <div className="mt-5 space-y-5">
          {events.length === 0 && !showForm && (
            <p className="text-sm text-clay">No events yet — post one to start recruiting.</p>
          )}
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} onLog={addLog} />
          ))}
        </div>
      </div>

      <aside>
        <Copilot orgId={org.id} color={color} />
      </aside>
    </div>
  );
}

function EventCard({
  event,
  onLog,
}: {
  event: OrgEvent;
  onLog: (eventId: string, text: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="rounded-xl bg-white/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold">{event.title}</h3>
        <span className="text-sm font-bold text-clay">{event.when}</span>
      </div>
      {event.description && <p className="mt-1 text-sm text-clay">{event.description}</p>}
      {event.needs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {event.needs.map((n) => (
            <span key={n} className="rounded-full bg-kraft px-3 py-1 text-xs font-bold">
              {n}
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 text-sm">
        <span className="font-bold">{event.signups.length} signed up</span>
        {event.signups.length > 0 && (
          <span className="text-clay"> — {event.signups.map((s) => s.name).join(", ")}</span>
        )}
      </p>

      {event.log.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-ink/10 pt-3 text-sm text-clay">
          {event.log.map((l, i) => (
            <li key={i} className="border-l-2 border-marigold/60 pl-2.5">
              {l.text}
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-3 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!note.trim()) return;
          await onLog(event.id, note.trim());
          setNote("");
        }}
      >
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a record note…"
          className="flex-1 rounded-lg border-2 border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-coral"
        />
        <button
          type="submit"
          disabled={!note.trim()}
          className="rounded-lg bg-kraft px-4 py-2 text-sm font-bold disabled:opacity-40"
        >
          Log
        </button>
      </form>
    </div>
  );
}

function Copilot({ orgId, color }: { orgId: string; color: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Copilot failed");
      setAnswer(data.answer as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Copilot failed");
    } finally {
      setBusy(false);
    }
  }

  const suggestions = [
    "Who signed up so far?",
    "What roles are still unfilled?",
    "Draft a recruitment message for the crews",
  ];

  return (
    <div className="rounded-xl bg-white/80 p-5 shadow-sm">
      <h2 className="text-xl font-bold">Ops copilot</h2>
      <p className="mt-1 text-sm text-clay">
        Asks your live records: events, signups, needs, and log notes.
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) ask(question.trim());
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your org…"
          className="flex-1 rounded-lg border-2 border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-coral"
        />
        <button
          type="submit"
          disabled={busy || !question.trim()}
          className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          style={{ backgroundColor: color }}
        >
          Ask
        </button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => {
              setQuestion(s);
              ask(s);
            }}
            disabled={busy}
            className="rounded-full bg-kraft px-3 py-1 text-xs font-bold hover:bg-kraft/70 disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>

      {busy && <p className="mt-3 animate-pulse text-sm text-clay">Copilot is reading the records…</p>}
      {error && (
        <div className="mt-3 rounded-lg border-2 border-coral/40 bg-coral/10 px-3 py-2 text-sm">
          {error}
        </div>
      )}
      {answer && !busy && (
        <div className="plan-md mt-3 border-t border-ink/10 pt-3 text-sm">
          <ReactMarkdown>{answer}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

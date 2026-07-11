"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CharliMascot } from "@/components/CharliMascot";
import type { ChatMessage, MatchResult } from "@/lib/types";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi!! I'm Charli 🧡 I help neighbors find their volunteer crew. So — what's something in your neighborhood you wish were better?",
};

export default function ChatPage() {
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<MatchResult | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy, matched]);

  async function send() {
    const text = input.trim();
    if (!text || busy || matched) return;
    setError(null);
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      if (data.matched) setMatched(data.matched as MatchResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!started) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-20 text-center">
        <CharliMascot size={110} />
        <h1 className="text-3xl font-extrabold">Say hi to Charli</h1>
        <p className="text-clay">
          A two-minute chat, and Charli finds the crew where you&apos;ll do the most
          good.
        </p>
        <form
          className="flex w-full gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) setStarted(true);
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should Charli call you?"
            maxLength={40}
            className="flex-1 rounded-full border-2 border-ink/15 bg-white px-5 py-3 outline-none focus:border-coral"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-full bg-coral px-6 py-3 font-bold text-white disabled:opacity-40"
          >
            Start
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col px-4 py-8">
      <div className="flex-1 space-y-4">
        {messages.map((m, i) =>
          m.role === "assistant" ? (
            <div key={i} className="flex items-end gap-2">
              <div className="shrink-0">
                <CharliMascot size={36} />
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-marigold/90 px-4 py-3 text-ink shadow-sm">
                {m.content}
              </div>
            </div>
          )
        )}

        {busy && (
          <div className="flex items-end gap-2">
            <div className="shrink-0">
              <CharliMascot size={36} />
            </div>
            <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-clay shadow-sm">
              <span className="animate-pulse">Charli is thinking…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border-2 border-coral/40 bg-coral/10 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {matched && (
          <div
            className="flyer mx-auto mt-6 max-w-sm p-6 text-center"
            style={{ "--pin-color": matched.group.color } as React.CSSProperties}
          >
            <div className="text-4xl">{matched.group.emoji}</div>
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
            <Link
              href={`/groups/${matched.group.id}`}
              className="mt-5 inline-block rounded-full bg-coral px-6 py-2.5 font-bold text-white hover:bg-coral-deep"
            >
              Meet your crew →
            </Link>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!matched && (
        <form
          className="sticky bottom-4 mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Tell Charli, ${name}…`}
            className="flex-1 rounded-full border-2 border-ink/15 bg-white px-5 py-3 shadow-sm outline-none focus:border-coral"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-full bg-coral px-6 py-3 font-bold text-white shadow-sm disabled:opacity-40"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}

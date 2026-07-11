import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import orgsData from "../../../../data/orgs.json";
import { addEvent, updateEvent } from "@/lib/store";
import type { Org, OrgEvent } from "@/lib/types";

type EventAction =
  | {
      action: "create";
      orgId: string;
      title: string;
      description: string;
      when: string;
      needs: string;
    }
  | { action: "signup"; eventId: string; name: string }
  | { action: "log"; eventId: string; text: string };

export async function POST(req: Request) {
  const body = (await req.json()) as EventAction;

  if (body.action === "create") {
    const org = (orgsData as Org[]).find((o) => o.id === body.orgId);
    if (!org) return NextResponse.json({ error: "Unknown org" }, { status: 400 });
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Event needs a title" }, { status: 400 });
    }
    const event: OrgEvent = {
      id: randomUUID(),
      orgId: org.id,
      groupIds: org.groupIds,
      title: body.title.trim().slice(0, 80),
      description: (body.description ?? "").trim().slice(0, 400),
      when: (body.when ?? "").trim().slice(0, 60),
      needs: (body.needs ?? "")
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
        .slice(0, 6),
      signups: [],
      log: [],
      createdAt: new Date().toISOString(),
    };
    await addEvent(event);
    return NextResponse.json({ event });
  }

  if (body.action === "signup") {
    const name = (body.name ?? "").trim().slice(0, 40);
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const event = await updateEvent(body.eventId, (e) => {
      if (!e.signups.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
        e.signups.push({ name, at: new Date().toISOString() });
      }
    });
    if (!event) return NextResponse.json({ error: "Unknown event" }, { status: 404 });
    return NextResponse.json({ event });
  }

  if (body.action === "log") {
    const text = (body.text ?? "").trim().slice(0, 300);
    if (!text) return NextResponse.json({ error: "Note required" }, { status: 400 });
    const event = await updateEvent(body.eventId, (e) => {
      e.log.push({ text, at: new Date().toISOString() });
    });
    if (!event) return NextResponse.json({ error: "Unknown event" }, { status: 404 });
    return NextResponse.json({ event });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

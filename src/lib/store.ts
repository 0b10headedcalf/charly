import { promises as fs } from "fs";
import path from "path";
import type { ActionPlan, AppState, Member, OrgEvent } from "./types";
import seedMembers from "../../data/seed-members.json";
import seedEvents from "../../data/seed-events.json";

const STATE_PATH = path.join(process.cwd(), "data", "state.json");

export async function readState(): Promise<AppState> {
  let state: AppState;
  try {
    const raw = await fs.readFile(STATE_PATH, "utf8");
    state = JSON.parse(raw) as AppState;
  } catch {
    state = {
      members: seedMembers as Member[],
      plans: {},
      events: seedEvents as OrgEvent[],
    };
    await writeState(state);
    return state;
  }
  // migrate states written before events existed
  if (!state.events) {
    state.events = seedEvents as OrgEvent[];
    await writeState(state);
  }
  return state;
}

export async function writeState(state: AppState): Promise<void> {
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

export async function addMember(member: Member): Promise<void> {
  const state = await readState();
  state.members.push(member);
  await writeState(state);
}

export async function savePlan(plan: ActionPlan): Promise<void> {
  const state = await readState();
  state.plans[plan.groupId] = plan;
  await writeState(state);
}

export async function addEvent(event: OrgEvent): Promise<void> {
  const state = await readState();
  state.events.push(event);
  await writeState(state);
}

export async function updateEvent(
  eventId: string,
  update: (e: OrgEvent) => void
): Promise<OrgEvent | null> {
  const state = await readState();
  const event = state.events.find((e) => e.id === eventId);
  if (!event) return null;
  update(event);
  await writeState(state);
  return event;
}

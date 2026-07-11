import { promises as fs } from "fs";
import path from "path";
import type { ActionPlan, AppState, Member } from "./types";
import seedMembers from "../../data/seed-members.json";

const STATE_PATH = path.join(process.cwd(), "data", "state.json");

export async function readState(): Promise<AppState> {
  try {
    const raw = await fs.readFile(STATE_PATH, "utf8");
    return JSON.parse(raw) as AppState;
  } catch {
    const initial: AppState = { members: seedMembers as Member[], plans: {} };
    await writeState(initial);
    return initial;
  }
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

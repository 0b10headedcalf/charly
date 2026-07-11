export type Group = {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  color: string;
  keywords: string[];
};

export type Org = {
  id: string;
  name: string;
  groupIds: string[];
  neighborhood: string;
  mission: string;
  needs: string[];
  capacity: number;
  contact: string;
};

export type Member = {
  id: string;
  name: string;
  groupId: string;
  interests: string[];
  joinedAt: string;
  userId?: string; // session id (google-* or guest-*)
  avatarUrl?: string;
  summary?: string;
};

export type ActionPlan = {
  groupId: string;
  markdown: string;
  citations: string[];
  source: "agent" | "inference" | "mock";
  generatedAt: string;
};

export type OrgEvent = {
  id: string;
  orgId: string;
  groupIds: string[];
  title: string;
  description: string;
  when: string;
  needs: string[];
  signups: { name: string; at: string }[];
  log: { text: string; at: string }[];
  createdAt: string;
};

// Participant-facing version of an ActionPlan, rewritten by Gradient AI
// into a printable handout. planGeneratedAt keys the cache: regenerating
// the plan invalidates the handout.
export type Handout = {
  groupId: string;
  headline: string;
  intro: string;
  weeks: { title: string; items: { action: string; org: string; when: string }[] }[];
  bring: string[];
  roles: string[];
  source: "inference" | "mock";
  generatedAt: string;
  planGeneratedAt: string;
};

export type AppState = {
  members: Member[];
  plans: Record<string, ActionPlan>;
  events: OrgEvent[];
  handouts: Record<string, Handout>;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type MatchResult = {
  group: Group;
  member: Member;
  interests: string[];
  summary: string;
};

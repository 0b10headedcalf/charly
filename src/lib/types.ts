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

export type AppState = {
  members: Member[];
  plans: Record<string, ActionPlan>;
  events: OrgEvent[];
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

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
};

export type ActionPlan = {
  groupId: string;
  markdown: string;
  citations: string[];
  source: "agent" | "inference" | "mock";
  generatedAt: string;
};

export type AppState = {
  members: Member[];
  plans: Record<string, ActionPlan>;
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

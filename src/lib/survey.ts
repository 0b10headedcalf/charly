// The fixed skeleton of Charly's welcome survey. Steps 1-3 are structured
// UI (no model needed); step 4 is a single AI-generated follow-up question
// from a cheap model; then everything is summarized + classified.

export const CAUSE_OPTIONS = [
  { id: "food", label: "🥕 Food & hunger" },
  { id: "housing", label: "🏠 Housing & homelessness" },
  { id: "environment", label: "🌱 Parks & environment" },
  { id: "education", label: "📚 Kids & education" },
  { id: "elders", label: "🌷 Older neighbors" },
  { id: "animals", label: "🐾 Animals" },
];

export const STYLE_OPTIONS = [
  { id: "hands-on", label: "💪 Hands-on work" },
  { id: "driving", label: "🚗 Driving & deliveries" },
  { id: "teaching", label: "🧑‍🏫 Teaching & mentoring" },
  { id: "cooking", label: "🍲 Cooking" },
  { id: "tech", label: "📱 Tech help" },
  { id: "organizing", label: "📋 Organizing people" },
  { id: "listening", label: "💬 Visiting & listening" },
];

export const TIME_OPTIONS = [
  { id: "monthly", label: "A couple hours a month" },
  { id: "weekly", label: "A few hours every week" },
  { id: "weekends", label: "Most weekends" },
  { id: "flexible", label: "Whenever I'm free" },
];

export type SurveyAnswers = {
  causes: string[];
  styles: string[];
  time: string;
  followupQuestion?: string;
  followupAnswer?: string;
};

export function answersToText(a: SurveyAnswers): string {
  return `Causes: ${a.causes.join(", ") || "unsure"}. Ways of helping: ${a.styles.join(", ") || "unsure"}. Time: ${a.time || "unsure"}.${
    a.followupQuestion ? ` Q: "${a.followupQuestion}" A: "${a.followupAnswer ?? ""}".` : ""
  }`;
}

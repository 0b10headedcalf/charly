import { redirect } from "next/navigation";

// Onboarding moved from free-form chat to Charli's welcome survey.
export default function ChatPage() {
  redirect("/join");
}

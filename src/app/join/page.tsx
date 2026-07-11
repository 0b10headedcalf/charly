import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SurveyFlow } from "@/components/SurveyFlow";

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const session = await getSession();
  if (!session) redirect("/signin");
  return <SurveyFlow userName={session.name} />;
}

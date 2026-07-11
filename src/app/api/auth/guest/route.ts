import { requestOrigin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim().slice(0, 40);
  if (!name) {
    return NextResponse.redirect(`${requestOrigin(req)}/signin?error=name-required`, 303);
  }
  const res = NextResponse.redirect(`${requestOrigin(req)}/join`, 303);
  res.cookies.set(
    sessionCookie({ id: `guest-${randomUUID()}`, name, provider: "guest" })
  );
  return res;
}

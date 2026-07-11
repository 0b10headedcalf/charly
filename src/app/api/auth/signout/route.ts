import { requestOrigin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  const res = NextResponse.redirect(`${requestOrigin(req)}/`, 303);
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}

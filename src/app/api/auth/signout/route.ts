import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}

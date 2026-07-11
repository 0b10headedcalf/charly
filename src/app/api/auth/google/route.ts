import { NextResponse } from "next/server";
import { requestOrigin } from "@/lib/auth";

export async function GET(req: Request) {
  const origin = requestOrigin(req);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(`${origin}/signin?error=google-not-configured`);
  }
  const redirectUri = `${origin}/api/auth/callback`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  return NextResponse.redirect(url);
}

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/signin?error=github-not-configured", req.url));
  }
  const redirectUri = new URL("/api/auth/callback", req.url).toString();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "read:user");
  return NextResponse.redirect(url);
}

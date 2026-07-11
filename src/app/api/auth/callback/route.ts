import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth";

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/signin?error=oauth-failed", req.url));
  }

  try {
    const redirectUri = new URL("/api/auth/callback", req.url).toString();
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const { access_token } = (await tokenRes.json()) as { access_token?: string };
    if (!access_token) throw new Error("no access token");

    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const user = (await userRes.json()) as {
      sub: string;
      name?: string;
      given_name?: string;
      picture?: string;
      email?: string;
    };

    const res = NextResponse.redirect(new URL("/join", req.url));
    res.cookies.set(
      sessionCookie({
        id: `google-${user.sub}`,
        name: user.name || user.given_name || user.email?.split("@")[0] || "Neighbor",
        avatarUrl: user.picture,
        provider: "google",
      })
    );
    return res;
  } catch (err) {
    console.error("google oauth failed:", err);
    return NextResponse.redirect(new URL("/signin?error=oauth-failed", req.url));
  }
}

import { NextResponse } from "next/server";
import { requestOrigin, sessionCookie } from "@/lib/auth";

export async function GET(req: Request) {
  const origin = requestOrigin(req);
  const code = new URL(req.url).searchParams.get("code");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/signin?error=oauth-failed`);
  }

  try {
    // must byte-match the redirect_uri sent in the authorize step
    const redirectUri = `${origin}/api/auth/callback`;
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

    const res = NextResponse.redirect(`${origin}/join`);
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
    return NextResponse.redirect(`${origin}/signin?error=oauth-failed`);
  }
}

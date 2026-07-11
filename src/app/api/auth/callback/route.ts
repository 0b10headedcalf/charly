import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth";

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code");
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/signin?error=oauth-failed", req.url));
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const { access_token } = (await tokenRes.json()) as { access_token?: string };
    if (!access_token) throw new Error("no access token");

    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const user = (await userRes.json()) as {
      id: number;
      login: string;
      name?: string;
      avatar_url?: string;
    };

    const res = NextResponse.redirect(new URL("/join", req.url));
    res.cookies.set(
      sessionCookie({
        id: `github-${user.id}`,
        name: user.name || user.login,
        avatarUrl: user.avatar_url,
        provider: "github",
      })
    );
    return res;
  } catch (err) {
    console.error("github oauth failed:", err);
    return NextResponse.redirect(new URL("/signin?error=oauth-failed", req.url));
  }
}

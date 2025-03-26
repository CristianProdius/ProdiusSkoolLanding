// app/api/auth/outlook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return redirectToMicrosoftAuth();
  } else {
    return await handleCallback(request, code);
  }
}

// Step 1: Redirect to Microsoft login
function redirectToMicrosoftAuth() {
  const params = new URLSearchParams({
    client_id: process.env.OUTLOOK_CLIENT_ID || "",
    response_type: "code",
    redirect_uri: process.env.OUTLOOK_REDIRECT_URI || "",
    response_mode: "query",
    scope: [
      "openid",
      "profile",
      "offline_access",
      "https://graph.microsoft.com/Calendars.ReadWrite",
    ].join(" "),
  });

  return NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  );
}

// Step 2: Handle callback and store tokens in DB
async function handleCallback(request: NextRequest, code: string) {
  // 1) Construct the token endpoint
  const tokenUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;

  // 2) Build POST params
  const bodyParams = new URLSearchParams({
    client_id: process.env.OUTLOOK_CLIENT_ID || "",
    client_secret: process.env.OUTLOOK_CLIENT_SECRET || "",
    redirect_uri: process.env.OUTLOOK_REDIRECT_URI || "",
    grant_type: "authorization_code",
    code,
  });
  bodyParams.append(
    "scope",
    [
      "openid",
      "profile",
      "offline_access",
      "https://graph.microsoft.com/Calendars.ReadWrite",
    ].join(" ")
  );

  // 3) Fetch tokens
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: bodyParams,
  });

  if (!response.ok) {
    console.error("Token exchange failed", await response.text());
    const errorUrl = new URL("/", request.url);
    errorUrl.searchParams.set("error", "outlook-token-exchange-failed");
    return NextResponse.redirect(errorUrl);
  }

  const tokenData = await response.json();
  // tokenData has { access_token, refresh_token, expires_in, etc. }

  // 4) Store only the token data in the DB
  const sessionId = randomUUID();
  await prisma.oAuthToken.create({
    data: {
      id: sessionId,
      provider: "outlook",
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? "",
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
    },
  });

  // 5) Put just the sessionId in a small cookie
  const successUrl = new URL("/book", request.url);
  const responseRedirect = NextResponse.redirect(successUrl, { status: 302 });
  responseRedirect.cookies.set("outlook_session_id", sessionId, {
    httpOnly: true,
    secure: false, // For local dev (set to true in production + https)
    sameSite: "lax",
    path: "/",
    maxAge: tokenData.expires_in,
  });

  return responseRedirect;
}

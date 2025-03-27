// app/api/admin/outlook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return redirectToMicrosoftAuth();
  }

  return await handleCallback(request, code);
}

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
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`
  );
}

async function handleCallback(request: NextRequest, code: string) {
  const tokenUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;

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
  // e.g. { access_token, refresh_token, expires_in, ... }

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  // Upsert with id = "teacher-outlook"
  await prisma.oAuthToken.upsert({
    where: { id: "teacher-outlook" },
    update: {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? "",
      expiresAt,
    },
    create: {
      id: "teacher-outlook",
      provider: "outlook",
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? "",
      expiresAt,
    },
  });

  // redirect to /admin or wherever
  const successUrl = new URL("/admin?connected=1", request.url);
  return NextResponse.redirect(successUrl);
}

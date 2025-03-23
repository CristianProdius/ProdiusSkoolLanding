import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
// 1) Import the GaxiosError interface
import { GaxiosError } from "gaxios";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI!;
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // Construct base URL and redirect
    const baseUrl = new URL(req.url).origin;
    const response = NextResponse.redirect(`${baseUrl}/book`);

    response.cookies.set("google_oauth_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    if (error instanceof GaxiosError) {
      // 2) We can safely access error.response?.data as 'unknown' here
      console.error("Error exchanging code for tokens:", error.response?.data);
    } else {
      // fallback if it's not a GaxiosError
      console.error("Error exchanging code for tokens:", error);
    }

    return NextResponse.json(
      { error: "Token exchange failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  try {
    // Extract stored tokens from cookie:
    const cookies = req.headers.get("cookie") || "";
    const match = cookies.match(/google_oauth_tokens=([^;]+)/);
    if (!match) {
      return NextResponse.json({ error: "No tokens found" }, { status: 401 });
    }
    const tokens = JSON.parse(decodeURIComponent(match[1]));

    // Parse request body for event data
    const body = await req.json();
    const { summary, description, startDateTime, endDateTime, attendees } =
      body;

    // Use env credentials
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI!;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const event = {
      summary: summary || "Untitled",
      description: description || "",
      start: {
        dateTime: startDateTime,
        timeZone: "Europe/Bucharest",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "Europe/Bucharest",
      },
      attendees: (attendees || []).map((email: string) => ({ email })),
    };

    const created = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      sendUpdates: "all", // send email invites
    });

    return NextResponse.json({
      message: "Event created",
      htmlLink: created.data.htmlLink,
      eventId: created.data.id,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

// lib/googleCalendar.ts

import { google } from "googleapis";

/**
 * Creates a new Google Calendar event and returns the event data (including ID).
 * `attendees` should be an array of strings (email addresses).
 */
export async function createCalendarEvent(
  subjectName: string,
  teacherName: string,
  startDate: Date,
  endDate: Date,
  calendarId: string,
  attendees: string[] = [] // optional, defaults to empty
) {
  const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);

  // Create JWT client with service account key
  const auth = new google.auth.JWT(
    serviceAccountKey.client_email,
    undefined,
    serviceAccountKey.private_key,
    ["https://www.googleapis.com/auth/calendar"] // read/write calendar
  );
  await auth.authorize();

  const calendar = google.calendar({ version: "v3", auth });

  // Build attendee objects, e.g. [ {email: 'stud1@example.com'}, {email: 'stud2@example.com'} ]
  const attendeeObjects = attendees.map((email) => ({ email }));

  // Insert event
  const event = {
    summary: `Lecție Demo: ${subjectName}`,
    description: `Profesor: ${teacherName}\nLecție programată`,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: "Europe/Bucharest",
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: "Europe/Bucharest",
    },
    attendees: attendeeObjects, // pass the array here
  };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  console.log("Google Calendar event created:", response.data.htmlLink);
  return response.data; // e.g. { id: 'abc123', ... }
}

/**
 * Adds a single attendee to an existing GCal event by eventId.
 */
export async function addAttendeeToEvent(
  calendarId: string,
  eventId: string,
  newAttendeeEmail: string
) {
  const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
  const auth = new google.auth.JWT(
    serviceAccountKey.client_email,
    undefined,
    serviceAccountKey.private_key,
    ["https://www.googleapis.com/auth/calendar"]
  );
  await auth.authorize();

  const calendar = google.calendar({ version: "v3", auth });

  // Get existing event
  const eventRes = await calendar.events.get({
    calendarId,
    eventId,
  });
  const event = eventRes.data;

  const currentAttendees = event.attendees || [];
  // Only add if not already in the list
  if (!currentAttendees.some((a) => a.email === newAttendeeEmail)) {
    currentAttendees.push({ email: newAttendeeEmail });
    // Patch the event
    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: { attendees: currentAttendees },
    });
  }
}

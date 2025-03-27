// app/api/book/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { Booking } from "@prisma/client";
import { BookingStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fallback capacity if subject doesn’t specify one
const DEFAULT_MAX_CAPACITY = 3;

/**
 * A "FullBooking" includes teacher, subject, and student data.
 */
export type FullBooking = Booking & {
  teacher: {
    id: number;
    name: string;
    email?: string | null;
  };
  subject: {
    id: number;
    name: string;
    maxCapacity?: number;
  };
  student: {
    name: string;
    email: string;
    phone?: string | null;
  };
};

/**
 * Represents an Outlook event attendee.
 */
interface OutlookAttendee {
  emailAddress: {
    address: string;
  };
  type?: string;
}

/**
 * Interface for sending mail via Microsoft Graph.
 */
interface GraphMailPayload {
  subject: string;
  body: {
    contentType: "Text" | "HTML";
    content: string;
  };
  toRecipients: {
    emailAddress: { address: string };
  }[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subjectId, teacherId, date, timeslot, name, email, phone } = body;

    // 1) Validate required fields
    if (!subjectId || !teacherId || !date || !timeslot || !name || !email) {
      return NextResponse.json(
        {
          message:
            "Data incomplete! Provide subjectId, teacherId, date, timeslot, name, email.",
        },
        { status: 400 }
      );
    }

    // 2) Load subject to get maxCapacity
    const subject = await prisma.subject.findUnique({
      where: { id: Number(subjectId) },
    });
    if (!subject) {
      return NextResponse.json(
        { message: "Subject not found." },
        { status: 404 }
      );
    }
    const maxCapacity = subject.maxCapacity ?? DEFAULT_MAX_CAPACITY;

    // 3) Count current bookings for that teacher/date/timeslot
    const currentCount = await prisma.booking.count({
      where: {
        teacherId: Number(teacherId),
        date: new Date(date),
        timeslot,
        status: { not: BookingStatus.CANCELED },
      },
    });

    // 4) If teacher is full, attempt to find an alternative teacher
    if (currentCount >= maxCapacity) {
      const altTeacherId = await findAlternativeTeacher(
        Number(subjectId),
        date,
        timeslot
      );
      if (!altTeacherId) {
        return NextResponse.json(
          { message: "All teachers are full at that date/time." },
          { status: 400 }
        );
      }

      const booking = await prisma.booking.create({
        data: {
          subject: { connect: { id: Number(subjectId) } },
          teacher: { connect: { id: altTeacherId } },
          date: new Date(date),
          timeslot,
          status: BookingStatus.PENDING,
          student: {
            connectOrCreate: {
              where: { email },
              create: { name, email, phone },
            },
          },
        },
        include: { teacher: true, subject: true, student: true },
      });

      await upsertCalendarEventAndSendEmails(booking, true);
      await checkAndConfirmGroup(altTeacherId, date, timeslot);

      return NextResponse.json(
        { success: true, switchedTeacher: altTeacherId },
        { status: 200 }
      );
    }

    // 5) Otherwise, create booking with chosen teacher
    const booking = await prisma.booking.create({
      data: {
        subject: { connect: { id: Number(subjectId) } },
        teacher: { connect: { id: Number(teacherId) } },
        date: new Date(date),
        timeslot,
        status: BookingStatus.PENDING,
        student: {
          connectOrCreate: { where: { email }, create: { name, email, phone } },
        },
      },
      include: { teacher: true, subject: true, student: true },
    });

    await upsertCalendarEventAndSendEmails(booking, false);
    await checkAndConfirmGroup(Number(teacherId), date, timeslot);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Error booking:", err);
    return NextResponse.json(
      { message: "Server error. Try again later." },
      { status: 500 }
    );
  }
}

/**
 * findAlternativeTeacher:
 * Tries to find another teacher for the given subject/date/timeslot who isn't full.
 */
async function findAlternativeTeacher(
  subjectId: number,
  date: string,
  timeslot: string
) {
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return null;
  const maxCapacity = subject.maxCapacity ?? DEFAULT_MAX_CAPACITY;

  const teachers = await prisma.teacher.findMany({ where: { subjectId } });
  for (const t of teachers) {
    const count = await prisma.booking.count({
      where: {
        teacherId: t.id,
        date: new Date(date),
        timeslot,
        status: { not: BookingStatus.CANCELED },
      },
    });
    if (count < maxCapacity) return t.id;
  }
  return null;
}

/**
 * upsertCalendarEventAndSendEmails:
 * - Refreshes teacher tokens if needed.
 * - Creates or updates the Outlook calendar event.
 * - Sends teacher and student "PENDING" emails via Graph API.
 */
async function upsertCalendarEventAndSendEmails(
  booking: FullBooking,
  switched: boolean
) {
  // 1) Build start and end Date from booking.timeslot
  const [startH, startM] = booking.timeslot.split("-")[0].trim().split(":");
  const [endH, endM] = booking.timeslot.split("-")[1].trim().split(":");
  const startDate = new Date(booking.date);
  startDate.setHours(+startH, +startM, 0, 0);
  const endDate = new Date(booking.date);
  endDate.setHours(+endH, +endM, 0, 0);

  // 2) Refresh and load teacher token
  const tokenRow = await refreshOutlookTokenIfNeeded();
  if (!tokenRow) {
    console.warn(
      "No teacher-outlook tokens. Skipping event creation and email sending."
    );
    return;
  }
  const accessToken = tokenRow.accessToken;

  // 3) Look for an existing event in DB
  const existingEvent = await prisma.calendarEvent.findUnique({
    where: {
      unique_event_per_slot: {
        teacherId: booking.teacher.id,
        date: booking.date,
        timeslot: booking.timeslot,
      },
    },
  });

  let outlookEventId: string | null = null;

  if (!existingEvent) {
    // CREATE new event in Outlook
    const createRes = await fetch(
      "https://graph.microsoft.com/v1.0/me/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: `Lecție Demo: ${booking.subject.name}`,
          body: {
            contentType: "Text",
            content: `Profesor: ${booking.teacher.name}\nLecție programată`,
          },
          start: {
            dateTime: startDate.toISOString(),
            timeZone: "Europe/Bucharest",
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: "Europe/Bucharest",
          },
          attendees: [
            {
              emailAddress: { address: booking.student.email },
              type: "required",
            },
            {
              emailAddress: {
                address: booking.teacher.email ?? "school@domain.com",
              },
              type: "required",
            },
          ],
        }),
      }
    );

    if (!createRes.ok) {
      console.error("Failed to create Outlook event:", await createRes.text());
    } else {
      const eventJson = await createRes.json();
      outlookEventId = eventJson.id;
      await prisma.calendarEvent.create({
        data: {
          teacherId: booking.teacher.id,
          date: booking.date,
          timeslot: booking.timeslot,
          outlookEventId,
          googleEventId: "",
        },
      });
    }
  } else {
    // UPDATE existing event by adding the new attendee if missing
    outlookEventId = existingEvent.outlookEventId;
    if (outlookEventId) {
      const getRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/events/${outlookEventId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (getRes.ok) {
        const eventData = await getRes.json();
        // Cast attendees to OutlookAttendee[] for type safety
        const currentAttendees =
          (eventData.attendees as OutlookAttendee[]) || [];
        const newAttendee: OutlookAttendee = {
          emailAddress: { address: booking.student.email },
          type: "required",
        };
        if (
          !currentAttendees.some(
            (a) => a.emailAddress.address === booking.student.email
          )
        ) {
          currentAttendees.push(newAttendee);

          const patchRes = await fetch(
            `https://graph.microsoft.com/v1.0/me/events/${outlookEventId}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ attendees: currentAttendees }),
            }
          );
          if (!patchRes.ok) {
            console.error(
              "Failed to update Outlook event attendees:",
              await patchRes.text()
            );
          }
        }
      }
    }
  }

  // 4) Send "PENDING" emails via Graph API
  await sendRegistrationEmailsViaGraph(booking, switched, accessToken);
}

/**
 * Sends teacher and student "PENDING" emails using Microsoft Graph.
 */
async function sendRegistrationEmailsViaGraph(
  booking: FullBooking,
  switched: boolean,
  accessToken: string
) {
  const teacherName = booking.teacher.name;
  const teacherEmail = booking.teacher.email || "teacher@mydomain.com";
  const { name, email, phone } = booking.student;
  const subjectName = booking.subject.name;
  const dateStr = new Date(booking.date).toISOString().split("T")[0];
  const { timeslot } = booking;

  const teacherMsg: GraphMailPayload = {
    subject: `Nouă lecție (PENDING): ${subjectName}`,
    body: {
      contentType: "Text",
      content: `Salut, ${teacherName}!\n\nElevul ${name} (email: ${email}, tel: ${
        phone || "N/A"
      }) s-a înscris pentru lecția demo:\n
- Materie: ${subjectName}
- Data: ${dateStr}
- Interval: ${timeslot}
${
  switched
    ? "\nA fost redirecționat la dvs. deoarece alt profesor era ocupat.\n"
    : ""
}
Lecția este PENDING. Vom confirma când se atinge numărul complet de elevi.`,
    },
    toRecipients: [{ emailAddress: { address: teacherEmail } }],
  };

  const studentMsg: GraphMailPayload = {
    subject: `Confirmare înscriere lecție demo (PENDING) - ${subjectName}`,
    body: {
      contentType: "Text",
      content: `Bună, ${name}!\n\nTe-ai înscris la lecția demo (${subjectName}), 
data: ${dateStr}, oră: ${timeslot}\nProfesor: ${teacherName}\n
Momentan ești în stadiu PENDING; vom confirma când se formează un grup complet.
${
  switched
    ? "Te-am repartizat la un alt profesor, deoarece cel inițial era ocupat."
    : ""
}
Mulțumim!`,
    },
    toRecipients: [{ emailAddress: { address: email } }],
  };

  await sendMailViaGraph(accessToken, teacherMsg);
  await sendMailViaGraph(accessToken, studentMsg);
}

/**
 * sendMailViaGraph calls Microsoft Graph's /me/sendMail endpoint.
 */
async function sendMailViaGraph(
  accessToken: string,
  emailPayload: GraphMailPayload
) {
  const resp = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: emailPayload,
      saveToSentItems: true,
    }),
  });
  if (!resp.ok) {
    const errorText = await resp.text();
    console.error("Graph sendMail failed:", errorText);
    throw new Error("Failed to send email via Microsoft Graph.");
  }
}

/**
 * checkAndConfirmGroup:
 * If pending bookings reach maxCapacity, confirm them and notify via Graph.
 */
async function checkAndConfirmGroup(
  teacherId: number,
  date: string,
  timeslot: string
) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { subject: true },
  });
  if (!teacher || !teacher.subject) return;
  const maxCapacity = teacher.subject.maxCapacity ?? DEFAULT_MAX_CAPACITY;

  const pendingCount = await prisma.booking.count({
    where: {
      teacherId,
      date: new Date(date),
      timeslot,
      status: BookingStatus.PENDING,
    },
  });
  if (pendingCount < maxCapacity) return;

  const fullBookings = await prisma.booking.findMany({
    where: {
      teacherId,
      date: new Date(date),
      timeslot,
      status: BookingStatus.PENDING,
    },
    include: {
      student: true,
      teacher: true,
      subject: true,
    },
  });

  if (fullBookings.length >= maxCapacity) {
    const bookingIds = fullBookings.map((b) => b.id);
    await prisma.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: { status: BookingStatus.CONFIRMED },
    });

    await sendGroupFormedEmailViaGraph(fullBookings);
  }
}

/**
 * sendGroupFormedEmailViaGraph: Notifies teacher and each student when the group is confirmed.
 */
async function sendGroupFormedEmailViaGraph(bookings: FullBooking[]) {
  if (bookings.length === 0) return;

  const tokenRow = await refreshOutlookTokenIfNeeded();
  if (!tokenRow) {
    console.warn("No teacher-outlook tokens for group-formed email. Skipping.");
    return;
  }
  const accessToken = tokenRow.accessToken;

  const teacher = bookings[0].teacher;
  const teacherEmail = teacher.email || "teacher@mydomain.com";
  const subjectName = bookings[0].subject.name;
  const dateStr = new Date(bookings[0].date).toISOString().split("T")[0];
  const timeslot = bookings[0].timeslot;
  const teacherName = teacher.name;
  const students = bookings.map((b) => b.student);

  const teacherMsg: GraphMailPayload = {
    subject: `Grup complet CONFIRMAT pentru ${subjectName}`,
    body: {
      contentType: "Text",
      content: `Salut, ${teacherName}!\n\nS-au strâns destui elevi pentru lecția demo:\n
- Materie: ${subjectName}
- Data: ${dateStr}
- Interval: ${timeslot}

Elevi:
${students
  .map((s) => `• ${s.name} (${s.email}, tel: ${s.phone || "N/A"})`)
  .join("\n")}
Lecția este CONFIRMED. Succes!`,
    },
    toRecipients: [{ emailAddress: { address: teacherEmail } }],
  };

  await sendMailViaGraph(accessToken, teacherMsg);

  for (const s of students) {
    const studentMsg: GraphMailPayload = {
      subject: `Lecția demo CONFIRMATĂ: ${subjectName}`,
      body: {
        contentType: "Text",
        content: `Bună, ${s.name}!\n\nFelicitări, s-a format grupul complet pentru:
- Materie: ${subjectName}
- Data: ${dateStr}
- Interval: ${timeslot}
- Profesor: ${teacherName}

Ne vedem la lecție! Mult succes!`,
      },
      toRecipients: [{ emailAddress: { address: s.email } }],
    };
    await sendMailViaGraph(accessToken, studentMsg);
  }
}

/**
 * refreshOutlookTokenIfNeeded: Refresh the teacher-outlook token if it’s near expiry.
 */
async function refreshOutlookTokenIfNeeded() {
  const tokenRow = await prisma.oAuthToken.findUnique({
    where: { id: "teacher-outlook" },
  });
  if (!tokenRow) {
    console.warn("No teacher-outlook tokens in DB.");
    return null;
  }
  const now = Date.now();
  if (tokenRow.expiresAt.getTime() > now + 60_000) {
    return tokenRow;
  }

  console.log("Outlook token expired or near expiry. Refreshing...");
  const tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
  const bodyParams = new URLSearchParams({
    client_id: process.env.OUTLOOK_CLIENT_ID || "",
    client_secret: process.env.OUTLOOK_CLIENT_SECRET || "",
    grant_type: "refresh_token",
    refresh_token: tokenRow.refreshToken,
    scope: [
      "openid",
      "profile",
      "offline_access",
      "https://graph.microsoft.com/Calendars.ReadWrite",
    ].join(" "),
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: bodyParams,
  });

  if (!response.ok) {
    console.error("Failed to refresh Outlook token:", await response.text());
    return null;
  }

  const newData = await response.json();
  const newExpiresAt = new Date(
    Date.now() + (newData.expires_in ? newData.expires_in * 1000 : 3600_000)
  );

  const updated = await prisma.oAuthToken.update({
    where: { id: "teacher-outlook" },
    data: {
      accessToken: newData.access_token,
      refreshToken: newData.refresh_token || tokenRow.refreshToken,
      expiresAt: newExpiresAt,
    },
  });

  console.log("Refreshed Outlook token. New expiry:", updated.expiresAt);
  return updated;
}

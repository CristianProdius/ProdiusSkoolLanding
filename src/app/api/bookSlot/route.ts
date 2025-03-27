// app/api/book/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { Booking } from "@prisma/client";
import { BookingStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * We'll remove nodemailer and do all emails via Graph /me/sendMail calls,
 * reusing the teacher-outlook tokens.
 */

// Maximum group size fallback. We'll still read from subject for capacity, or use fallback if needed.
const DEFAULT_MAX_CAPACITY = 3;

/**
 * A "FullBooking" includes teacher, subject, student data
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
    maxCapacity?: number; // if you store capacity here
  };
  student: {
    name: string;
    email: string;
    phone?: string | null;
  };
};

/**
 * OutlookAttendee is used for the event's attendees array
 */
interface OutlookAttendee {
  emailAddress: {
    address: string;
  };
  type?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      subjectId,
      teacherId,
      date, // e.g. "2025-04-01"
      timeslot, // e.g. "18:00 - 19:00"
      name,
      email,
      phone,
    } = body;

    // 1) Validate
    if (!subjectId || !teacherId || !date || !timeslot || !name || !email) {
      return NextResponse.json(
        {
          message:
            "Data incomplete! Provide subjectId, teacherId, date, timeslot, name, email.",
        },
        { status: 400 }
      );
    }

    // 2) Load subject to get maxCapacity if you store it in subject
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

    // 4) If teacher is full, attempt to find alternative
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

      // Book with the alternative teacher
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

      // Upsert event + send PENDING emails
      await upsertCalendarEventAndSendEmails(booking, true);

      // Then check if group is full
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
          connectOrCreate: {
            where: { email },
            create: { name, email, phone },
          },
        },
      },
      include: { teacher: true, subject: true, student: true },
    });

    // Upsert event + send PENDING emails
    await upsertCalendarEventAndSendEmails(booking, false);

    // 6) Check if group is now full
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
 * findAlternativeTeacher: tries to find another teacher for the same subject/time who isn't full
 */
async function findAlternativeTeacher(
  subjectId: number,
  date: string,
  timeslot: string
) {
  // Load subject so we can see maxCapacity
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return null;
  const maxCapacity = subject.maxCapacity ?? DEFAULT_MAX_CAPACITY;

  // get teachers for that subject
  const teachers = await prisma.teacher.findMany({ where: { subjectId } });

  for (const t of teachers) {
    const c = await prisma.booking.count({
      where: {
        teacherId: t.id,
        date: new Date(date),
        timeslot,
        status: { not: BookingStatus.CANCELED },
      },
    });
    if (c < maxCapacity) {
      return t.id; // first teacher with free capacity
    }
  }
  return null;
}

/**
 *  upsertCalendarEventAndSendEmails:
 *  - refreshes teacher tokens if needed
 *  - upserts an Outlook event
 *  - sends teacher+student "PENDING" emails via Graph
 */
async function upsertCalendarEventAndSendEmails(
  booking: FullBooking,
  switched: boolean
) {
  // 1) Build start & end Date
  const [startH, startM] = booking.timeslot.split("-")[0].trim().split(":");
  const [endH, endM] = booking.timeslot.split("-")[1].trim().split(":");
  const startDate = new Date(booking.date);
  startDate.setHours(+startH, +startM, 0, 0);

  const endDate = new Date(booking.date);
  endDate.setHours(+endH, +endM, 0, 0);

  // 2) Refresh teacher-outlook token if needed
  const tokenRow = await refreshOutlookTokenIfNeeded();
  if (!tokenRow) {
    console.warn(
      "No teacher-outlook tokens. Skipping Outlook event creation + emails."
    );
    // fallback => just skip the event creation
    return;
  }
  const accessToken = tokenRow.accessToken;

  // 3) Check if there's an existing CalendarEvent row
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
    // CREATE new event
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
      // store in DB
      await prisma.calendarEvent.create({
        data: {
          teacherId: booking.teacher.id,
          date: booking.date,
          timeslot: booking.timeslot,
          outlookEventId,
          googleEventId: "", // if your schema still has it
        },
      });
    }
  } else {
    // Update existing event (add new attendee if not present)
    outlookEventId = existingEvent.outlookEventId;
    if (outlookEventId) {
      const getEvent = await fetch(
        `https://graph.microsoft.com/v1.0/me/events/${outlookEventId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (getEvent.ok) {
        const eventData = await getEvent.json();
        const currentAttendees = eventData.attendees || [];
        const newAttendee = {
          emailAddress: { address: booking.student.email },
          type: "required",
        };
        const alreadyAttending = currentAttendees.some(
          (a: any) => a.emailAddress.address === booking.student.email
        );
        if (!alreadyAttending) {
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

  // 4) Now send teacher+student "PENDING" emails via Graph
  await sendRegistrationEmailsViaGraph(booking, switched, accessToken);
}

/**
 * This sends teacher+student "PENDING" emails with Microsoft Graph /me/sendMail
 * No nodemailer needed.
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

  // teacher email
  const teacherMsg = {
    subject: `Nouă lecție (PENDING): ${subjectName}`,
    body: {
      contentType: "Text",
      content: `Salut, ${teacherName}!\n\nElevul ${name} (email: ${email}, tel: ${
        phone || "N/A"
      }) s-a înscris pentru lecția demo:\n
- Materie: ${subjectName}
- Data: ${dateStr}
- Interval orar: ${timeslot}
${
  switched
    ? "\nA fost redirecționat la dvs. deoarece alt profesor era ocupat.\n"
    : ""
}
Lecția este PENDING. Vom confirma când se atinge numărul complet de elevi.`,
    },
    toRecipients: [{ emailAddress: { address: teacherEmail } }],
  };

  // student email
  const studentMsg = {
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

  // send both
  await sendMailViaGraph(accessToken, teacherMsg);
  await sendMailViaGraph(accessToken, studentMsg);
}

/**
 * If we have 'maxCapacity' PENDING => mark them CONFIRMED & send “group formed” email
 */
async function checkAndConfirmGroup(
  teacherId: number,
  date: string,
  timeslot: string
) {
  // 1) load teacher & subject => find maxCapacity
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { subject: true },
  });
  if (!teacher || !teacher.subject) return;
  const maxCapacity = teacher.subject.maxCapacity ?? DEFAULT_MAX_CAPACITY;

  // 2) count how many are PENDING
  const pendingCount = await prisma.booking.count({
    where: {
      teacherId,
      date: new Date(date),
      timeslot,
      status: BookingStatus.PENDING,
    },
  });
  if (pendingCount < maxCapacity) return; // not full

  // 3) load them
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
    // confirm them
    const bookingIds = fullBookings.map((b) => b.id);
    await prisma.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: { status: BookingStatus.CONFIRMED },
    });

    // send group-formed emails
    await sendGroupFormedEmailViaGraph(fullBookings);
  }
}

/**
 * Notify teacher + group that they're now CONFIRMED
 */
async function sendGroupFormedEmailViaGraph(bookings: FullBooking[]) {
  if (!bookings.length) return;

  // refresh tokens if needed
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

  // 1) teacher email
  const teacherMsg = {
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
  // send to teacher
  await sendMailViaGraph(accessToken, teacherMsg);

  // 2) each student
  for (const s of students) {
    const studentMsg = {
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
 * sendMailViaGraph: calls POST /me/sendMail with the teacher-outlook token
 */
async function sendMailViaGraph(accessToken: string, emailPayload: any) {
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
 * refreshOutlookTokenIfNeeded: if teacher-outlook token is near expiry, refresh it
 */
async function refreshOutlookTokenIfNeeded() {
  const tokenRow = await prisma.oAuthToken.findUnique({
    where: { id: "teacher-outlook" },
  });
  if (!tokenRow) {
    console.warn("No teacher-outlook tokens in DB.");
    return null;
  }

  // If we have more than 60 seconds left, skip refresh
  const now = Date.now();
  if (tokenRow.expiresAt.getTime() > now + 60_000) {
    return tokenRow; // still valid
  }

  console.log("Outlook token expired or about to expire. Refreshing...");

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

  console.log("Refreshed Outlook token. Expires at:", updated.expiresAt);
  return updated;
}

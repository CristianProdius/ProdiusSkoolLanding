// app/api/book/route.ts

// Tell Next.js not to pre-render or use Edge:
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { Booking } from "@prisma/client"; // import as type only
import { BookingStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

/**
 * Define a type representing a booking that includes
 * teacher, subject, and student relations.
 */
export type FullBooking = Booking & {
  teacher: {
    id: number;
    name: string;
    email?: string | null;
  };
  subject: {
    name: string;
  };
  student: {
    name: string;
    email: string;
    phone?: string | null;
  };
};

/**
 * Minimal type for Outlook event attendee
 * to avoid using `any`.
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
      date, // e.g. "2023-10-05"
      timeslot, // e.g. "18:00 - 19:00"
      name,
      email,
      phone,
    } = body;

    // 1) Validate required fields
    if (!subjectId || !teacherId || !date || !timeslot || !name || !email) {
      return NextResponse.json(
        {
          message:
            "Date incomplete! (subjectId, teacherId, date, timeslot, name, email)",
        },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findUnique({
      where: { id: Number(subjectId) },
    });
    if (!subject) {
      return NextResponse.json(
        { message: `Subject ${subjectId} not found.` },
        { status: 400 }
      );
    }
    const maxCapacity = subject.maxCapacity;

    // 2) Check capacity for the chosen teacher/date/timeslot
    const currentCount = await prisma.booking.count({
      where: {
        teacherId: Number(teacherId),
        date: new Date(date),
        timeslot,
        status: { not: BookingStatus.CANCELED },
      },
    });

    // 3) If teacher is full, attempt to switch
    if (currentCount >= maxCapacity) {
      const altTeacherId = await findAlternativeTeacher(
        Number(subjectId),
        date,
        timeslot
      );
      if (!altTeacherId) {
        return NextResponse.json(
          { message: "Toți profesorii sunt ocupați la data/ora selectată." },
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

      // Upsert the Calendar event + send "PENDING" emails
      await upsertCalendarEventAndSendEmails(booking, true);

      // Then check if group is full
      await checkAndConfirmGroup(altTeacherId, date, timeslot);

      return NextResponse.json(
        { success: true, switchedTeacher: altTeacherId },
        { status: 200 }
      );
    }

    // 4) Otherwise, create booking with chosen teacher
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

    // Upsert the Calendar event + send "PENDING" emails
    await upsertCalendarEventAndSendEmails(booking, false);

    // 5) Check if the group is now full
    await checkAndConfirmGroup(Number(teacherId), date, timeslot);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Error booking:", err);
    return NextResponse.json(
      { message: "Eroare de server. Încercați mai târziu." },
      { status: 500 }
    );
  }
}

// Helper: find an alternative teacher with free capacity
async function findAlternativeTeacher(
  subjectId: number,
  date: string,
  timeslot: string
) {
  // 1) Get the subject
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
  });
  if (!subject) return null; // or throw an error
  const maxCap = subject.maxCapacity;

  // 2) Get all teachers of that subject
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
    if (c < maxCap) {
      return t.id; // first teacher with capacity
    }
  }
  return null;
}

/**
 * upsertCalendarEventAndSendEmails:
 *  - upsert an Outlook calendar event (if teacher tokens found in DB)
 *  - sends "PENDING" email notifications
 */
async function upsertCalendarEventAndSendEmails(
  booking: FullBooking,
  switched: boolean
) {
  // 1) Build start & end Date from booking data
  const [startH, startM] = booking.timeslot.split("-")[0].trim().split(":");
  const [endH, endM] = booking.timeslot.split("-")[1].trim().split(":");
  const startDate = new Date(booking.date); // e.g. 2025-03-10
  startDate.setHours(+startH, +startM, 0, 0);

  const endDate = new Date(booking.date);
  endDate.setHours(+endH, +endM, 0, 0);

  // 2) Refresh tokens if needed, and load the teacher-outlook token row
  const tokenRow = await refreshOutlookTokenIfNeeded();
  if (!tokenRow) {
    // fallback: just send emails
    console.warn(
      "No Outlook tokens found or refresh failed. Skipping event creation."
    );
    await sendRegistrationEmail(booking, switched);
    return;
  }

  const accessToken = tokenRow.accessToken;

  // 3) Check if we already have an existing event in DB
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
    // CREATE a new event in Outlook
    const createResponse = await fetch(
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
            contentType: "text",
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

    if (!createResponse.ok) {
      console.error(
        "Failed to create Outlook event",
        await createResponse.text()
      );
    } else {
      const eventJson = await createResponse.json();
      outlookEventId = eventJson.id; // store event id
      await prisma.calendarEvent.create({
        data: {
          teacherId: booking.teacher.id,
          date: booking.date,
          timeslot: booking.timeslot,
          outlookEventId,
          googleEventId: "", // Provide a default or actual value if your schema demands
        },
      });
    }
  } else {
    // UPDATE existing event: add new attendee if not present
    outlookEventId = existingEvent.outlookEventId;
    if (outlookEventId) {
      // 1) Fetch existing event from Graph
      const eventRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/events/${outlookEventId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        const currentAttendees: OutlookAttendee[] = eventData.attendees || [];

        // Build the new attendee object
        const newAttendee: OutlookAttendee = {
          emailAddress: { address: booking.student.email },
          type: "required",
        };

        // If not already present, push it
        if (
          !currentAttendees.some(
            (a: OutlookAttendee) =>
              a.emailAddress.address === booking.student.email
          )
        ) {
          currentAttendees.push(newAttendee);

          // 2) Patch the event with updated attendees
          const patchRes = await fetch(
            `https://graph.microsoft.com/v1.0/me/events/${outlookEventId}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                attendees: currentAttendees,
              }),
            }
          );

          if (!patchRes.ok) {
            console.error(
              "Failed to update Outlook event attendees",
              await patchRes.text()
            );
          }
        }
      }
    }
  }

  // 4) Finally, send "PENDING" emails
  await sendRegistrationEmail(booking, switched);
}

/**
 * Send teacher+student "PENDING" emails
 */
async function sendRegistrationEmail(booking: FullBooking, switched: boolean) {
  const { name, email, phone } = booking.student;
  const teacherName = booking.teacher.name;
  const teacherEmail = booking.teacher.email || "admin@example.com";
  const subjectName = booking.subject.name;

  const dateStr = new Date(booking.date).toISOString().split("T")[0];
  const { timeslot } = booking;

  // Setup nodemailer
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const teacherMail = {
    from: "no-reply@myschool.com",
    to: teacherEmail,
    subject: `Nouă lecție (PENDING): ${subjectName}`,
    text: `Salut, ${teacherName}!\n\nElevul ${name} (email: ${email}, tel: ${
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
    Lecția este PENDING. Vom confirma când se atinge 3 elevi.`,
  };

  const studentMail = {
    from: "no-reply@myschool.com",
    to: email,
    subject: `Confirmare înscriere lecție demo (PENDING) - ${subjectName}`,
    text: `Bună, ${name}!\n\nTe-ai înscris la lecția demo (${subjectName}),
    data: ${dateStr}, oră: ${timeslot}\nProfesor: ${teacherName}\n
    Momentan ești în stadiu PENDING; vom confirma când se formează un grup de 3 elevi.
    ${
      switched
        ? "Te-am repartizat la un alt profesor, deoarece cel inițial era ocupat."
        : ""
    }\n\nMulțumim!`,
  };

  try {
    await transporter.sendMail(teacherMail);
    await transporter.sendMail(studentMail);
  } catch (e) {
    console.error("Failed to send registration emails:", e);
  }
}

/**
 * If we have 3 PENDING => mark them CONFIRMED & send “group formed” email
 */
async function checkAndConfirmGroup(
  teacherId: number,
  date: string,
  timeslot: string
) {
  // 1) Load the teacher (and its subject) from DB
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      subject: true, // => teacher.subject
    },
  });
  if (!teacher || !teacher.subject) {
    // no teacher or subject => skip
    return;
  }

  const maxCapacity = teacher.subject.maxCapacity;

  // 2) Count how many are currently PENDING
  const pendingCount = await prisma.booking.count({
    where: {
      teacherId,
      date: new Date(date),
      timeslot,
      status: BookingStatus.PENDING,
    },
  });
  if (pendingCount < maxCapacity) return; // not full yet

  // 3) If we meet or exceed maxCapacity => confirm them
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

    await sendGroupFormedEmail(fullBookings);
  }
}

/**
 * Notify teacher + 3 students that the group is now CONFIRMED
 */
async function sendGroupFormedEmail(bookings: FullBooking[]) {
  if (bookings.length === 0) return;
  const teacher = bookings[0].teacher;
  const teacherEmail = teacher.email || "admin@example.com";
  const subjectName = bookings[0].subject.name;
  const dateStr = new Date(bookings[0].date).toISOString().split("T")[0];
  const timeslot = bookings[0].timeslot;
  const teacherName = teacher.name;

  const students = bookings.map((b) => b.student);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Email teacher
  const teacherMail = {
    from: "no-reply@myschool.com",
    to: teacherEmail,
    subject: `Grup complet (3 elevi) CONFIRMAT pentru ${subjectName}`,
    text: `Salut, ${teacherName}!\n\nS-au strâns 3 elevi pentru lecția demo:\n
    - Materie: ${subjectName}
    - Data: ${dateStr}
    - Interval: ${timeslot}\n\nElevi:\n${students
      .map((s) => `• ${s.name} (${s.email}, tel: ${s.phone || "N/A"})`)
      .join("\n")}
    \nLecția este CONFIRMED. Succes!`,
  };

  try {
    await transporter.sendMail(teacherMail);
  } catch (e) {
    console.error("Error sending group-formed mail to teacher:", e);
  }

  // Email each student
  for (const stud of students) {
    const studentMail = {
      from: "no-reply@myschool.com",
      to: stud.email,
      subject: `Lecția demo este CONFIRMATĂ: ${subjectName}`,
      text: `Bună, ${stud.name}!\n\nFelicitări, s-a format grupul complet (3 elevi) pentru:\n
      - Materie: ${subjectName}
      - Data: ${dateStr}
      - Interval: ${timeslot}
      - Profesor: ${teacherName}\n\nNe vedem la lecție! Mult succes!`,
    };
    try {
      await transporter.sendMail(studentMail);
    } catch (err) {
      console.error("Error sending group-formed mail to student:", err);
    }
  }
}

/**
 * =============================
 *     REFRESH LOGIC BELOW
 * =============================
 */

/**
 * Attempt to refresh the teacher-outlook token if it's expired or near expiry.
 * Returns the updated OAuthToken row, or null if not found / refresh failed.
 */
async function refreshOutlookTokenIfNeeded() {
  // 1) Load the teacher-outlook row
  const tokenRow = await prisma.oAuthToken.findUnique({
    where: { id: "teacher-outlook" },
  });
  if (!tokenRow) {
    console.warn("No teacher-outlook tokens exist in DB.");
    return null;
  }

  // 2) Check if expiresAt is more than 1 minute away; if so, no refresh needed
  const now = new Date();
  // Refresh if we're within 1 minute of expiry
  if (tokenRow.expiresAt.getTime() > now.getTime() + 60_000) {
    // Access token is still valid
    return tokenRow;
  }

  console.log("Access token expired or about to expire. Attempting refresh...");

  // 3) Refresh with Microsoft
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

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: bodyParams,
  });

  if (!resp.ok) {
    console.error("Failed to refresh Outlook token:", await resp.text());
    return null;
  }

  const newData = await resp.json(); // { access_token, refresh_token, expires_in, ...}
  const newExpiresAt = new Date(
    Date.now() + (newData.expires_in || 3600) * 1000
  );

  // 4) Update DB row
  const updated = await prisma.oAuthToken.update({
    where: { id: "teacher-outlook" },
    data: {
      accessToken: newData.access_token,
      // If newData.refresh_token is missing for some reason, keep old one
      refreshToken: newData.refresh_token || tokenRow.refreshToken,
      expiresAt: newExpiresAt,
    },
  });

  console.log(
    "Successfully refreshed Outlook token. Expires at:",
    updated.expiresAt
  );
  return updated;
}

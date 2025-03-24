// Tell Next.js not to pre-render or use Edge:
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { BookingStatus, Booking } from "@prisma/client";
import { cookies } from "next/headers";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

// Maximum group size
const MAX_CAPACITY = 3;

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
    if (currentCount >= MAX_CAPACITY) {
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
  const teachers = await prisma.teacher.findMany({ where: { subjectId } });

  for (const t of teachers) {
    // Check capacity
    const c = await prisma.booking.count({
      where: {
        teacherId: t.id,
        date: new Date(date),
        timeslot,
        status: { not: BookingStatus.CANCELED },
      },
    });
    if (c < MAX_CAPACITY) {
      return t.id; // first teacher with capacity
    }
  }
  return null;
}

/**
 *  upsertCalendarEventAndSendEmails:
 *  - upsert a Google Calendar event (if user OAuth tokens found in cookies)
 *  - sends "PENDING" email notifications
 */
async function upsertCalendarEventAndSendEmails(
  booking: FullBooking,
  switched: boolean
) {
  // 1) Build the start/end datetime
  const [startStr, endStr] = booking.timeslot
    .split("-")
    .map((s: string) => s.trim());
  const startDate = new Date(booking.date);
  const [sh, sm] = startStr.split(":");
  startDate.setHours(Number(sh), Number(sm), 0, 0);

  const endDate = new Date(booking.date);
  const [eh, em] = endStr.split(":");
  endDate.setHours(Number(eh), Number(em), 0, 0);

  // 2) Attempt to load user tokens from the cookie
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get("google_oauth_tokens");
  if (!tokenCookie) {
    console.warn("No user OAuth tokens found - skipping Calendar insertion");
    await sendRegistrationEmail(booking, switched);
    return;
  }
  const tokens = JSON.parse(tokenCookie.value);

  // 3) Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);

  // 4) Construct Calendar API
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // 5) See if we already have an existing "CalendarEvent" row
  //    to know if we should update or insert
  const existingEvent = await prisma.calendarEvent.findUnique({
    where: {
      unique_event_per_slot: {
        teacherId: booking.teacher.id,
        date: booking.date,
        timeslot: booking.timeslot,
      },
    },
  });

  // We want teacher + student in the event
  const teacherEmail =
    booking.teacher.email || "cristian@prodiusenterprise.com";
  const studentEmail = booking.student.email;
  const eventAttendees = [teacherEmail, studentEmail];

  const subjectName = booking.subject.name;
  const teacherName = booking.teacher.name;
  let googleEventId = "";

  if (!existingEvent) {
    // Insert new event
    const eventBody = {
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
      attendees: eventAttendees.map((email) => ({ email })),
    };

    const insertRes = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventBody,
      sendUpdates: "all",
    });

    googleEventId = insertRes.data.id || "";
    // Save in DB
    await prisma.calendarEvent.create({
      data: {
        teacherId: booking.teacher.id,
        date: booking.date,
        timeslot: booking.timeslot,
        googleEventId,
      },
    });
  } else {
    // Update existing event: add new student as attendee
    googleEventId = existingEvent.googleEventId;
    const getRes = await calendar.events.get({
      calendarId: "primary",
      eventId: googleEventId,
    });
    const existing = getRes.data;
    const currentAttendees = existing.attendees || [];

    for (const attendee of eventAttendees) {
      if (!currentAttendees.some((a) => a.email === attendee)) {
        currentAttendees.push({ email: attendee });
      }
    }

    await calendar.events.patch({
      calendarId: "primary",
      eventId: googleEventId,
      requestBody: { attendees: currentAttendees },
      sendUpdates: "all",
    });
  }

  // 6) Send "PENDING" emails
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

  // Setup nodemailer with env-based config
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
  const pendingCount = await prisma.booking.count({
    where: {
      teacherId,
      date: new Date(date),
      timeslot,
      status: BookingStatus.PENDING,
    },
  });

  if (pendingCount < MAX_CAPACITY) return; // not full yet

  // fetch the bookings
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

  // fullBookings is an array of FullBooking objects
  if (fullBookings.length >= MAX_CAPACITY) {
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
    } catch (e) {
      console.error("Error sending group-formed mail to student:", e);
    }
  }
}

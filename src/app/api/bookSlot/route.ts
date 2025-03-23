import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, BookingStatus, Prisma } from "@prisma/client";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { cookies } from "next/headers"; // for reading tokens in Next.js App Router

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();
const MAX_CAPACITY = 3;

type FullBooking = Prisma.BookingGetPayload<{
  include: {
    teacher: true;
    subject: true;
    student: true;
  };
}>;

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

    // Validate required fields
    if (!subjectId || !teacherId || !date || !timeslot || !name || !email) {
      return NextResponse.json(
        {
          message:
            "Date incomplete! (subjectId, teacherId, date, timeslot, name, email)",
        },
        { status: 400 }
      );
    }

    // 1) Check capacity for the chosen teacher/date/timeslot
    const currentCount = await prisma.booking.count({
      where: {
        teacherId,
        date: new Date(date),
        timeslot,
        status: { not: BookingStatus.CANCELED },
      },
    });

    // 2) If teacher is full, attempt to switch
    if (currentCount >= MAX_CAPACITY) {
      const altTeacherId = await findAlternativeTeacher(
        subjectId,
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
          subject: { connect: { id: subjectId } },
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
        include: {
          teacher: true,
          subject: true,
          student: true,
        },
      });

      // Upsert the Calendar event (with OAuth) + send "PENDING" emails
      await upsertCalendarEventAndSendEmails(booking, true);

      // Then check if group is full
      await checkAndConfirmGroup(altTeacherId, date, timeslot);

      return NextResponse.json(
        { success: true, switchedTeacher: altTeacherId },
        { status: 200 }
      );
    }

    // 3) Otherwise, create booking with chosen teacher
    const booking = await prisma.booking.create({
      data: {
        subject: { connect: { id: subjectId } },
        teacher: { connect: { id: teacherId } },
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
      include: {
        teacher: true,
        subject: true,
        student: true,
      },
    });

    // Upsert the Calendar event (OAuth) + send "PENDING" emails
    await upsertCalendarEventAndSendEmails(booking, false);

    // 4) check if the group is now full
    await checkAndConfirmGroup(teacherId, date, timeslot);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Error booking:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { message: "Eroare de server. Încercați mai târziu." },
      { status: 500 }
    );
  }
}

// ~~~~~ HELPERS ~~~~~ //

async function findAlternativeTeacher(
  subjectId: number,
  date: string,
  timeslot: string
) {
  // Find all teachers for that subject
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
 * Creates or updates a Calendar event for (teacherId, date, timeslot) in the *user's* Google Calendar
 * (based on tokens in the "google_oauth_tokens" cookie).
 * Then sends the "PENDING" emails.
 */
async function upsertCalendarEventAndSendEmails(
  booking: FullBooking,
  switched: boolean
) {
  // 1) Construct start/end DateTime
  const [startStr, endStr] = booking.timeslot
    .split("-")
    .map((s: string) => s.trim());
  const startDate = new Date(booking.date);
  const [sh, sm] = startStr.split(":");
  startDate.setHours(Number(sh), Number(sm), 0, 0);

  const endDate = new Date(booking.date);
  const [eh, em] = endStr.split(":");
  endDate.setHours(Number(eh), Number(em), 0, 0);

  // 2) Try to load the user's OAuth tokens from cookies
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get("google_oauth_tokens");

  if (!tokenCookie) {
    console.warn(
      "No user OAuth tokens found. Skipping Google Calendar insertion."
    );
    // Just send "PENDING" emails and return
    await sendRegistrationEmail(booking, switched);
    return;
  }
  const tokens = JSON.parse(tokenCookie.value);

  // 3) Create an OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );
  oauth2Client.setCredentials(tokens);

  // 4) Create a Calendar client
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // 5) Check if we already have a row in your DB's CalendarEvent table
  //    for (teacherId, date, timeslot).
  //    We'll see if we need to "insert" or "update" the event.
  const existingEvent = await prisma.calendarEvent.findUnique({
    where: {
      unique_event_per_slot: {
        teacherId: booking.teacher.id,
        date: booking.date,
        timeslot: booking.timeslot,
      },
    },
  });

  const teacherEmail = booking.teacher.email || "teacher@example.com";
  const studentEmail = booking.student.email;
  const eventAttendees = [teacherEmail, studentEmail];

  let googleEventId: string;
  const subjectName = booking.subject.name;
  const teacherName = booking.teacher.name;

  // 6) If no DB record => insert a new GCal event
  if (!existingEvent) {
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

    // Insert the event in the user's primary calendar
    const insertRes = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventBody,
      sendUpdates: "all", // send official invites
    });

    googleEventId = insertRes.data.id || "";
    // Store it in DB
    await prisma.calendarEvent.create({
      data: {
        teacherId: booking.teacher.id,
        date: booking.date,
        timeslot: booking.timeslot,
        googleEventId,
      },
    });
  } else {
    // 7) Already have a googleEventId => just add the new student's email as an attendee
    googleEventId = existingEvent.googleEventId;

    // 7a) fetch existing event info
    const getRes = await calendar.events.get({
      calendarId: "primary",
      eventId: googleEventId,
    });
    const existing = getRes.data;
    const currentAttendees = existing.attendees || [];

    // 7b) Add the new student's email if not present
    for (const email of eventAttendees) {
      if (!currentAttendees.some((a) => a.email === email)) {
        currentAttendees.push({ email });
      }
    }

    // 7c) Patch the event
    await calendar.events.patch({
      calendarId: "primary",
      eventId: googleEventId,
      requestBody: {
        attendees: currentAttendees,
      },
      sendUpdates: "all", // send invites to the new attendee
    });
  }

  // 8) Send your usual "PENDING" emails
  await sendRegistrationEmail(booking, switched);
}

/**
 * Basic teacher+student pending email logic
 */
async function sendRegistrationEmail(booking: FullBooking, switched: boolean) {
  const { name, email, phone } = booking.student;
  const teacherName = booking.teacher.name;
  const teacherEmail = booking.teacher.email || "admin@example.com";
  const subjectName = booking.subject.name;

  // Convert date to local string, e.g. "2023-10-05"
  const dateStr = new Date(booking.date).toISOString().split("T")[0];
  const { timeslot } = booking;

  // Nodemailer transport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Email -> Teacher
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
    \n${
      switched
        ? "A fost redirecționat la dvs. deoarece alt profesor era ocupat."
        : ""
    }\n\nLecția este PENDING (1-2 elevi?). Vom confirma când se atinge 3 elevi.`,
  };

  // Email -> Student
  const studentMail = {
    from: "no-reply@myschool.com",
    to: email,
    subject: `Confirmare înscriere lecție demo (PENDING) - ${subjectName}`,
    text: `Bună, ${name}!\n\nTe-ai înscris la lecția demo (${subjectName}), 
    data: ${dateStr}, oră: ${timeslot}\nProfesor: ${teacherName}\n
    În prezent ești în stadiu PENDING; vom confirma când se formează grupul (max 3 elevi).
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
 * If we now have 3 PENDING signups => mark them CONFIRMED & send “group formed” email
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

  // fetch all PENDING
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
 * Notifies teacher + 3 students that the group is CONFIRMED
 */
async function sendGroupFormedEmail(bookings: FullBooking[]) {
  if (bookings.length === 0) return;
  const teacher = bookings[0].teacher;
  const teacherEmail = teacher.email || "admin@example.com";
  const subjectName = bookings[0].subject.name;
  const dateStr = new Date(bookings[0].date).toISOString().split("T")[0];
  const timeslot = bookings[0].timeslot;

  const students = bookings.map((b) => b.student);
  const teacherName = teacher.name;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Email -> Teacher
  const teacherMail = {
    from: "no-reply@myschool.com",
    to: teacherEmail,
    subject: `Grup complet (3 elevi) CONFIRMAT pentru ${subjectName}`,
    text: `Salut, ${teacherName}!\n\nS-au strâns 3 elevi pentru lecția demo:\n
    - Materie: ${subjectName}
    - Data: ${dateStr}
    - Interval: ${timeslot}\n\nElevi:\n${students
      .map(
        (s: {
          name: string;
          id: number;
          email: string;
          phone: string | null;
        }) => `• ${s.name} (${s.email}, tel: ${s.phone || "N/A"})`
      )
      .join("\n")}
    \nLecția este CONFIRMED. Succes!`,
  };

  try {
    await transporter.sendMail(teacherMail);
  } catch (e) {
    console.error("Error sending group-formed mail to teacher:", e);
  }

  // Email -> each student
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

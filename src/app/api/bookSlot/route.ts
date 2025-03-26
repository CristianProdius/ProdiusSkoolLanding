// app/api/book/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { BookingStatus, Booking } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

// Maximum group size
const MAX_CAPACITY = 3;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subjectId, teacherId, date, timeslot, name, email, phone } = body;

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

    // 2) Check capacity
    const currentCount = await prisma.booking.count({
      where: {
        teacherId: Number(teacherId),
        date: new Date(date),
        timeslot,
        status: { not: BookingStatus.CANCELED },
      },
    });

    // 3) If teacher is full, try alternative
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

      // Book with alternative
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

      // Upsert Outlook event
      await upsertCalendarEventAndSendEmails(booking, true);

      // Then check if group is full
      await checkAndConfirmGroup(altTeacherId, date, timeslot);

      return NextResponse.json(
        { success: true, switchedTeacher: altTeacherId },
        { status: 200 }
      );
    }

    // 4) Otherwise, create booking
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

    // Upsert event
    await upsertCalendarEventAndSendEmails(booking, false);

    // 5) Check if group full
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

// helper
async function findAlternativeTeacher(
  subjectId: number,
  date: string,
  timeslot: string
) {
  const teachers = await prisma.teacher.findMany({ where: { subjectId } });
  for (const t of teachers) {
    const c = await prisma.booking.count({
      where: {
        teacherId: t.id,
        date: new Date(date),
        timeslot,
        status: { not: "CANCELED" },
      },
    });
    if (c < MAX_CAPACITY) return t.id;
  }
  return null;
}

// Upsert event in Outlook
async function upsertCalendarEventAndSendEmails(
  booking: any,
  switched: boolean
) {
  // 1) Build date/time
  const [startH, startM] = booking.timeslot.split("-")[0].trim().split(":");
  const [endH, endM] = booking.timeslot.split("-")[1].trim().split(":");
  const startDate = new Date(booking.date);
  startDate.setHours(+startH, +startM, 0, 0);
  const endDate = new Date(booking.date);
  endDate.setHours(+endH, +endM, 0, 0);

  // 2) Load the teacher's tokens from DB: we use id="teacher-outlook"
  const tokenRow = await prisma.oAuthToken.findUnique({
    where: { id: "teacher-outlook" },
  });
  if (!tokenRow) {
    console.warn(
      "No Outlook tokens found for teacher - skipping event creation"
    );
    await sendRegistrationEmail(booking, switched);
    return;
  }

  const accessToken = tokenRow.accessToken;
  // Optionally check if expired

  // 3) Check if we already have existing event
  const existingEvent = await prisma.calendarEvent.findUnique({
    where: {
      unique_event_per_slot: {
        teacherId: booking.teacher.id,
        date: booking.date,
        timeslot: booking.timeslot,
      },
    },
  });

  if (!existingEvent) {
    // CREATE new event
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
      const outlookEventId = eventJson.id;
      // store in DB
      await prisma.calendarEvent.create({
        data: {
          teacher: { connect: { id: booking.teacher.id } },
          date: booking.date,
          timeslot: booking.timeslot,
          outlookEventId,
          googleEventId: "", // Provide a default or actual value
        },
      });
    }
  } else {
    // UPDATE existing event: add new attendee if not present
    const outlookEventId = existingEvent.outlookEventId;
    if (outlookEventId) {
      const eventRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/events/${outlookEventId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        const currentAttendees = eventData.attendees || [];
        const newAttendee = {
          emailAddress: { address: booking.student.email },
          type: "required",
        };
        if (
          !currentAttendees.some(
            (a: any) => a.emailAddress.address === booking.student.email
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
              "Failed to update Outlook event attendees",
              await patchRes.text()
            );
          }
        }
      }
    }
  }

  // 4) Send custom “PENDING” emails
  await sendRegistrationEmail(booking, switched);
}

// Send pending emails
async function sendRegistrationEmail(booking: any, switched: boolean) {
  // your existing logic
}

// if 3 PENDING => confirm
async function checkAndConfirmGroup(
  teacherId: number,
  date: string,
  timeslot: string
) {
  // same logic
}

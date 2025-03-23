// app/api/subjects/route.ts

import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany();
    // e.g. [ { id: 1, name: "Matematică" }, { id: 2, name: "Română" } ]
    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { message: "Eroare la încărcarea subiectelor." },
      { status: 500 }
    );
  }
}

// app/api/subjects/route.ts

export const runtime = "nodejs"; // Use full Node.js
export const dynamic = "force-dynamic"; // Force Next.js to treat this route as dynamic

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // import the singleton

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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectIdStr = searchParams.get("subjectId");

    let whereClause = {};
    if (subjectIdStr) {
      const subjectId = parseInt(subjectIdStr, 10);
      whereClause = { subjectId };
    }

    const teachers = await prisma.teacher.findMany({
      where: whereClause,
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { message: "Eroare la încărcarea profesorilor." },
      { status: 500 }
    );
  }
}

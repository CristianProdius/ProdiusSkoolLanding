// pages/api/bookSlot.ts
// or app/api/bookSlot/route.ts (Next 13)
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    JSON.parse(req.body);

    // 1) Check if teacher/timeslot is under capacity (less than 3).
    // 2) If full, return an error or suggest another teacher/time.
    // 3) Otherwise, create the booking record in your DB (e.g., MySQL/Postgres).
    // 4) Send email notifications to teacher & student.

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

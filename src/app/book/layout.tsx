export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * This layout checks for the `google_oauth_tokens` cookie on the server.
 * If missing, we immediately redirect to /api/auth/google.
 * If present, we render the children.
 * If there's a delay, Next.js shows loading.tsx instead of partial layout.
 */
export default async function BookLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 1) Check the cookie
  const tokenCookie = cookies().get("google_oauth_tokens");
  if (!tokenCookie) {
    // 2) Immediately redirect if missing
    redirect("/api/auth/google");
  }

  // 3) If cookie is present, just render children
  return <>{children}</>;
}

// app/book/page.tsx (Server Component)
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import BookTrialPage from "./BookTrialPage";

// We import the "client" wizard from BookTrialPage (the code you shared).
// This file is a server component that runs first to decide if user is allowed in.

export default function BookProtectedPage() {
  // 1) Check for google_oauth_tokens
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get("google_oauth_tokens");

  // 2) If no tokens, redirect to Google OAuth
  if (!tokenCookie) {
    redirect("/api/auth/google");
  }

  // 3) Otherwise, render the booking wizard
  return <BookTrialPage />;
}

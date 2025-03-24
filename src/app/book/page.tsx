import BookTrialPage from "./BookTrialPage"; // your client wizard

export default function BookIndexPage() {
  // By the time we get here, we already know user has the cookie
  return <BookTrialPage />;
}

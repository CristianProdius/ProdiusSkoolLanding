// app/book/layout.ts
import { ReactNode } from "react";

export default function BookLayout({ children }: { children: ReactNode }) {
  // No Outlook cookie check here!
  return <>{children}</>;
}

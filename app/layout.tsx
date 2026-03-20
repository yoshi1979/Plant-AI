import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Plant Health Assistant",
  description: "WhatsApp-first AI plant health assistant"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

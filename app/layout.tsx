import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cornell Health AI Intake",
  description: "Frontend-only patient intake and voice capture workflow"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude Maxxing like a pro",
  description: "Tired of being cuck-blocked by Claude's limits?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

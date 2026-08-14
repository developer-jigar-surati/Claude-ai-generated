import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Agent OS — Launch AI voice agents in minutes",
  description:
    "Modular Voice Agent Platform (Voice Agent as a Service). Launch inbound & outbound AI voice agents in under 2 minutes using pre-configured agents and a no-code interface.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

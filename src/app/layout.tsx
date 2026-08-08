import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted so the pixel font works even without internet at the venue
// (SRD 2.6: pixel/monospace retro font for headers).
const pixelFont = localFont({
  src: "../fonts/PressStart2P-Regular.ttf",
  variable: "--font-pixel",
  display: "swap",
});

const bodyMono = Geist_Mono({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Who's That Pokémon? | Scavenger Hunt",
  description: "A retro Pokédex-themed scavenger hunt for the party.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#dc2626",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pixelFont.variable} ${bodyMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

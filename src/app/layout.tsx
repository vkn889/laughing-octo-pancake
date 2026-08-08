import type { Metadata, Viewport } from "next";
import { Geist_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";

// Fetched once at build time and self-hosted as a static asset from then
// on (SRD 2.6: pixel/monospace retro font for headers); only the machine
// running `npm run build` needs internet, not the party venue.
const pixelFont = Press_Start_2P({
  weight: "400",
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

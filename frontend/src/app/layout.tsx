import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { MusicPlayer } from "@/components/ui/music-player";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Moodify - Your Mood, Your Music",
  description: "An AI that understands your emotions and turns them into the perfect soundtrack. Say anything... we'll read the vibe.",
  keywords: ["music", "AI", "playlist", "mood", "emotion", "spotify", "streaming"],
  authors: [{ name: "Moodify" }],
  openGraph: {
    title: "Moodify - Your Mood, Your Music",
    description: "An AI that understands your emotions and turns them into the perfect soundtrack.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Moodify - Your Mood, Your Music",
    description: "An AI that understands your emotions and turns them into the perfect soundtrack.",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${inter.variable} ${plusJakarta.variable} antialiased bg-black`}
      >
        <Providers>
          <main className="min-h-screen bg-black text-white font-sans">
            {children}
            <MusicPlayer />
            <Toaster />
          </main>
        </Providers>
      </body>
    </html>
  );
}

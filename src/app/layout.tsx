import type { Metadata } from "next";
import { Instrument_Serif, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  title: "DateDrop — Drop a screenshot. Pick a date. Know if you can go.",
  description:
    "Drop screenshots of restaurants and trips. DateDrop figures out where they are, whether your dates actually work, and hands you the booking links.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${serif.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

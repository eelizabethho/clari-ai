import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Aboreto } from "next/font/google";
import { Providers } from "@/components/providers";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const aboreto = Aboreto({
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Clari AI - Interview Practice & Feedback",
  description: "Practice your interview skills with AI-powered feedback. Upload recordings, get transcripts, and improve your performance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={aboreto.className}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}


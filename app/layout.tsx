import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BidBrief – AI-Powered RFP Summarizer for B2B Sales Teams",
  description:
    "Upload any RFP PDF and get a structured summary of requirements, deadlines, and action items in seconds. Built for small teams and freelancers, not enterprise giants.",
  keywords: ["RFP summarizer", "AI bid tool", "proposal automation", "RFP analysis", "B2B sales"],
  openGraph: {
    title: "BidBrief – AI-Powered RFP Summarizer",
    description: "Turn 100-page RFP documents into clear, actionable summaries in seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

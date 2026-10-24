import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: {
    default: "Freelancer Saathi",
    template: "%s | Freelancer Saathi",
  },

  description:
    "An agentic AI financial assistant for freelancers — built to understand income, protect financial actions, and keep the freelancer in control.",

  applicationName: "Freelancer Saathi",

  keywords: [
    "Freelancer Saathi",
    "Agentic AI",
    "Freelancer Finance",
    "AI Financial Assistant",
    "Fintech",
    "Human in the Loop AI",
  ],

  authors: [
    {
      name: "Ali Raza Memon",
    },
  ],

  creator: "Ali Raza Memon",

  robots: {
    index: true,
    follow: true,
  },
};


export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`
        ${geistSans.variable}
        ${geistMono.variable}
      `}
    >
      <body>
        {children}
      </body>
    </html>
  );
}
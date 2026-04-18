import type { Metadata } from "next";
import { DM_Mono, DM_Serif_Display } from "next/font/google";
import { cn } from "@/lib/utils";
import { LandingMarketing } from "@/components/marketing/landing-marketing";
import "./flowpm-landing.css";

const dmSerif = DM_Serif_Display({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-landing-serif",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-landing-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FlowPM — Project Management for Bangladeshi Agencies",
  description:
    "FlowPM is built for 5–50 person agencies in Bangladesh. Track projects, manage clients, and ship on time — in one place, in your currency.",
};

export default function HomePage() {
  return <div className={cn(dmSerif.variable, dmMono.variable)}><LandingMarketing /></div>;
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resumelee — Tailor your resume without breaking the format",
  description:
    "Resumelee tailors your resume content to match any job description while keeping your original DOCX formatting, bullets, and layout perfectly intact.",
  openGraph: {
    title: "Resumelee — AI Resume Tailoring",
    description: "Tailor your resume to any job. Keep your format.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans">{children}</body>
    </html>
  );
}

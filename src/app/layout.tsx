import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

import { EnterpriseSplash } from "@/components/EnterpriseSplash";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: '%s | StoryBoard Plus',
    default: 'StoryBoard Plus - Advanced Storytelling Suite',
  },
  description: "The ultimate dashboard for storytellers, authors, and world-builders. Manage manuscripts, characters, and plots with AI-powered tools.",
  keywords: ["writing", "storytelling", "novel", "manuscript", "AI", "editor", "world-building", "screenwriting"],
  authors: [{ name: "StoryBoard Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} antialiased bg-background text-foreground font-sans flex`}>
        <EnterpriseSplash />
        <Sidebar />
        <main className="flex-1 min-w-0 h-screen overflow-y-auto pt-16 lg:pt-0">
          {children}
        </main>
      </body>
    </html>
  );
}

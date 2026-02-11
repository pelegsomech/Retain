import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RETAIN — Never Miss a Lead Again",
  description: "The autonomous lead-to-appointment platform for construction contractors. AI captures, qualifies, and books — in under 60 seconds.",
};

// Force dynamic rendering to avoid build-time Clerk errors
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if Clerk is configured - allows builds without env vars
  const hasClerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <html lang="en">
      <body
        className={`${inter.variable} ${bricolage.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );

  // Wrap in ClerkProvider only if configured
  if (hasClerk) {
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  return content;
}

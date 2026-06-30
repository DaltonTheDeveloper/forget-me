import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ClerkShell } from "@/components/clerk-shell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://forget-me.dev"),
  title: {
    default: "forget-me — delete everything connected to your email",
    template: "%s · forget-me",
  },
  description:
    "Discover where your email is registered, then send real, verification-gated GDPR/CCPA deletion requests — without ever touching your accounts.",
  keywords: ["GDPR", "CCPA", "data deletion", "privacy", "right to be forgotten"],
  openGraph: {
    title: "forget-me",
    description:
      "Delete everything connected to your email — automatically, privacy-first.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-bg text-fg antialiased">
        <ClerkShell>
          <div className="flex min-h-screen flex-col">
            <Nav />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ClerkShell>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Bricolage_Grotesque, Nunito_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { CharlyMascot } from "@/components/CharlyMascot";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Charly — find your people, help your neighborhood",
  description:
    "Charly the mascot matches you with a local volunteer crew and AI agents coordinate the plan with neighborhood orgs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <CharlyMascot size={34} />
              <span className="font-display text-2xl font-bold tracking-tight">
                Charly
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-1 text-sm font-semibold sm:gap-2">
              <Link href="/groups" className="rounded-full px-3 py-1.5 hover:bg-kraft">
                Groups
              </Link>
              <Link href="/orgs" className="rounded-full px-3 py-1.5 hover:bg-kraft">
                Org HQ
              </Link>
              <Link href="/dashboard" className="rounded-full px-3 py-1.5 hover:bg-kraft">
                Community board
              </Link>
              <Link href="/profile" className="rounded-full px-3 py-1.5 hover:bg-kraft">
                Profile
              </Link>
              <Link
                href="/join"
                className="rounded-full bg-coral px-4 py-1.5 text-white shadow-sm hover:bg-coral-deep"
              >
                Join
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-ink/10 py-6 text-center text-sm text-clay">
          Made with 🧡 in SF at the MLH AI for Social Good hackathon · powered by
          DigitalOcean Gradient AI · civic data from DataSF
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import Nav from "./Nav";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Yggdrasil",
  description: "Sistema de Organizacion Personal — RPG Style",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`h-full ${pixelFont.variable}`}>
      <body className={`min-h-full flex flex-col ${pixelFont.className}`}>
        {/* Header */}
        <header className="border-b-4 border-white p-4 flex items-center justify-between">
          <h1 className="text-lg" style={{ color: "var(--color-gold)" }}>
            Yggdrasil
          </h1>
          {/* Desktop nav in header */}
          <nav className="hidden md:block">
            <Nav />
          </nav>
        </header>

        <div className="flex flex-1">
          {/* Sidebar desktop */}
          <aside className="hidden md:flex flex-col gap-2 p-4 border-r-4 border-white w-48">
            <Nav vertical />
          </aside>

          {/* Main content */}
          <main className="flex-1 p-4 overflow-auto">{children}</main>
        </div>

        {/* Mobile bottom tabs */}
        <nav className="md:hidden border-t-4 border-white p-2">
          <Nav mobile />
        </nav>
      </body>
    </html>
  );
}

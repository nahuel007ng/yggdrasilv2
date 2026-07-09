import type { Metadata } from "next";
import { Press_Start_2P, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./Nav";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
    <html lang="es" className={`h-full ${pixelFont.variable} ${monoFont.variable}`}>
      <body className={`min-h-full flex flex-col ${monoFont.className}`}>
        {/* Header */}
        <header
          className="bg-[--color-bg] px-6 py-4 flex items-center"
          style={{ boxShadow: "0 var(--pixel-size) 0 0 var(--color-border)" }}
        >
          <span className="text-[--color-border] text-xs mr-3 hidden sm:inline">
            ▎▎
          </span>
          <h1
            className="text-lg"
            style={{ color: "var(--color-gold)" }}
          >
            Yggdrasil
          </h1>
          <span className="text-[--color-border] text-xs ml-3 hidden sm:inline">
            ▎▎
          </span>
        </header>

        <div className="flex flex-1">
          {/* Sidebar desktop */}
          <aside
            className="hidden md:flex flex-col gap-1 py-4 w-56 bg-[--color-bg]"
            style={{ boxShadow: "var(--pixel-size) 0 0 0 var(--color-border)" }}
          >
            <Nav vertical />
          </aside>

          {/* Main content */}
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>

        {/* Mobile bottom tabs */}
        <nav
          className="md:hidden bg-[--color-bg] py-1"
          style={{ boxShadow: "0 calc(-1 * var(--pixel-size)) 0 0 var(--color-border)" }}
        >
          <Nav mobile />
        </nav>
      </body>
    </html>
  );
}

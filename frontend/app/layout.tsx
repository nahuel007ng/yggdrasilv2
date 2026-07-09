import type { Metadata } from "next";
import { Press_Start_2P, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

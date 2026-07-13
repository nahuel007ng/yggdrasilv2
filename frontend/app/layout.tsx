import type { Metadata, Viewport } from "next";
import { Press_Start_2P, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import ChatWidget from "@/components/ChatWidget";

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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Yggdrasil",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1625",
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
        <ChatWidget />
      </body>
    </html>
  );
}

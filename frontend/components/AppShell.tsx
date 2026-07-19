"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/components/AuthProvider";
import AuthGuard from "@/components/AuthGuard";
import Nav from "@/app/Nav";
import BadgeWatcher from "@/components/BadgeWatcher";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      {isLogin ? (
        <>{children}</>
      ) : (
        <>
          {/* Header */}
          <header
            className="sticky top-0 z-30 bg-[--color-bg] px-4 md:px-6 py-3 flex items-center"
            style={{
              boxShadow:
                "0 var(--pixel-size) 0 0 color-mix(in srgb, var(--color-border-accent) 50%, transparent), var(--glow-mana-soft)",
            }}
          >
            {/* Hamburger — mobile only */}
            <button
              type="button"
              className="md:hidden mr-3 pixel-btn"
              style={{
                fontFamily: "var(--font-pixel)",
                fontSize: "14px",
                padding: "2px 10px",
                lineHeight: 1,
              }}
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú de navegación"
            >
              ☰
            </button>
            <h1 className="text-lg shrink-0 glow-text" style={{ color: "var(--color-gold)" }}>
              Yggdrasil
            </h1>

            {/* Nav horizontal — desktop only */}
            <div className="hidden md:flex flex-1 justify-end">
              <Nav />
            </div>
          </header>

          {/* Mobile sidebar overlay — unchanged */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/60 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
              <nav
                className="panel-system fixed top-0 left-0 bottom-0 w-[260px] z-50 p-4 overflow-y-auto md:hidden"
                style={{ animation: "sidebar-slide-in 0.2s ease-out" }}
                aria-label="Menú de navegación"
              >
                <button
                  type="button"
                  className="pixel-btn"
                  style={{
                    position: "absolute",
                    top: "var(--space-4)",
                    right: "var(--space-4)",
                    padding: "2px 8px",
                    fontFamily: "var(--font-pixel)",
                    fontSize: "10px",
                    lineHeight: 1,
                  }}
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Cerrar menú"
                >
                  ✕
                </button>
                <div className="flex flex-col gap-1 py-4">
                  <Nav
                    vertical
                    onNavigate={() => setSidebarOpen(false)}
                  />
                </div>
              </nav>
            </>
          )}

          {/* Main content — full width now (no sidebar) */}
          <AuthGuard>
            <BadgeWatcher />
            <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
          </AuthGuard>
        </>
      )}
    </AuthProvider>
  );
}

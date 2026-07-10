"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/components/AuthProvider";
import AuthGuard from "@/components/AuthGuard";
import Nav from "@/app/Nav";

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
            className="bg-[--color-bg] px-6 py-4 flex items-center"
            style={{ boxShadow: "0 var(--pixel-size) 0 0 var(--color-border)" }}
          >
            {/* Hamburger — mobile only */}
            <button
              type="button"
              className="md:hidden mr-4 pixel-btn"
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
            <span className="text-[--color-border] text-xs mr-3 hidden sm:inline">
              ▎▎
            </span>
            <h1 className="text-lg" style={{ color: "var(--color-gold)" }}>
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
              style={{
                boxShadow: "var(--pixel-size) 0 0 0 var(--color-border)",
              }}
            >
              <Nav vertical />
            </aside>

            {/* Sidebar mobile overlay */}
            {sidebarOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="md:hidden"
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.5)",
                    zIndex: 40,
                  }}
                  onClick={() => setSidebarOpen(false)}
                  aria-hidden="true"
                />
                {/* Drawer */}
                <nav
                  className="md:hidden"
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: "260px",
                    background: "var(--color-bg)",
                    zIndex: 50,
                    padding: "var(--space-4)",
                    overflowY: "auto",
                    boxShadow: "var(--pixel-size) 0 0 0 var(--color-border)",
                    animation: "sidebar-slide-in 0.2s ease-out",
                  }}
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

            {/* Main content */}
            <AuthGuard>
              <main className="flex-1 p-6 overflow-auto">{children}</main>
            </AuthGuard>
          </div>
        </>
      )}
    </AuthProvider>
  );
}
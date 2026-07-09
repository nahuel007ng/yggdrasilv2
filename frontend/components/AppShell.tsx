"use client";

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

            {/* Main content */}
            <AuthGuard>
              <main className="flex-1 p-6 overflow-auto">{children}</main>
            </AuthGuard>
          </div>

          {/* Mobile bottom tabs */}
          <nav
            className="md:hidden bg-[--color-bg] py-1"
            style={{
              boxShadow: "0 calc(-1 * var(--pixel-size)) 0 0 var(--color-border)",
            }}
          >
            <Nav mobile />
          </nav>
        </>
      )}
    </AuthProvider>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "⚔️" },
  { href: "/habitos", label: "Habitos", icon: "🔥" },
  { href: "/finanzas", label: "Finanzas", icon: "💰" },
  { href: "/tareas", label: "Tareas", icon: "📋" },
  { href: "/estudios", label: "Estudios", icon: "📚" },
  { href: "/entrenamientos", label: "Entreno", icon: "💪" },
  { href: "/perfil", label: "Perfil", icon: "🛡️" },
];

export default function Nav({
  vertical,
  onNavigate,
}: {
  vertical?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  if (vertical) {
    return (
      <>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-[3px]
                ${isActive
                  ? "bg-[--color-bg-surface] text-[--color-gold] border-[--color-mana]"
                  : "text-[--color-text-muted] hover:bg-[--color-bg-surface-hover] hover:text-[--color-text] border-transparent"
                }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
        <div className="flex-1" />
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-[3px] text-hp hover:bg-[--color-bg-surface-hover] hover:text-[--color-text] border-transparent"
        >
          <span className="text-lg">🚪</span>
          Salir
        </button>
      </>
    );
  }

  // Horizontal mode (fallback, not used in current layout)
  return (
    <div className="flex gap-6">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm transition-colors
              ${isActive
                ? "text-[--color-gold]"
                : "text-[--color-text-muted] hover:text-[--color-text]"
              }`}
          >
            {link.icon} {link.label}
          </Link>
        );
      })}
    </div>
  );
}

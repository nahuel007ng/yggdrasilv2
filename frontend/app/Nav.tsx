"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import PixelIcon from "@/components/PixelIcon";

const links = [
  { href: "/dashboard", label: "Dashboard", spriteKey: "nav-dashboard" },
  { href: "/habitos", label: "Habitos", spriteKey: "nav-habitos" },
  { href: "/finanzas", label: "Finanzas", spriteKey: "nav-finanzas" },
  { href: "/tareas", label: "Tareas", spriteKey: "nav-tareas" },
  { href: "/estudios", label: "Estudios", spriteKey: "nav-estudios" },
  { href: "/calendario", label: "Calendario", spriteKey: "nav-calendario" },
  { href: "/perfil", label: "Perfil", spriteKey: "nav-perfil" },
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
              className={`nav-item flex items-center gap-3 px-4 py-3 text-sm border-l-[3px]
                ${isActive
                  ? "nav-item-active text-[--color-gold] border-[--color-purple]"
                  : "text-[--color-text-muted] hover:bg-[--color-bg-surface-hover] hover:text-[--color-text] border-transparent"
                }`}
            >
              <PixelIcon name={link.spriteKey} size={40} className="shrink-0" />
              {link.label}
            </Link>
          );
        })}
        <div className="flex-1" />
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-[3px] text-hp hover:bg-[--color-bg-surface-hover] hover:text-[--color-text] border-transparent"
        >
          <PixelIcon name="nav-logout" size={40} className="shrink-0" />
          Salir
        </button>
      </>
    );
  }

  // Horizontal mode — desktop top bar
  return (
    <div className="flex gap-4 items-center">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-item text-xs flex items-center gap-1 px-2 py-1 rounded
              ${isActive
                ? "nav-item-active text-[--color-gold]"
                : "text-[--color-text-muted] hover:text-[--color-text]"
              }`}
          >
            <PixelIcon name={link.spriteKey} size={32} className="shrink-0" />
            <span className="hidden lg:inline">{link.label}</span>
          </Link>
        );
      })}
      <button
        onClick={signOut}
        className="text-xs transition-colors flex items-center gap-1 px-1 py-1 text-hp hover:text-[--color-text]"
      >
        <PixelIcon name="nav-logout" size={32} className="shrink-0" />
        <span className="hidden lg:inline">Salir</span>
      </button>
    </div>
  );
}
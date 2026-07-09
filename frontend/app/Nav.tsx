"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "⚔️" },
  { href: "/habitos", label: "Habitos", icon: "🔥" },
  { href: "/finanzas", label: "Finanzas", icon: "💰" },
];

export default function Nav({
  vertical,
  mobile,
}: {
  vertical?: boolean;
  mobile?: boolean;
}) {
  const pathname = usePathname();

  if (mobile) {
    return (
      <div className="flex justify-around">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-2 px-3 text-[10px] transition-colors relative
                ${isActive
                  ? "text-[--color-gold]"
                  : "text-[--color-text-muted] hover:text-[--color-text]"
                }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-[--color-mana]" />
              )}
              <span className="text-2xl">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </div>
    );
  }

  if (vertical) {
    return (
      <>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
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

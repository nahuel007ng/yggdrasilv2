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
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-center text-xs p-2 ${
              pathname === link.href ? "nav-link-active" : "text-white"
            }`}
          >
            <span className="block text-xl">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>
    );
  }

  if (vertical) {
    return (
      <>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block p-2 text-xs ${
              pathname === link.href ? "nav-link-active" : "text-white"
            }`}
          >
            {link.icon} {link.label}
          </Link>
        ))}
      </>
    );
  }

  return (
    <div className="flex gap-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`text-xs ${
            pathname === link.href ? "nav-link-active" : "text-white"
          }`}
        >
          {link.icon} {link.label}
        </Link>
      ))}
    </div>
  );
}

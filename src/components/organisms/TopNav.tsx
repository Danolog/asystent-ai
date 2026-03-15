"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, FileText, Bell, Settings } from "lucide-react";

const navItems = [
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/knowledge", icon: FileText, label: "Baza" },
  { href: "/notifications", icon: Bell, label: "Powiadomienia" },
  { href: "/settings", icon: Settings, label: "Ustawienia" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
      <div className="flex items-center gap-2 pl-12 md:pl-0">
        <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          🤖 Asystent AI
        </span>
      </div>
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
              }`}
              title={item.label}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

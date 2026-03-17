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
    <>
      {/* Desktop top nav */}
      <header className="hidden md:flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            🌙 Luna AI
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
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

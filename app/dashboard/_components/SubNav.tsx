"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "My Flashcards" },
  { href: "/dashboard/create", label: "Create Flashcard" },
];

export default function SubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {TABS.map((tab) => {
        const active =
          tab.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              active
                ? "bg-red-500 text-white"
                : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/app/overview", label: "Overview", icon: "▦" },
  { href: "/app/create", label: "Create Agent", icon: "＋" },
  { href: "/app/agents", label: "My Agents", icon: "☎" },
  { href: "/app/analytics", label: "Analytics", icon: "▤" },
  { href: "/app/sdk", label: "SDK & API", icon: "</>" },
  { href: "/app/settings", label: "Settings", icon: "⚙" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-[#0f0e17]/90">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4">
        {/* Brand */}
        <Link href="/app/overview" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-lg shadow-pop">
            🎙️
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Voice Agent OS
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Voice Agent OS
            </span>
          </span>
        </Link>

        {/* Workspace switcher */}
        <button className="ml-1 hidden items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5 sm:inline-flex">
          <span className="grid h-5 w-5 place-items-center rounded bg-brand-100 text-[10px] font-bold text-brand-700">
            AC
          </span>
          Acme Corp
          <span className="text-slate-400">▾</span>
        </button>

        {/* Desktop nav */}
        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
              >
                <span className="text-xs opacity-70">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setDark((d) => !d)}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
            aria-label="Toggle theme"
          >
            {dark ? "☀️" : "🌙"}
          </button>
          <button className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">
            🔔
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-500" />
          </button>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
            PS
          </span>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 lg:hidden"
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="border-t border-slate-200 px-4 py-2 lg:hidden dark:border-white/10">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`nav-link my-0.5 w-full ${active ? "nav-link-active" : ""}`}
              >
                <span className="text-xs opacity-70">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}

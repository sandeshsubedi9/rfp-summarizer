"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import Image from "next/image";

interface DashboardShellProps {
  session: Session;
  children: React.ReactNode;
}

const navItems = [
  {
    href: "/dashboard",
    label: "My Documents",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function DashboardShell({ session, children }: DashboardShellProps) {
  const pathname = usePathname();
  const user = session.user;

  return (
    <div className="min-h-screen bg-brand-muted flex flex-col">
      {/* ── TOP APPBAR ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-14 bg-white border-b border-brand-border flex items-center justify-between px-6 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span>📋</span>
          <span className="text-brand-teal">BidBrief</span>
        </Link>

        {/* User menu */}
        <div className="flex items-center gap-3">
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "User"}
              width={32}
              height={32}
              className="rounded-full border border-brand-border"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-teal-lt flex items-center justify-center text-brand-teal font-bold text-sm">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          <span className="hidden sm:block text-sm font-semibold text-brand-dark">
            {user?.name}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs font-bold text-brand-sage hover:text-brand-teal transition-colors px-3 py-1.5 rounded-brand hover:bg-brand-muted"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── SIDEBAR ────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-brand-border pt-6 pb-4 px-3">
          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-brand text-sm font-semibold transition-all ${
                    active
                      ? "bg-brand-teal-lt text-brand-teal"
                      : "text-brand-sage hover:bg-brand-muted hover:text-brand-dark"
                  }`}
                >
                  <span className={active ? "text-brand-teal" : "text-brand-sage"}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Usage counter */}
          <div className="mt-auto px-3 pt-4 border-t border-brand-border">
            <div className="text-[0.7rem] font-black uppercase tracking-widest text-brand-sage mb-2">
              Free Plan
            </div>
            <div className="flex items-center justify-between text-xs text-brand-dark font-semibold mb-1.5">
              <span>Uploads this month</span>
              <span className="text-brand-teal">0 / 3</span>
            </div>
            <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
              <div className="h-full bg-brand-teal rounded-full" style={{ width: "0%" }} />
            </div>
            <Link
              href="#pricing"
              className="mt-3 w-full inline-flex items-center justify-center px-3 py-2 rounded-brand text-xs font-bold border border-brand-border text-brand-dark hover:border-brand-teal hover:text-brand-teal transition-all"
            >
              Upgrade to Pro
            </Link>
          </div>
        </aside>

        {/* ── MAIN CONTENT ───────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

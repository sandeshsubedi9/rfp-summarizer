"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <nav className="sticky top-0 z-50 py-4 bg-white/90 backdrop-blur-md border-b border-brand-border shadow-sm transition-all duration-300">
      <div className="container mx-auto px-6 flex items-center justify-between gap-6 max-w-7xl">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight flex items-center gap-2"
        >
          <span className="text-brand-dark">📋</span>
          <span className="text-brand-teal">BidBrief</span>
        </Link>

        <ul className="hidden md:flex items-center gap-10 list-none">
          {[
            { href: "#why-us", label: "Why Us" },
            { href: "#how-it-works", label: "How It Works" },
            { href: "#features", label: "Features" },
            { href: "#pricing", label: "Pricing" },
            { href: "#faq", label: "FAQ" },
          ].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-brand-sage text-sm font-semibold hover:text-brand-teal transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              {/* Avatar */}
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "User"}
                  width={30}
                  height={30}
                  className="rounded-full border border-brand-border"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-teal-lt flex items-center justify-center text-brand-teal font-bold text-xs">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-5 py-2 rounded-brand text-sm font-bold bg-brand-teal text-white hover:bg-[#035e44] transition-all"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="hidden sm:inline-flex items-center justify-center text-sm font-bold text-brand-sage hover:text-brand-teal transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center justify-center text-sm font-bold text-brand-sage hover:text-brand-teal transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-brand text-sm font-bold bg-brand-teal text-white hover:bg-[#035e44] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(4,124,88,0.35)] transition-all"
              >
                Start Free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}


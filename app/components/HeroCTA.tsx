"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface HeroCTAProps {
  label: string;
  variant?: "primary" | "secondary";
  className?: string;
}

export default function HeroCTA({
  label,
  variant = "primary",
  className,
}: HeroCTAProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleClick = () => {
    if (status === "loading") return;
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  const base =
    variant === "primary"
      ? "inline-flex items-center justify-center px-9 py-4 rounded-brand text-base font-bold bg-brand-teal text-white hover:bg-[#035e44] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(4,124,88,0.35)] transition-all"
      : "inline-flex items-center justify-center px-9 py-4 rounded-brand text-base font-bold border border-brand-border text-brand-dark hover:border-brand-teal hover:text-brand-teal transition-all bg-white";

  return (
    <button
      onClick={handleClick}
      className={`${base} ${className ?? ""} transition-all`}
    >
      {label}
    </button>
  );
}

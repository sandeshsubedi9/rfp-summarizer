"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SignupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Automatically log the user in after successful registration
      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (loginRes?.error) {
        setError(loginRes.error);
        setLoading(false);
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-brand-border shadow-lg p-8 sm:p-10">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight mb-6">
          <span className="text-brand-dark">📋</span>
          <span className="text-brand-teal">BidBrief</span>
        </Link>
        <h1 className="text-2xl font-bold text-brand-dark mb-2">Create an account</h1>
        <p className="text-sm text-brand-sage">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-teal hover:underline font-bold">
            Log in
          </Link>
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-semibold text-center border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="flex flex-col gap-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-brand-sage uppercase tracking-wider mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-teal transition-colors"
            placeholder="Jane Doe"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-brand-sage uppercase tracking-wider mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-teal transition-colors"
            placeholder="you@company.com"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-brand-sage uppercase tracking-wider mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-brand-border text-sm focus:outline-none focus:border-brand-teal transition-colors"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-brand-teal text-white font-bold py-3.5 rounded-xl hover:bg-[#035e44] transition-all disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <div className="relative flex items-center py-2 mb-6">
        <div className="flex-grow border-t border-brand-border"></div>
        <span className="flex-shrink-0 mx-4 text-brand-sage text-xs font-bold uppercase tracking-widest">
          Or
        </span>
        <div className="flex-grow border-t border-brand-border"></div>
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl })}
        type="button"
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border-2 border-brand-border bg-white text-brand-dark font-bold hover:border-brand-teal hover:text-brand-teal hover:bg-brand-teal-lt/30 transition-all group"
      >
        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign up with Google
      </button>

      <p className="mt-8 text-center text-xs text-brand-sage max-w-xs mx-auto leading-relaxed">
        By continuing, you agree to BidBrief's{" "}
        <Link href="#" className="underline hover:text-brand-dark">Terms of Service</Link>
        {" "}and{" "}
        <Link href="#" className="underline hover:text-brand-dark">Privacy Policy</Link>.
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-muted p-4">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white rounded-2xl border border-brand-border shadow-lg p-10 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-border border-t-brand-teal animate-spin" />
        </div>
      }>
        <SignupForm />
      </Suspense>
    </div>
  );
}

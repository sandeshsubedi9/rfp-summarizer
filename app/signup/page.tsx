"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Automatically log them in after successful registration
        const signInRes = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInRes?.error) {
          setError("Account created, but automatic login failed. Please log in manually.");
        } else {
          router.push("/dashboard"); // Redirect wherever you want after login
        }
      } else {
        const data = await res.json();
        setError(data.message || "An error occurred during registration.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-brand-border">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-extrabold tracking-tight flex items-center justify-center gap-2 mb-2">
            <span>📋</span>
            <span className="text-brand-teal">BidBrief</span>
          </Link>
          <h2 className="text-2xl font-bold text-brand-dark">Create an account</h2>
          <p className="text-brand-sage text-sm mt-2">Start summarizing RFPs in seconds.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-6 border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal transition-all"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal transition-all"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-brand-teal text-white rounded-lg font-bold hover:bg-[#035e44] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <span className="border-b border-brand-border w-1/5 lg:w-1/4"></span>
          <span className="text-xs text-center text-brand-sage uppercase">or continue with</span>
          <span className="border-b border-brand-border w-1/5 lg:w-1/4"></span>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="mt-6 w-full flex items-center justify-center gap-3 py-3 px-4 border border-brand-border rounded-lg text-brand-dark font-semibold hover:bg-gray-50 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>

        <p className="mt-8 text-center text-sm text-brand-sage">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-teal font-bold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

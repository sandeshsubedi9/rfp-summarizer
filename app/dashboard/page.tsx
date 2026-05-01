import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard — BidBrief",
  description: "Upload and manage your RFP documents.",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin?callbackUrl=/dashboard");

  const firstName = session.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* ── GREETING ──────────────────────────────────────── */}
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark tracking-tight">
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-brand-sage mt-1 text-sm font-medium">
          Upload an RFP to get your structured action plan in under 60 seconds.
        </p>
      </div>

      {/* ── EMPTY STATE CARD ──────────────────────────────── */}
      <div className="bg-white border-2 border-dashed border-brand-border rounded-[1.5rem] p-12 md:p-20 flex flex-col items-center text-center gap-6 hover:border-brand-teal transition-colors group">
        {/* Animated icon */}
        <div className="w-20 h-20 rounded-2xl bg-brand-teal-lt flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">
          📄
        </div>

        <div>
          <h2 className="text-xl font-bold text-brand-dark mb-2">
            No documents yet
          </h2>
          <p className="text-brand-sage text-sm max-w-sm leading-relaxed">
            Upload your first RFP and the AI will extract every requirement,
            deadline, and red flag — with page citations.
          </p>
        </div>

        <Link
          href="/dashboard/upload"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-brand text-sm font-bold bg-brand-teal text-white hover:bg-[#035e44] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(4,124,88,0.3)] transition-all"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Your First RFP
        </Link>

        <p className="text-xs text-brand-sage font-medium">
          PDF or Word document · up to 50 MB · results in ~60 seconds
        </p>
      </div>

      {/* ── WHAT HAPPENS NEXT ─────────────────────────────── */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          {
            step: "01",
            title: "Upload the RFP",
            body: "Drag and drop your PDF. We accept government tenders, enterprise RFPs, and procurement documents.",
          },
          {
            step: "02",
            title: "AI Reads Everything",
            body: "Gemini reads the full document and extracts every requirement, deadline, red flag, and deliverable.",
          },
          {
            step: "03",
            title: "Get Your Action Plan",
            body: "Review your structured dashboard. Export to Excel in one click. Never miss a requirement again.",
          },
        ].map((s) => (
          <div
            key={s.step}
            className="bg-white border border-brand-border rounded-[1.25rem] p-6 flex flex-col gap-3 hover:border-brand-teal hover:shadow-[0_8px_30px_rgba(4,124,88,0.06)] transition-all"
          >
            <span className="w-9 h-9 rounded-full bg-brand-teal-lt text-brand-teal flex items-center justify-center text-xs font-black">
              {s.step}
            </span>
            <h3 className="text-sm font-bold text-brand-dark">{s.title}</h3>
            <p className="text-xs text-brand-sage leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

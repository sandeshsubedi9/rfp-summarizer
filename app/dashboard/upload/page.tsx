"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ─── Types ──────────────────────────────────────────────────── */
type Step = "dropzone" | "context" | "processing";

const FOCUS_FLAGS = [
  "Insurance & bonding requirements",
  "Certifications (SOC2, ISO, HIPAA, FedRAMP)",
  "Minority / diversity requirements",
  "Performance bonds & penalties",
  "Incumbent vendor disadvantages",
];

const PROCESSING_STEPS = [
  "Uploading document...",
  "Parsing text (reading all pages)...",
  "Running AI extraction...",
  "Building your dashboard...",
];

/* ─── Helpers ────────────────────────────────────────────────── */
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("dropzone");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState("");

  // Step 2 context state
  const [companyContext, setCompanyContext] = useState("");
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);

  // Processing state
  const [processingStep, setProcessingStep] = useState(0);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [error, setError] = useState("");

  /* ── File validation ─────────────────────────────────────── */
  const validateFile = (f: File): string => {
    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(f.type) && !f.name.endsWith(".pdf") && !f.name.endsWith(".docx")) {
      return "Only PDF and Word (.docx) files are supported.";
    }
    if (f.size > 50 * 1024 * 1024) return "File must be under 50 MB.";
    return "";
  };

  const handleFileChosen = (f: File) => {
    const err = validateFile(f);
    if (err) { setDragError(err); return; }
    setDragError("");
    setFile(f);
    setStep("context");
  };

  /* ── Drag handlers ───────────────────────────────────────── */
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(true);
  }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileChosen(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Flag toggle ─────────────────────────────────────────── */
  const toggleFlag = (flag: string) =>
    setSelectedFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );

  /* ── Submit to API ───────────────────────────────────────── */
  const handleAnalyze = async () => {
    if (!file) return;
    setStep("processing");
    setError("");
    setProcessingStep(0);
    setDoneSteps([]);

    // Animate processing steps
    const tickStep = (idx: number) => {
      setProcessingStep(idx);
      setTimeout(() => setDoneSteps((p) => [...p, idx]), 800);
    };
    tickStep(0);
    const t1 = setTimeout(() => tickStep(1), 2000);
    const t2 = setTimeout(() => tickStep(2), 4000);
    const t3 = setTimeout(() => tickStep(3), 6000);

    try {
      const contextStr = [
        companyContext,
        selectedFlags.length ? `Pay extra attention to: ${selectedFlags.join(", ")}` : "",
      ].filter(Boolean).join(". ");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("context", contextStr);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "limit_reached") {
          setError("You've used all 3 free uploads this month. Upgrade to Pro for unlimited access.");
        } else {
          setError(data.error ?? "Something went wrong. Please try again.");
        }
        setStep("context");
        return;
      }

      // Finish all steps visually
      setDoneSteps([0, 1, 2, 3]);
      setProcessingStep(3);

      // Redirect to results after a short pause
      setTimeout(() => {
        router.push(`/dashboard/results/${data.analysisId}`);
      }, 800);
    } catch {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      setError("Network error. Please check your connection and try again.");
      setStep("context");
    }
  };

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-start justify-center p-6 md:p-12 bg-brand-muted">
      <div className="w-full max-w-2xl">

        {/* ── STEP INDICATOR ─────────────────────────────── */}
        {step !== "processing" && (
          <div className="flex items-center gap-3 mb-8">
            {["Upload", "Context", "Analyze"].map((label, i) => {
              const current = step === "dropzone" ? 0 : step === "context" ? 1 : 2;
              const done = i < current;
              const active = i === current;
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 text-sm font-bold transition-colors ${
                    active ? "text-brand-teal" : done ? "text-brand-teal/60" : "text-brand-sage"
                  }`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      done ? "bg-brand-teal text-white" : active ? "bg-brand-teal-lt text-brand-teal border-2 border-brand-teal" : "bg-brand-border text-brand-sage"
                    }`}>
                      {done ? "✓" : i + 1}
                    </span>
                    <span className="hidden sm:block">{label}</span>
                  </div>
                  {i < 2 && <div className={`w-12 h-0.5 rounded ${done ? "bg-brand-teal" : "bg-brand-border"}`} />}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ STEP 1: DROPZONE ═══════════════════════════════ */}
        {step === "dropzone" && (
          <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-8">
            <h1 className="text-2xl font-extrabold text-brand-dark mb-1">Upload Your RFP</h1>
            <p className="text-sm text-brand-sage mb-8">PDF or Word document · up to 50 MB</p>

            {/* Drop zone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-5 py-16 px-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-brand-teal bg-brand-teal-lt/50 scale-[1.01]"
                  : "border-brand-border bg-brand-muted hover:border-brand-teal hover:bg-brand-teal-lt/20"
              }`}
            >
              {/* Animated upload icon */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-200 ${
                isDragging ? "bg-brand-teal text-white scale-110" : "bg-brand-teal-lt text-brand-teal"
              }`}>
                {isDragging ? "📂" : "📄"}
              </div>

              <div className="text-center">
                <p className="text-base font-bold text-brand-dark mb-1">
                  {isDragging ? "Drop it here!" : "Drag & drop your RFP"}
                </p>
                <p className="text-sm text-brand-sage">
                  or <span className="text-brand-teal font-bold underline underline-offset-2">click to browse</span>
                </p>
              </div>

              <div className="flex gap-3">
                {["PDF", "DOCX"].map((ext) => (
                  <span key={ext} className="text-xs font-black bg-brand-border text-brand-sage px-3 py-1 rounded-full tracking-wider">
                    {ext}
                  </span>
                ))}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileChosen(f);
                }}
              />
            </div>

            {dragError && (
              <p className="mt-3 text-sm font-semibold text-red-500 flex items-center gap-2">
                ⚠ {dragError}
              </p>
            )}

            <p className="mt-6 text-xs text-brand-sage text-center">
              Your document is encrypted in transit and deleted after your retention period. We never share your files.
            </p>
          </div>
        )}

        {/* ══ STEP 2: CONTEXT ════════════════════════════════ */}
        {step === "context" && file && (
          <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-8">
            <h1 className="text-2xl font-extrabold text-brand-dark mb-1">Add Context <span className="text-brand-sage font-medium text-lg">(optional)</span></h1>
            <p className="text-sm text-brand-sage mb-8">
              Helps the AI prioritize what matters to you — but skipping is perfectly fine.
            </p>

            {/* File pill */}
            <div className="flex items-center gap-3 mb-8 p-4 bg-brand-teal-lt/40 rounded-xl border border-brand-teal/20">
              <span className="text-2xl">📄</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-brand-dark truncate">{file.name}</p>
                <p className="text-xs text-brand-sage">{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={() => { setFile(null); setStep("dropzone"); }}
                className="text-brand-sage hover:text-red-500 transition-colors text-sm font-bold shrink-0"
              >
                ✕ Change
              </button>
            </div>

            {/* Company context */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-brand-dark mb-2">
                What does your company offer?
              </label>
              <input
                type="text"
                value={companyContext}
                onChange={(e) => setCompanyContext(e.target.value)}
                placeholder="e.g. IT managed services, cybersecurity consulting, construction"
                className="w-full px-4 py-3 rounded-xl border border-brand-border text-sm text-brand-dark placeholder:text-brand-sage focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10 transition-all"
              />
            </div>

            {/* Focus flags */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-brand-dark mb-3">
                Pay extra attention to:
              </label>
              <div className="flex flex-col gap-2.5">
                {FOCUS_FLAGS.map((flag) => {
                  const checked = selectedFlags.includes(flag);
                  return (
                    <button
                      key={flag}
                      onClick={() => toggleFlag(flag)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
                        checked
                          ? "border-brand-teal bg-brand-teal-lt/40 text-brand-teal"
                          : "border-brand-border text-brand-dark hover:border-brand-teal/40"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-xs shrink-0 transition-all ${
                        checked ? "bg-brand-teal text-white" : "border-2 border-brand-border"
                      }`}>
                        {checked ? "✓" : ""}
                      </span>
                      {flag}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-brand-sage">
                💡 Skipping these is fine — the AI extracts everything regardless.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
                ⚠ {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep("dropzone")}
                className="px-5 py-3 rounded-xl border border-brand-border text-sm font-bold text-brand-sage hover:border-brand-teal hover:text-brand-teal transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleAnalyze}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-teal text-white text-sm font-bold hover:bg-[#035e44] hover:shadow-[0_4px_14px_rgba(4,124,88,0.3)] transition-all"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Analyze This RFP
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: PROCESSING ═════════════════════════════ */}
        {step === "processing" && (
          <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-10 flex flex-col items-center text-center gap-8">
            {/* Pulsing logo */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-brand-teal flex items-center justify-center text-4xl animate-pulse">
                🧠
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-teal border-2 border-white animate-ping" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-brand-dark mb-2">Analyzing your RFP...</h2>
              <p className="text-sm text-brand-sage">
                ~45 seconds for a 100-page document. Please don&apos;t close this tab.
              </p>
            </div>

            {/* Animated steps */}
            <div className="w-full flex flex-col gap-3 max-w-sm">
              {PROCESSING_STEPS.map((label, i) => {
                const isDone = doneSteps.includes(i);
                const isActive = processingStep === i && !isDone;
                return (
                  <div key={label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                    isDone ? "border-brand-teal bg-brand-teal-lt/40" :
                    isActive ? "border-brand-teal/40 bg-brand-muted" :
                    "border-brand-border bg-brand-muted opacity-40"
                  }`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                      isDone ? "bg-brand-teal text-white" :
                      isActive ? "border-2 border-brand-teal bg-white" :
                      "bg-brand-border text-brand-sage"
                    }`}>
                      {isDone ? "✓" : isActive ? (
                        <span className="block w-2.5 h-2.5 rounded-full bg-brand-teal animate-pulse" />
                      ) : i + 1}
                    </span>
                    <span className={`text-sm font-semibold ${isDone ? "text-brand-teal" : isActive ? "text-brand-dark" : "text-brand-sage"}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-brand-sage max-w-xs">
              💡 AI extraction is designed to accelerate your review, not replace it. Always verify critical compliance items against the source document.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

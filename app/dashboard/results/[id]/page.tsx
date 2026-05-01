"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Document, Page, pdfjs } from "react-pdf";
import * as XLSX from "xlsx";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Set up the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Tab = "summary" | "requirements" | "dates" | "redflags" | "deliverables";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  
  // PDF Viewer state
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfError, setPdfError] = useState("");

  const handleExportExcel = () => {
    if (!data) return;

    // 1. Requirements Sheet
    const reqs = data.requirements?.map((r: any) => ({
      Category: r.category,
      "Is Mandatory": r.mandatory ? "Yes" : "No",
      Requirement: r.text,
      "Page Source": r.page,
      "AI Confidence": `${r.confidence}%`,
      "My Notes": "", // Blank column for user
    })) || [];
    const wsReqs = XLSX.utils.json_to_sheet(reqs);

    // 2. Dates Sheet
    const dates = data.keyDates?.map((d: any) => ({
      Event: d.label,
      Date: d.date,
      "Page Source": d.page,
    })) || [];
    const wsDates = XLSX.utils.json_to_sheet(dates);

    // 3. Red Flags Sheet
    const flags = data.redFlags?.map((f: any) => ({
      "Red Flag": f.text,
      Reasoning: f.reason,
      "Page Source": f.page,
    })) || [];
    const wsFlags = XLSX.utils.json_to_sheet(flags);

    // 4. Summary Sheet
    const summary = [
      { Field: "RFP Title", Value: data.rfpTitle || "" },
      { Field: "Issuing Agency", Value: data.issuingAgency || "" },
      { Field: "Go/No-Go Score", Value: data.goNoGoScore || "" },
      { Field: "Reasoning", Value: data.goNoGoReasoning || "" },
      { Field: "Executive Summary", Value: data.executiveSummary || "" },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summary);

    // Build Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
    XLSX.utils.book_append_sheet(wb, wsReqs, "Requirements Matrix");
    XLSX.utils.book_append_sheet(wb, wsDates, "Key Dates");
    XLSX.utils.book_append_sheet(wb, wsFlags, "Red Flags");

    // Auto-size columns for Requirements
    wsReqs["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 80 }, { wch: 12 }, { wch: 15 }, { wch: 30 }];

    // Download
    XLSX.writeFile(wb, `Compliance_Matrix_${data.fileName || "RFP"}.xlsx`);
  };

  useEffect(() => {
    fetch(`/api/analysis/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setError(json.error ?? "Failed to load data");
        setLoading(false);
      })
      .catch(() => {
        setError("Network error");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-brand-muted">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-border border-t-brand-teal animate-spin" />
          <p className="text-brand-sage font-bold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center bg-brand-muted p-6">
        <div className="bg-white p-8 rounded-2xl border border-red-200 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-2xl mx-auto mb-4">
            ⚠
          </div>
          <h2 className="text-xl font-bold text-brand-dark mb-2">Error</h2>
          <p className="text-brand-sage mb-6">{error || "Data not found"}</p>
          <Link href="/dashboard" className="px-6 py-2 rounded-brand bg-brand-dark text-white font-bold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-brand-muted overflow-hidden">
      
      {/* ── APPBAR ─────────────────────────────────────────── */}
      <div className="h-14 bg-white border-b border-brand-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-brand-sage hover:text-brand-dark font-bold text-sm flex items-center gap-1">
            ← Back
          </Link>
          <div className="w-px h-5 bg-brand-border" />
          <h1 className="font-bold text-brand-dark truncate max-w-sm" title={data.fileName}>
            {data.fileName}
          </h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportExcel}
            className="px-5 py-2 rounded-brand bg-brand-teal text-white text-sm font-bold shadow-sm hover:bg-[#035e44] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(4,124,88,0.3)] transition-all flex items-center gap-2"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export to Excel
          </button>
        </div>
      </div>

      {/* ── THREE PANE LAYOUT ──────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 1. LEFT PANE (Go/No-Go & Stats) */}
        <div className="w-64 bg-white border-r border-brand-border flex flex-col shrink-0 overflow-y-auto">
          <div className="p-6 border-b border-brand-border text-center">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-sage mb-6">Match Score</h2>
            
            {/* SVG Dial */}
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#E0DED9" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke={data.goNoGoScore >= 70 ? "#047C58" : data.goNoGoScore >= 40 ? "#F59E0B" : "#EF4444"}
                  strokeWidth="10"
                  strokeDasharray={`${(data.goNoGoScore || 0) * 2.827} 282.7`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-brand-dark leading-none">{data.goNoGoScore || "?"}</span>
                <span className="text-[0.6rem] font-bold text-brand-sage uppercase">/ 100</span>
              </div>
            </div>
            
            <p className="text-xs text-brand-sage leading-relaxed font-medium">
              {data.goNoGoReasoning || "AI did not provide reasoning."}
            </p>
          </div>

          <div className="p-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-sage mb-4">Quick Stats</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-brand-dark">Requirements</span>
                <span className="bg-brand-muted px-2 py-0.5 rounded-full">{data.requirements?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-red-600">Red Flags</span>
                <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{data.redFlags?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-brand-dark">Key Dates</span>
                <span className="bg-brand-muted px-2 py-0.5 rounded-full">{data.keyDates?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CENTER PANE (Data Tabs) */}
        <div className="flex-1 flex flex-col bg-brand-white min-w-0">
          
          {/* Disclaimer Banner */}
          <div className="bg-brand-teal-lt/50 border-b border-brand-teal/20 p-3 flex gap-3 text-sm">
            <span className="text-brand-teal">💡</span>
            <p className="text-brand-dark font-medium leading-snug">
              BidBrief AI accelerates review but doesn't replace professional judgment. Verify items with confidence &lt; 70% against the source document.
            </p>
          </div>

          {/* Tabs header */}
          <div className="flex border-b border-brand-border bg-white px-2 pt-2 shrink-0 overflow-x-auto hide-scrollbar">
            {[
              { id: "summary", label: "Summary" },
              { id: "requirements", label: `Requirements (${data.requirements?.length || 0})` },
              { id: "dates", label: `Dates (${data.keyDates?.length || 0})` },
              { id: "redflags", label: `Red Flags (${data.redFlags?.length || 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-brand-teal text-brand-teal"
                    : "border-transparent text-brand-sage hover:text-brand-dark"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content area */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {activeTab === "summary" && (
              <div className="max-w-2xl bg-white p-8 rounded-2xl border border-brand-border shadow-sm">
                <h2 className="text-xl font-bold text-brand-dark mb-4">Executive Summary</h2>
                <div className="space-y-4 text-brand-dark leading-relaxed text-[0.95rem] whitespace-pre-wrap">
                  {data.executiveSummary || "No summary available."}
                </div>
              </div>
            )}

            {activeTab === "requirements" && (
              <div className="flex flex-col gap-3">
                {data.requirements?.map((req: any, i: number) => (
                  <div key={i} className="bg-white p-5 rounded-xl border border-brand-border shadow-sm flex gap-4 hover:border-brand-teal/50 transition-colors">
                    <div className="shrink-0 pt-0.5">
                      {req.mandatory ? (
                        <span className="bg-brand-teal text-white text-[0.65rem] font-black uppercase tracking-widest px-2 py-1 rounded-sm">Must</span>
                      ) : (
                        <span className="bg-brand-muted text-brand-sage text-[0.65rem] font-black uppercase tracking-widest px-2 py-1 rounded-sm">Opt</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.95rem] text-brand-dark font-medium leading-snug mb-2">{req.text}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-brand-sage bg-brand-muted px-2 py-0.5 rounded-full">{req.category}</span>
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span className={req.confidence >= 80 ? "text-brand-teal" : req.confidence >= 50 ? "text-yellow-600" : "text-red-500"}>
                            {req.confidence}% conf
                          </span>
                        </div>
                      </div>
                    </div>
                    {req.page && (
                      <button
                        onClick={() => setPageNumber(req.page)}
                        className="shrink-0 h-fit px-3 py-1.5 rounded-brand border border-brand-border text-xs font-bold text-brand-teal hover:bg-brand-teal-lt transition-colors"
                      >
                        Pg {req.page} →
                      </button>
                    )}
                  </div>
                ))}
                {(!data.requirements || data.requirements.length === 0) && (
                  <p className="text-brand-sage">No specific requirements extracted.</p>
                )}
              </div>
            )}

            {activeTab === "dates" && (
              <div className="flex flex-col gap-3">
                {data.keyDates?.map((date: any, i: number) => (
                  <div key={i} className="bg-white p-5 rounded-xl border border-brand-border shadow-sm flex justify-between items-center gap-4 hover:border-brand-teal/50 transition-colors">
                    <div>
                      <h3 className="font-bold text-brand-dark mb-1">{date.label}</h3>
                      <p className="text-brand-teal text-lg font-black tracking-tight">{date.date}</p>
                    </div>
                    {date.page && (
                      <button onClick={() => setPageNumber(date.page)} className="px-3 py-1.5 rounded-brand border border-brand-border text-xs font-bold text-brand-teal hover:bg-brand-teal-lt transition-colors">
                        Pg {date.page} →
                      </button>
                    )}
                  </div>
                ))}
                {(!data.keyDates || data.keyDates.length === 0) && <p className="text-brand-sage">No key dates found.</p>}
              </div>
            )}

            {activeTab === "redflags" && (
              <div className="flex flex-col gap-3">
                {data.redFlags?.map((flag: any, i: number) => (
                  <div key={i} className="bg-red-50 p-5 rounded-xl border border-red-200 flex gap-4">
                    <div className="text-red-500 text-xl">⚠</div>
                    <div className="flex-1">
                      <p className="text-red-900 font-bold mb-1">{flag.text}</p>
                      <p className="text-red-700 text-sm">{flag.reason}</p>
                    </div>
                    {flag.page && (
                      <button onClick={() => setPageNumber(flag.page)} className="shrink-0 h-fit px-3 py-1.5 rounded-brand border border-red-200 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors">
                        Pg {flag.page} →
                      </button>
                    )}
                  </div>
                ))}
                {(!data.redFlags || data.redFlags.length === 0) && (
                  <div className="text-center p-10 bg-brand-teal-lt/20 rounded-2xl border border-brand-teal/20">
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="font-bold text-brand-dark">No red flags detected!</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* 3. RIGHT PANE (PDF Viewer) */}
        <div className="w-[450px] bg-[#EFEFEF] border-l border-brand-border flex flex-col shrink-0">
          <div className="h-10 bg-[#D4D4D4] border-b border-[#C0C0C0] flex items-center justify-between px-3 shrink-0 shadow-sm z-10">
            <span className="text-xs font-bold text-[#555] uppercase tracking-widest">Source Document</span>
            <div className="flex items-center gap-2 bg-white rounded px-2 py-0.5 border border-[#C0C0C0]">
              <button 
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                disabled={pageNumber <= 1}
                className="text-[#666] hover:text-black disabled:opacity-30 text-lg leading-none pb-1"
              >
                ‹
              </button>
              <span className="text-xs font-bold text-[#333] min-w-[3rem] text-center">
                {pageNumber} / {numPages || "?"}
              </span>
              <button 
                onClick={() => setPageNumber(p => Math.min(numPages || p, p + 1))}
                disabled={pageNumber >= (numPages || 1)}
                className="text-[#666] hover:text-black disabled:opacity-30 text-lg leading-none pb-1"
              >
                ›
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto flex justify-center p-4">
            <div className="bg-white shadow-lg relative">
              <Document
                file={`/uploads/${data._id}.pdf`}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                onLoadError={() => setPdfError("Could not load PDF.")}
                loading={
                  <div className="p-20 text-brand-sage text-sm font-bold flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-brand-border border-t-brand-teal animate-spin" />
                    Loading PDF...
                  </div>
                }
              >
                {!pdfError && (
                  <Page 
                    pageNumber={pageNumber} 
                    width={410} 
                    renderAnnotationLayer={false}
                    renderTextLayer={true}
                    loading={<div className="w-[410px] h-[550px] bg-brand-muted animate-pulse" />}
                  />
                )}
              </Document>
              {pdfError && (
                <div className="p-10 text-red-500 font-bold text-center text-sm w-[410px]">
                  {pdfError}
                  <br />
                  <span className="text-brand-sage font-normal text-xs mt-2 block">
                    (In this local dev environment, ensure public/uploads folder exists).
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

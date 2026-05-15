"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Dynamically import react-pdf components with SSR disabled
const PDFViewer = dynamic(() => import("./PDFViewer"), { 
  ssr: false,
  loading: () => <div className="p-20 text-brand-sage text-sm font-bold animate-pulse text-center w-full">Loading PDF Viewer...</div>
});

type Tab = "summary" | "requirements" | "dates" | "redflags" | "deliverables";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // PDF Viewer state
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfError, setPdfError] = useState("");

  const SEVERITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3, Informational: 4 };

  const handleExportExcel = () => {
    if (!data) return;

    // 1. Requirements Sheet (sorted by severity)
    const sortedReqs = [...(data.requirements || [])].sort(
      (a: any, b: any) => (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5)
    );
    const reqs = sortedReqs.map((r: any) => ({
      Severity: r.severity || "Medium",
      Category: r.category || "Other",
      "Is Mandatory": r.mandatory ? "Yes" : "No",
      Requirement: r.text,
      "Page Source": r.page || "",
      "My Notes": "",
    }));
    const wsReqs = XLSX.utils.json_to_sheet(reqs);
    wsReqs["!cols"] = [{ wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 90 }, { wch: 12 }, { wch: 30 }];

    // 2. Key Dates Sheet
    const dates = data.keyDates?.map((d: any) => ({
      Event: d.label,
      Date: d.date,
      "Page Source": d.page || "",
    })) || [];
    const wsDates = XLSX.utils.json_to_sheet(dates);
    wsDates["!cols"] = [{ wch: 40 }, { wch: 25 }, { wch: 12 }];

    // 3. Red Flags Sheet
    const flags = data.redFlags?.map((f: any) => ({
      "Risk Type": f.risk_type || "Other",
      "Red Flag": f.text,
      "Business Impact": f.reason,
      "Page Source": f.page || "",
    })) || [];
    const wsFlags = XLSX.utils.json_to_sheet(flags);
    wsFlags["!cols"] = [{ wch: 14 }, { wch: 60 }, { wch: 80 }, { wch: 12 }];

    // 4. Evaluation Criteria Sheet
    const criteria = data.deliverables?.map((d: any) => {
      const parts = (d.text || "").split(":");
      return { "Evaluation Factor": parts[0]?.trim() || d.text, "Weight/Points": parts[1]?.trim() || "", "Page Source": d.page || "" };
    }) || [];
    const wsCriteria = XLSX.utils.json_to_sheet(criteria.length ? criteria : [{ "Evaluation Factor": "Not found in document", "Weight/Points": "", "Page Source": "" }]);
    wsCriteria["!cols"] = [{ wch: 40 }, { wch: 20 }, { wch: 12 }];

    // 5. Summary Sheet
    const summary = [
      { Field: "RFP Title", Value: data.rfpTitle || "" },
      { Field: "Issuing Agency", Value: data.issuingAgency || "" },
      { Field: "Go/No-Go Score", Value: data.goNoGoScore || "" },
      { Field: "AI Reasoning", Value: data.goNoGoReasoning || "" },
      { Field: "Executive Summary", Value: data.executiveSummary || "" },
      { Field: "Total Requirements", Value: data.requirements?.length || 0 },
      { Field: "Red Flags", Value: data.redFlags?.length || 0 },
      { Field: "Key Dates", Value: data.keyDates?.length || 0 },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    wsSummary["!cols"] = [{ wch: 24 }, { wch: 100 }];

    // Build Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
    XLSX.utils.book_append_sheet(wb, wsReqs, "Requirements Matrix");
    XLSX.utils.book_append_sheet(wb, wsDates, "Key Dates");
    XLSX.utils.book_append_sheet(wb, wsFlags, "Red Flags");
    XLSX.utils.book_append_sheet(wb, wsCriteria, "Evaluation Criteria");

    XLSX.writeFile(wb, `BidBrief_Analysis_${data.fileName || "RFP"}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // 1. Header
    doc.setFontSize(22);
    doc.setTextColor(4, 124, 88); // brand-teal
    doc.setFont("helvetica", "bold");
    doc.text("BidBrief Audit Report", 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, yPos);
    
    yPos += 15;
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text("RFP Information", 20, yPos);
    
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Title: ${data.rfpTitle || data.fileName}`, 20, yPos);
    yPos += 6;
    doc.text(`Agency: ${data.issuingAgency || "Unknown"}`, 20, yPos);

    // 2. Score Card
    yPos += 15;
    doc.setFillColor(245, 245, 245);
    doc.rect(20, yPos, pageWidth - 40, 30, "F");
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Bid/No-Bid Score:", 30, yPos + 12);
    
    const score = data.goNoGoScore || 0;
    const scoreColor = score >= 70 ? [4, 124, 88] : score >= 40 ? [217, 119, 6] : [220, 38, 38];
    doc.setFontSize(24);
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${score}/100`, 30, yPos + 22);
    
    const scoreLabel = score >= 81 ? "Excellent Match" : score >= 61 ? "Good Opportunity" : score >= 40 ? "Proceed with Caution" : "Strong No-Bid";
    doc.setFontSize(12);
    doc.text(scoreLabel, 80, yPos + 22);

    // 3. Executive Summary
    yPos += 45;
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text("Strategic Executive Summary", 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const summaryLines = doc.splitTextToSize(data.executiveSummary || "No summary available.", pageWidth - 40);
    doc.text(summaryLines, 20, yPos);
    
    yPos += (summaryLines.length * 5) + 10;

    // 4. Key Dates Table
    if (data.keyDates?.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("Key Dates & Deadlines", 20, yPos);
      
      autoTable(doc, {
        startY: yPos + 5,
        head: [["Event", "Date", "Page"]],
        body: data.keyDates.map((d: any) => [d.label, d.date, d.page || "-"]),
        headStyles: { fillColor: [4, 124, 88] },
        margin: { left: 20, right: 20 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // New Page for Red Flags if needed
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    // 5. Red Flags Table
    if (data.redFlags?.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("Critical Red Flags & Risks", 20, yPos);
      
      autoTable(doc, {
        startY: yPos + 5,
        head: [["Risk Type", "Red Flag", "Business Impact"]],
        body: data.redFlags.map((f: any) => [f.risk_type || "Risk", f.text, f.reason]),
        headStyles: { fillColor: [220, 38, 38] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 60 },
          2: { cellWidth: 80 }
        },
        margin: { left: 20, right: 20 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // 6. Requirements Matrix Table (Full)
    if (data.requirements?.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("Complete Requirements Matrix", 20, yPos);

      const SEVERITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3, Informational: 4 };
      const sortedReqs = [...(data.requirements || [])].sort(
        (a: any, b: any) => (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5)
      );

      autoTable(doc, {
        startY: yPos + 5,
        head: [["Sev", "Category", "Requirement", "Pg"]],
        body: sortedReqs.map((r: any) => [
          r.severity?.substring(0, 4) || "Med", 
          r.category || "Other", 
          r.text, 
          r.page || "-"
        ]),
        headStyles: { fillColor: [70, 70, 70] },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 30 },
          2: { cellWidth: 115 },
          3: { cellWidth: 10 }
        },
        styles: { fontSize: 8 },
        margin: { left: 20, right: 20 },
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 0) {
            const sev = data.cell.raw;
            if (sev === 'Crit') data.cell.styles.textColor = [220, 38, 38];
            if (sev === 'High') data.cell.styles.textColor = [217, 119, 6];
          }
        }
      });
    }

    doc.save(`BidBrief_Audit_Report_${data.fileName || "RFP"}.pdf`);
    setShowExportMenu(false);
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
        <div className="flex relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-5 py-2 rounded-brand bg-brand-teal text-white text-sm font-bold shadow-sm hover:bg-[#035e44] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(4,124,88,0.3)] transition-all flex items-center gap-2"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Report
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} className={`transition-transform ${showExportMenu ? "rotate-180" : ""}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showExportMenu && (
            <>
              <div 
                className="fixed inset-0 z-20" 
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-brand-border py-2 z-30 animate-in fade-in slide-in-from-top-2">
                <button 
                  onClick={handleExportExcel}
                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-brand-dark hover:bg-brand-muted flex items-center gap-3 transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center text-xs">XLSX</span>
                  <div>
                    <p>Excel Spreadsheet</p>
                    <p className="text-[10px] text-brand-sage font-medium">Full Requirements Matrix</p>
                  </div>
                </button>
                <div className="h-px bg-brand-border mx-2 my-1" />
                <button 
                  onClick={handleExportPDF}
                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-brand-dark hover:bg-brand-muted flex items-center gap-3 transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-xs">PDF</span>
                  <div>
                    <p>PDF Executive Report</p>
                    <p className="text-[10px] text-brand-sage font-medium">Summary & Key Risks</p>
                  </div>
                </button>
              </div>
            </>
          )}
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
            
          {/* Score label */}
            <p className="text-sm font-black mt-1 mb-2"
              style={{ color: data.goNoGoScore >= 70 ? "#047C58" : data.goNoGoScore >= 40 ? "#D97706" : "#DC2626" }}
            >
              {data.goNoGoScore >= 81
                ? "✅ Excellent Match"
                : data.goNoGoScore >= 61
                ? "🟡 Good Opportunity"
                : data.goNoGoScore >= 40
                ? "⚠️ Proceed with Caution"
                : "🔴 Strong No-Bid"}
            </p>
            
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
          <div className="bg-amber-50 border-b border-amber-200 p-3 flex gap-3 text-sm">
            <span className="text-amber-500 shrink-0">⚠️</span>
            <p className="text-amber-900 font-medium leading-snug">
              AI-generated analysis. Always verify critical deadlines, submission requirements, and compliance items against the source document before submitting a proposal.
            </p>
          </div>

          {/* Tabs header */}
          <div className="flex border-b border-brand-border bg-white px-2 pt-2 shrink-0 overflow-x-auto hide-scrollbar">
            {[
              { id: "summary", label: "Summary" },
              { id: "requirements", label: `Requirements (${data.requirements?.length || 0})` },
              { id: "dates", label: `Dates (${data.keyDates?.length || 0})` },
              { id: "redflags", label: `Red Flags (${data.redFlags?.length || 0})` },
              ...(data.deliverables?.length ? [{ id: "deliverables", label: `Eval Criteria (${data.deliverables.length})` }] : []),
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
              <div className="flex flex-col gap-4 max-w-2xl">
                {/* Contract metadata card */}
                {data.issuingAgency && data.issuingAgency !== "Unknown" && (
                  <div className="bg-white p-5 rounded-xl border border-brand-border shadow-sm flex flex-wrap gap-3">
                    {data.issuingAgency && (
                      <span className="text-xs font-bold bg-brand-muted text-brand-dark px-3 py-1.5 rounded-full">🏛 {data.issuingAgency}</span>
                    )}
                  </div>
                )}
                <div className="bg-white p-8 rounded-2xl border border-brand-border shadow-sm">
                  <h2 className="text-xl font-bold text-brand-dark mb-4">Executive Summary</h2>
                  <div className="space-y-4 text-brand-dark leading-relaxed text-[0.95rem] whitespace-pre-wrap">
                    {data.executiveSummary || "No summary available."}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "requirements" && (
              <div className="flex flex-col gap-3">
                {[...( data.requirements || [])]
                  .sort((a: any, b: any) => (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5))
                  .map((req: any, i: number) => {
                    const severityStyle: Record<string, string> = {
                      Critical: "bg-red-600 text-white",
                      High: "bg-orange-500 text-white",
                      Medium: "bg-yellow-400 text-brand-dark",
                      Low: "bg-brand-muted text-brand-sage",
                      Informational: "bg-gray-100 text-gray-500",
                    };
                    const borderStyle: Record<string, string> = {
                      Critical: "border-red-200 hover:border-red-400",
                      High: "border-orange-100 hover:border-orange-300",
                      Medium: "border-brand-border hover:border-brand-teal/50",
                      Low: "border-brand-border hover:border-brand-teal/30",
                      Informational: "border-brand-border",
                    };
                    return (
                      <div key={i} className={`bg-white p-5 rounded-xl border shadow-sm flex gap-4 transition-colors ${borderStyle[req.severity] || "border-brand-border"}`}>
                        <div className="shrink-0 flex flex-col gap-1.5 pt-0.5">
                          <span className={`text-[0.6rem] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${severityStyle[req.severity] || "bg-brand-muted text-brand-sage"}`}>
                            {req.severity || "Med"}
                          </span>
                          {!req.mandatory && (
                            <span className="bg-brand-muted text-brand-sage text-[0.6rem] font-black uppercase tracking-widest px-2 py-1 rounded-sm">Opt</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.95rem] text-brand-dark font-medium leading-snug mb-2">{req.text}</p>
                          <span className="text-xs font-bold text-brand-sage bg-brand-muted px-2 py-0.5 rounded-full">{req.category || "Other"}</span>
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
                    );
                  })}
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
                {data.redFlags?.map((flag: any, i: number) => {
                  const riskColors: Record<string, string> = {
                    Financial: "bg-amber-50 border-amber-200",
                    Legal: "bg-red-50 border-red-200",
                    Operational: "bg-orange-50 border-orange-200",
                    Timeline: "bg-purple-50 border-purple-200",
                    Other: "bg-red-50 border-red-200",
                  };
                  const riskBadge: Record<string, string> = {
                    Financial: "bg-amber-100 text-amber-800",
                    Legal: "bg-red-100 text-red-800",
                    Operational: "bg-orange-100 text-orange-800",
                    Timeline: "bg-purple-100 text-purple-800",
                    Other: "bg-red-100 text-red-800",
                  };
                  const riskIcon: Record<string, string> = { Financial: "💰", Legal: "⚖️", Operational: "🔧", Timeline: "📅", Other: "⚠️" };
                  const rt = flag.risk_type || "Other";
                  return (
                    <div key={i} className={`p-5 rounded-xl border flex gap-4 ${riskColors[rt] || riskColors.Other}`}>
                      <div className="text-xl shrink-0">{riskIcon[rt]}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[0.65rem] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${riskBadge[rt] || riskBadge.Other}`}>{rt} Risk</span>
                        </div>
                        <p className="text-[0.95rem] font-bold text-gray-900 mb-1">{flag.text}</p>
                        <p className="text-sm text-gray-700 leading-snug">{flag.reason}</p>
                      </div>
                      {flag.page && (
                        <button onClick={() => setPageNumber(flag.page)} className="shrink-0 h-fit px-3 py-1.5 rounded-brand border border-current/20 text-xs font-bold text-gray-600 hover:bg-white/60 transition-colors">
                          Pg {flag.page} →
                        </button>
                      )}
                    </div>
                  );
                })}
                {(!data.redFlags || data.redFlags.length === 0) && (
                  <div className="text-center p-10 bg-brand-teal-lt/20 rounded-2xl border border-brand-teal/20">
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="font-bold text-brand-dark">No red flags detected!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "deliverables" && (
              <div className="flex flex-col gap-3">
                <div className="bg-brand-teal-lt/30 border border-brand-teal/20 rounded-xl p-4 text-sm text-brand-dark font-medium">
                  💡 These are the evaluation factors and scoring weights the agency uses to rank proposals. Focus your proposal on high-weight factors.
                </div>
                {data.deliverables?.map((d: any, i: number) => {
                  const parts = (d.text || "").split(":");
                  const factor = parts[0]?.trim() || d.text;
                  const weight = parts.slice(1).join(":").trim();
                  return (
                    <div key={i} className="bg-white p-5 rounded-xl border border-brand-border shadow-sm flex justify-between items-center gap-4 hover:border-brand-teal/50 transition-colors">
                      <div>
                        <h3 className="font-bold text-brand-dark">{factor}</h3>
                        {weight && <p className="text-brand-sage text-sm mt-0.5">{weight}</p>}
                      </div>
                      {d.page && (
                        <button onClick={() => setPageNumber(d.page)} className="shrink-0 px-3 py-1.5 rounded-brand border border-brand-border text-xs font-bold text-brand-teal hover:bg-brand-teal-lt transition-colors">
                          Pg {d.page} →
                        </button>
                      )}
                    </div>
                  );
                })}
                {(!data.deliverables || data.deliverables.length === 0) && (
                  <p className="text-brand-sage">No evaluation criteria found in this document.</p>
                )}
              </div>
            )}

          </div>
        </div>

        {/* 3. RIGHT PANE (PDF Viewer) */}
        <div className="w-[450px] bg-[#EFEFEF] border-l border-brand-border flex flex-col shrink-0">
          <div className="h-10 bg-[#D4D4D4] border-b border-[#C0C0C0] flex items-center justify-between px-3 shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#555] uppercase tracking-widest">Source Document</span>
              <span className="text-[10px] font-bold text-[#888] bg-white/50 px-1.5 py-0.5 rounded border border-black/5 flex items-center gap-1">
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Ctrl + F
              </span>
              <a 
                href={`/uploads/${data._id}.pdf`} 
                target="_blank" 
                rel="noreferrer"
                title="Open full PDF in new tab for searching"
                className="text-[#777] hover:text-brand-teal transition-colors"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
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
              <PDFViewer
                file={`/uploads/${data._id}.pdf`}
                pageNumber={pageNumber}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                onLoadError={() => setPdfError("Could not load PDF.")}
                width={410}
              />
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

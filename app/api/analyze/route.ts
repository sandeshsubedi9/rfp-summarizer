import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Analysis from "@/models/Analysis";
import User from "@/models/User";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

// ─── AI Provider abstraction ───────────────────────────────────────────────────
async function callAI(
  systemPrompt: string,
  userPrompt: string,
  geminiKey: string,
  groqKey: string | undefined
): Promise<string> {
  // ── PRIMARY: Gemini 2.5 Flash ──────────────────────────────────────────────
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    }

    const errText = await res.text().catch(() => "");
    console.warn(`[ai] Gemini failed (${res.status}): ${errText.slice(0, 200)}. Falling back to Groq...`);
  } catch (err: any) {
    console.warn(`[ai] Gemini network error: ${err.message}. Falling back to Groq...`);
  }

  // ── FALLBACK: Groq llama-3.1-8b-instant ────────────────────────────────────
  if (!groqKey) throw new Error("No fallback AI key available.");

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  let retries = 0;
  while (retries < 4) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.choices[0].message.content;
    }
    if (res.status === 429) {
      const wait = (retries + 1) * 3000;
      console.warn(`[ai] Groq rate limited. Waiting ${wait}ms...`);
      await sleep(wait);
      retries++;
    } else {
      const errText = await res.text().catch(() => "");
      throw new Error(`Groq error ${res.status}: ${errText.slice(0, 200)}`);
    }
  }
  throw new Error("All AI providers failed or rate limited.");
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const groqKey = process.env.GROQ_API_KEY?.trim();

  if (!geminiKey && !groqKey) {
    return NextResponse.json({ error: "No AI API key configured." }, { status: 500 });
  }

  try {
    await connectToDatabase();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Usage check (skip in dev when DEV_BYPASS_LIMIT=true)
    const FREE_LIMIT = 3;
    const bypassLimit = process.env.DEV_BYPASS_LIMIT === "true";
    console.log(`[analyze] User: ${dbUser.email}, Count: ${dbUser.uploadsThisMonth}, Bypass: ${bypassLimit}`);
    
    if (!bypassLimit && dbUser.plan === "free" && (dbUser.uploadsThisMonth ?? 0) >= FREE_LIMIT) {
      console.log("[analyze] Limit reached, blocking upload.");
      return NextResponse.json({ error: "limit_reached" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const analysis = await Analysis.create({
      userId: dbUser._id.toString(),
      fileName: file.name,
      fileSize: file.size,
      status: "processing",
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;
    const pageCount = pdfData.numpages || 0;

    if (pageCount > 200) {
      await Analysis.findByIdAndUpdate(analysis._id, {
        status: "error",
        errorMessage: "File too large (max 200 pages)",
      });
      return NextResponse.json({ error: "too_large" }, { status: 400 });
    }

    // ─── METADATA EXTRACTION (first 15,000 chars = ~first 20 pages) ──────────
    console.log("[analyze] Extracting contract metadata...");
    const metadataPrompt = `You are analyzing the OPENING SECTION of a government RFP. Extract ALL of the following.

Return JSON ONLY:
{
  "rfp_title": "Full RFP/solicitation title",
  "issuing_agency": "Name of the issuing government agency or organization",
  "contract_type": "IDIQ|JOC|BPA|Single-Award|Multi-Award|RFP|RFQ|IFB|Other",
  "estimated_value": "Dollar amount or range if mentioned, else null",
  "performance_period": "Contract duration if mentioned, else null",
  "set_aside": "Small Business|8(a)|HUBZone|SDVOSB|WOSB|None|Unknown",
  "naics_code": "NAICS code if mentioned, else null",
  "evaluation_method": "LPTA|Best Value|Trade-off|QBS|Unknown",
  "rfp_schedule": [
    {
      "label": "Event name (e.g. Proposals Due, RFP Issue Date, Questions Deadline, Award Date, Contract Start Date)",
      "date": "Exact date and time as written in the document",
      "page": 1
    }
  ]
}

CRITICAL: The rfp_schedule array MUST include every date from the RFP Schedule or Important Dates table on the cover page — especially: proposal/bid due date, RFP issue date, deadline to submit questions, anticipated award date, and contract start/end date. These appear near the top of the document in a table. Do NOT skip them.

TEXT: ${extractedText.slice(0, 15000)}`;

    let contractMetadata: Record<string, string | null> = {};
    let coverPageDates: any[] = [];
    try {
      const metaRaw = await callAI(
        "You are a government contracting expert. Extract contract metadata and the RFP schedule dates precisely. Output only valid JSON.",
        metadataPrompt,
        geminiKey!,
        groqKey
      );
      const cleanMeta = metaRaw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsedMeta = JSON.parse(cleanMeta);
      // Split rfp_schedule out; the rest is contract metadata
      const { rfp_schedule, ...meta } = parsedMeta;
      contractMetadata = meta;
      if (Array.isArray(rfp_schedule) && rfp_schedule.length > 0) {
        coverPageDates = rfp_schedule;
        console.log(`[analyze] Cover page schedule: ${rfp_schedule.length} dates extracted.`);
      }
      console.log("[analyze] Metadata extracted:", contractMetadata.rfp_title);
    } catch (e) {
      console.warn("[analyze] Metadata extraction failed, continuing...", e);
    }

    // ─── CHUNKED PIPELINE ─────────────────────────────────────────────────────
    const chunks: string[] = [];
    const overlapSize = 2000;
    const chunkSize = 150000; // Gemini can handle massive context; 150k chars is ~40-50 pages per call
    for (let i = 0; i < extractedText.length; i += (chunkSize - overlapSize)) {
      chunks.push(extractedText.slice(i, i + chunkSize));
    }

    console.log(`[analyze] Starting pipeline for ${chunks.length} chunks (Gemini primary).`);

    const allReqs: any[] = [];
    const allDates: any[] = [];
    const allFlags: any[] = [];
    const allEvalCriteria: any[] = [];
    let rollingSummary = "";

    const SYSTEM_PROMPT = "You are a ruthless senior procurement auditor with 20 years of government contracting experience. You miss nothing. You output only valid JSON.";

    for (let i = 0; i < chunks.length; i++) {
      const estimatedStartPage = Math.floor((i * (chunkSize - overlapSize) / extractedText.length) * pageCount) + 1;
      const estimatedEndPage = Math.min(
        Math.floor(((i * (chunkSize - overlapSize) + chunkSize) / extractedText.length) * pageCount) + 1,
        pageCount
      );

      console.log(`[analyze] Chunk ${i + 1}/${chunks.length} (Pages ~${estimatedStartPage}-${estimatedEndPage})...`);

      const chunkPrompt = `You are analyzing Part ${i + 1}/${chunks.length} of an RFP document (approximately pages ${estimatedStartPage}–${estimatedEndPage}).

CRITICAL EXTRACTION RULES:
1. REQUIREMENTS: Extract EVERY mandate, obligation, or specification. Flag keywords: "shall", "must", "will", "required", "is responsible for", "contractor shall". Include the full sentence.
   - severity: "Critical" = disqualifying if missed | "High" = major compliance | "Medium" = operational | "Low" = standard | "Informational" = context only
   - category: Must be one of: Technical, Management, Past Performance, Pricing, Legal, Compliance, Operational, Financial
2. DATES: Every contractual deadline, milestone, period of performance, or submission date found in THIS section. Do NOT re-extract dates from the cover page RFP schedule (those are captured separately).
3. RED FLAGS — A red flag is ONLY a clause that creates GENUINE business or legal risk:
   ✅ Valid red flags: no guaranteed work (IDIQ/task-order), unilateral termination-for-convenience, contractor indemnification of government, pricing locked with no escalation, BAFO uncertainty, pass/fail gates that auto-disqualify, sovereign immunity language, unlimited liability exposure, ambiguous scope.
   ❌ NOT red flags: normal requirements, standard submission instructions, routine compliance clauses.
4. EVALUATION CRITERIA — CRITICAL INSTRUCTION:
   ✅ EXTRACT ONLY: The official proposal scoring/evaluation table showing how proposals will be SCORED by the review committee. This table has columns like "Criteria" and "Points" or "Weight" with NUMERIC values (e.g. "Technical Capability: 10 points", "Cover Letter: 5 points", "Total: 50 points").
   ❌ DO NOT EXTRACT: EEO workforce participation percentage goals (e.g. "6.9% female participation") — those are labor compliance targets, NOT evaluation criteria.
   ❌ DO NOT EXTRACT: Davis-Bacon wage rates, insurance minimums, or any other numeric compliance thresholds.
   If no official proposal scoring table exists in this section, return an empty array [].

Return JSON ONLY:
{
  "summary": "2-sentence professional summary of this section's business significance",
  "requirements": [{ "text": "Full requirement text", "category": "Technical", "mandatory": true, "severity": "High", "page": ${estimatedStartPage} }],
  "dates": [{ "label": "Event name", "date": "YYYY-MM-DD or description", "page": ${estimatedStartPage} }],
  "red_flags": [{ "text": "Exact clause", "reason": "Specific business/legal risk this creates for the bidder", "risk_type": "Financial|Legal|Operational|Timeline", "page": ${estimatedStartPage} }],
  "eval_criteria": [{ "factor": "Criteria name (e.g. Technical Capability and Experience)", "weight": "Numeric score or Pass/Fail (e.g. 10 points, Pass/Fail)", "page": ${estimatedStartPage} }]
}

TEXT: ${chunks[i]}`;

      try {
        const rawText = await callAI(SYSTEM_PROMPT, chunkPrompt, geminiKey!, groqKey);
        const cleanJSON = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
        const parsed = JSON.parse(cleanJSON);
        if (parsed.requirements?.length) allReqs.push(...parsed.requirements);
        if (parsed.dates?.length) allDates.push(...parsed.dates);
        if (parsed.red_flags?.length) allFlags.push(...parsed.red_flags);
        if (parsed.eval_criteria?.length) allEvalCriteria.push(...parsed.eval_criteria);
        if (parsed.summary) rollingSummary += parsed.summary + " ";
      } catch (e) {
        console.error(`[analyze] Chunk ${i + 1} failed:`, e);
      }
    }

    // ─── FINAL SYNTHESIS ──────────────────────────────────────────────────────
    console.log("[analyze] Final Synthesis...");

    const topReqs = allReqs
      .filter(r => r.severity === "Critical" || r.severity === "High")
      .slice(0, 20)
      .map(r => r.text);

    const synthPrompt = `You are a senior procurement consultant. Write a high-quality executive analysis for this RFP.

CONTRACT METADATA:
${JSON.stringify(contractMetadata, null, 2)}

SECTION SUMMARIES:
${rollingSummary.slice(0, 4000)}

TOP CRITICAL/HIGH REQUIREMENTS (${topReqs.length}):
${topReqs.map((r, i) => `${i + 1}. ${r}`).join("\n")}

ALL RED FLAGS (${allFlags.length}):
${allFlags.slice(0, 15).map((f, i) => `${i + 1}. [${f.risk_type || "Risk"}] ${f.text} → ${f.reason}`).join("\n")}

KEY DATES: ${allDates.length} identified
TOTAL REQUIREMENTS: ${allReqs.length}
EVALUATION CRITERIA: ${allEvalCriteria.length > 0 ? allEvalCriteria.map(e => `${e.factor}: ${e.weight}`).join(", ") : "Not found"}

Write an executive analysis covering:
1. What this contract actually is (structure, scope, business model)
2. Contract value and duration context
3. Key compliance risks and strategic considerations
4. Bid/No-bid recommendation with specific reasoning

Return JSON ONLY:
{
  "summary": "3 substantial paragraphs. First: what the contract is and its structure. Second: key requirements and compliance burden. Third: risk assessment and recommendation.",
  "score": <integer 1-100>,
  "reasoning": "2-3 sentences explaining the score with specific reference to contract terms, not generic AI language"
}`;

    const finalRaw = await callAI(
      "You are a senior government contracting consultant. Produce business-grade executive analysis. Output only valid JSON.",
      synthPrompt,
      geminiKey!,
      groqKey
    );

    const finalContent = finalRaw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    let finalJSON: { summary: string; score: number; reasoning: string };
    try {
      finalJSON = JSON.parse(finalContent);
    } catch (e) {
      await Analysis.findByIdAndUpdate(analysis._id, {
        status: "error",
        errorMessage: "Could not parse final synthesis. Please try again.",
      });
      console.error("[analyze] Final synthesis JSON parse error", e);
      return NextResponse.json({ error: "analysis_failed" }, { status: 502 });
    }

    // ─── SAVE & FINISH ────────────────────────────────────────────────────────
    // Merge cover page dates (highest priority) with pipeline-found dates, deduplicate by label
    const mergedDates = [...coverPageDates];
    const coverLabels = new Set(coverPageDates.map((d: any) => d.label?.toLowerCase().trim()));
    for (const d of allDates) {
      if (!coverLabels.has(d.label?.toLowerCase().trim())) {
        mergedDates.push(d);
      }
    }

    await Analysis.findByIdAndUpdate(analysis._id, {
      status: "done",
      rfpTitle: contractMetadata.rfp_title || file.name,
      issuingAgency: contractMetadata.issuing_agency || "Unknown",
      executiveSummary: finalJSON.summary,
      goNoGoScore: finalJSON.score,
      goNoGoReasoning: finalJSON.reasoning,
      requirements: allReqs.slice(0, 300),
      keyDates: mergedDates,
      redFlags: allFlags,
      deliverables: allEvalCriteria.map(e => ({ text: `${e.factor}: ${e.weight}`, page: e.page })),
    });

    // Save PDF
    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadPath = path.join(process.cwd(), "public", "uploads", `${analysis._id}.pdf`);
    await fs.mkdir(path.dirname(uploadPath), { recursive: true });
    await fs.writeFile(uploadPath, buffer);

    dbUser.uploadsThisMonth = (dbUser.uploadsThisMonth ?? 0) + 1;
    await dbUser.save();

    console.log(`[analyze] Done. Reqs: ${allReqs.length}, Dates: ${mergedDates.length} (${coverPageDates.length} from cover page + ${allDates.length} from pipeline), Flags: ${allFlags.length}, Criteria: ${allEvalCriteria.length}`);
    return NextResponse.json({ success: true, analysisId: analysis._id.toString() });

  } catch (err: any) {
    console.error("[analyze] Unhandled error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

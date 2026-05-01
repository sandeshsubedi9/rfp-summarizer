import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Analysis from "@/models/Analysis";
import User from "@/models/User";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdfParse from "pdf-parse";

// ─── Gemini prompt ────────────────────────────────────────────────────────────
function buildPrompt(text: string, context: string): string {
  return `You are a senior RFP (Request for Proposal) analyst with 20 years of experience in government and enterprise procurement.

Analyze the following RFP document text and return ONLY a valid JSON object.
Do NOT add any explanation, markdown fences, or extra text outside the JSON.

Rules:
- Do NOT guess or fabricate. If information is not explicitly stated, use null.
- For every extracted item you MUST include the page number where you found it.
- "confidence" is an integer 0-100:
    100 = exact verbatim text found
    70-99 = clearly implied with strong signals (e.g. "SHALL", "MUST", "REQUIRED")
    40-69 = inferred from context
    0-39 = uncertain / low-signal
${context ? `- Additional focus area from the user: ${context}` : ""}

Return this exact JSON structure (no deviations):
{
  "rfp_title": "string or null",
  "issuing_agency": "string or null",
  "executive_summary": "2-3 paragraphs plain-English description of what the buyer wants and why",
  "go_no_go_score": <integer 1-100, based on: clarity of requirements (20pts), reasonableness of deadlines (20pts), absence of extreme penalties/risks (20pts), open competition signals (20pts), clear evaluation criteria (20pts)>,
  "go_no_go_reasoning": "1-2 sentences explaining what drove the score up or down",
  "key_dates": [
    { "label": "string", "date": "string (human readable)", "page": <int>, "confidence": <int> }
  ],
  "requirements": [
    {
      "text": "string (the exact or near-exact requirement text)",
      "category": "Technical" | "Compliance" | "Financial" | "Operational" | "Other",
      "mandatory": <true if contains SHALL/MUST/REQUIRED/MANDATORY, else false>,
      "page": <int>,
      "confidence": <int>
    }
  ],
  "red_flags": [
    { "text": "string", "reason": "why this is a red flag for a vendor", "page": <int> }
  ],
  "deliverables": [
    { "text": "string", "page": <int> }
  ]
}

RFP DOCUMENT TEXT:
---
${text.slice(0, 800000)}`;
}

// ─── Post-processing: boost confidence based on our own rules ─────────────────
function applyConfidenceRules(data: Record<string, unknown>) {
  const mandatoryPattern = /\b(SHALL|MUST|REQUIRED|MANDATORY)\b/i;
  const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},? \d{4})\b/i;

  if (Array.isArray(data.requirements)) {
    data.requirements = (data.requirements as Record<string, unknown>[]).map((r) => {
      const text = String(r.text ?? "");
      if (mandatoryPattern.test(text)) {
        r.mandatory = true;
        r.confidence = Math.max(Number(r.confidence ?? 0), 85);
      }
      return r;
    });
  }

  if (Array.isArray(data.key_dates)) {
    data.key_dates = (data.key_dates as Record<string, unknown>[]).map((d) => {
      const dateStr = String(d.date ?? "");
      if (datePattern.test(dateStr)) {
        d.confidence = Math.max(Number(d.confidence ?? 0), 90);
      }
      return d;
    });
  }

  return data;
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Gemini key check
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured. Add GEMINI_API_KEY to .env.local" },
      { status: 500 }
    );
  }

  try {
    await connectToDatabase();

    // 3. Usage limit check (free = 3/month)
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Reset counter if it's a new month
    const now = new Date();
    const lastReset = new Date(dbUser.lastUploadResetDate ?? 0);
    if (
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {
      dbUser.uploadsThisMonth = 0;
      dbUser.lastUploadResetDate = now;
    }

    const FREE_LIMIT = 3;
    if (dbUser.plan === "free" && dbUser.uploadsThisMonth >= FREE_LIMIT) {
      return NextResponse.json(
        { error: "limit_reached", uploadsThisMonth: dbUser.uploadsThisMonth },
        { status: 403 }
      );
    }

    // 4. Parse the uploaded file
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const context = (formData.get("context") as string) ?? "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF and Word documents are supported" },
        { status: 400 }
      );
    }

    // 5. Create a pending analysis record immediately (so we can return its ID)
    const analysis = await Analysis.create({
      userId: dbUser._id.toString(),
      fileName: file.name,
      fileSize: file.size,
      status: "processing",
    });

    // 6. Extract text from the PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = "";

    try {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } catch {
      await Analysis.findByIdAndUpdate(analysis._id, {
        status: "error",
        errorMessage: "Could not parse PDF. Please ensure it is a text-based PDF, not a scanned image.",
      });
      return NextResponse.json(
        { error: "PDF parsing failed", analysisId: analysis._id.toString() },
        { status: 422 }
      );
    }

    if (extractedText.trim().length < 100) {
      await Analysis.findByIdAndUpdate(analysis._id, {
        status: "error",
        errorMessage: "Document appears to be a scanned image PDF. Please use a text-based PDF.",
      });
      return NextResponse.json(
        { error: "No readable text found in PDF", analysisId: analysis._id.toString() },
        { status: 422 }
      );
    }

    // 7. Call Gemini
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    const prompt = buildPrompt(extractedText, context);
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // 8. Parse Gemini's JSON response
    let parsed: Record<string, unknown>;
    try {
      // Strip markdown fences if Gemini added them despite instructions
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      await Analysis.findByIdAndUpdate(analysis._id, {
        status: "error",
        errorMessage: "AI returned an invalid response. Please try again.",
      });
      return NextResponse.json(
        { error: "Failed to parse AI response", analysisId: analysis._id.toString() },
        { status: 500 }
      );
    }

    // 9. Apply confidence-boosting rules
    const enriched = applyConfidenceRules(parsed);

    // 10. Save the results
    await Analysis.findByIdAndUpdate(analysis._id, {
      status: "done",
      rfpTitle: enriched.rfp_title ?? null,
      issuingAgency: enriched.issuing_agency ?? null,
      executiveSummary: enriched.executive_summary ?? "",
      goNoGoScore: enriched.go_no_go_score ?? null,
      goNoGoReasoning: enriched.go_no_go_reasoning ?? "",
      keyDates: enriched.key_dates ?? [],
      requirements: enriched.requirements ?? [],
      redFlags: enriched.red_flags ?? [],
      deliverables: enriched.deliverables ?? [],
    });

    // Save the PDF locally for the viewer
    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadPath = path.join(process.cwd(), "public", "uploads", `${analysis._id}.pdf`);
    await fs.writeFile(uploadPath, buffer);

    // 11. Increment usage counter
    dbUser.uploadsThisMonth = (dbUser.uploadsThisMonth ?? 0) + 1;
    await dbUser.save();

    return NextResponse.json({
      success: true,
      analysisId: analysis._id.toString(),
    });
  } catch (err) {
    console.error("[/api/analyze] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

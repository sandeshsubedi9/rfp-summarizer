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
    const pdfBase64 = buffer.toString("base64");
    const pdfData = await pdfParse(buffer);
    const pageCount = pdfData.numpages || 0;

    if (pageCount > 200) {
      await Analysis.findByIdAndUpdate(analysis._id, {
        status: "error",
        errorMessage: "File too large (max 200 pages)",
      });
      return NextResponse.json({ error: "too_large" }, { status: 400 });
    }

    const SYSTEM_PROMPT = "You are a senior procurement auditor with 20 years of experience. You process high-stakes government RFPs with 100% precision. You output only valid JSON.";

    const SAFETY_SETTINGS = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ];

    // ─── PASS 1: INTELLIGENCE (Summary, Dates, Flags, Criteria) ──────────────
    console.log("[analyze] Pass 1: Extracting Strategic Intelligence...");
    
    const intelligencePrompt = `Analyze this entire RFP document. Extract the strategic "intelligence" components.

Return JSON ONLY:
{
  "rfp_title": "Full title",
  "issuing_agency": "Agency name",
  "executive_summary": "3 substantial paragraphs covering scope, compliance burden, and strategic fit",
  "score": <integer 1-100, where 1-30=No-Bid, 80-100=Strong Match>,
  "reasoning": "2-3 sentences justifying the score based on risks vs value",
  "key_dates": [
    { "label": "Event (e.g. Proposals Due, Questions Deadline)", "date": "YYYY-MM-DD or description", "page": <page_number> }
  ],
  "red_flags": [
    { "text": "Clause", "reason": "Specific risk", "risk_type": "Financial|Legal|Operational|Timeline", "page": <page_number> }
  ],
  "eval_criteria": [
    { "factor": "Factor name", "weight": "Points or percentage", "page": <page_number> }
  ]
}

CRITICAL: Extract the RFP Schedule (Proposals Due, etc.) from the ENTIRE document, not just the cover page. Ensure evaluation criteria are scoring points, not EEO goals.`;

    let intelligence: any = {};
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ 
            role: "user", 
            parts: [
              { text: intelligencePrompt },
              { inlineData: { mimeType: "application/pdf", data: pdfBase64 } }
            ] 
          }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 8192 },
          safetySettings: SAFETY_SETTINGS
        })
      });
      const data = await res.json();
      
      if (data?.candidates?.[0]?.finishReason === "SAFETY") {
        console.warn("[analyze] Intelligence Pass blocked by safety filters! Using partial response.");
      }
      
      let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      raw = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      
      try {
        intelligence = JSON.parse(raw);
      } catch (e) {
        console.warn("[analyze] Truncated JSON in Intelligence Pass. Attempting recovery...");
        const lastObjectEnd = raw.lastIndexOf("}");
        if (lastObjectEnd !== -1) {
          raw = raw.substring(0, lastObjectEnd + 1);
          try { intelligence = JSON.parse(raw); } 
          catch(e1) {
            try { intelligence = JSON.parse(raw + "}"); }
            catch(e2) {
              try { intelligence = JSON.parse(raw + "]}"); }
              catch(e3) { intelligence = {}; }
            }
          }
        } else {
          intelligence = {};
        }
      }
      console.log("[analyze] Intelligence Pass Complete.");
    } catch (e) {
      console.error("[analyze] Intelligence Pass Failed:", e);
      throw new Error("Intelligence analysis failed.");
    }

    // ─── PASS 2: REQUIREMENTS MATRIX ──────────────────────────────────────────
    console.log("[analyze] Pass 2: Extracting Requirements Matrix (Parallel Chunks via native PDF)...");
    
    let allRequirements: any[] = [];
    try {
      const totalPages = pageCount || 100; // Fallback if pdfParse fails to get pageCount
      const pagesPerChunk = Math.ceil(totalPages / 2);
      
      const chunkRanges = [
        { start: 1, end: pagesPerChunk },
        { start: pagesPerChunk + 1, end: totalPages + 10 } // Add buffer at the end just in case
      ];

      const fetchChunk = async (range: { start: number, end: number }, index: number) => {
        const matrixPrompt = `Analyze ONLY PAGES ${range.start} through ${range.end} of this RFP document. 
Ignore all other pages. 
Extract EVERY mandate, obligation, or technical requirement found IN THIS SPECIFIC PAGE RANGE ONLY.
Look for "shall", "must", "will", "required", "is responsible for".

Return JSON ONLY:
{
  "requirements": [
    { 
      "text": "Full requirement sentence", 
      "category": "Technical|Management|Legal|Compliance|Pricing|Operational", 
      "mandatory": true, 
      "severity": "Critical|High|Medium|Low", 
      "page": <page_number_between_${range.start}_and_${range.end}> 
    }
  ]
}

Try to extract all important requirements from pages ${range.start}-${range.end}.`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ 
              role: "user", 
              parts: [
                { text: matrixPrompt },
                { inlineData: { mimeType: "application/pdf", data: pdfBase64 } }
              ] 
            }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 8192 },
            safetySettings: SAFETY_SETTINGS
          })
        });
        
        const data = await res.json();
        let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        raw = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
        
        try {
          return JSON.parse(raw).requirements || [];
        } catch (parseErr) {
          console.warn("[analyze] Truncated JSON in Chunk " + (index + 1) + ". Attempting recovery...");
          const lastObjectEnd = raw.lastIndexOf("}");
          if (lastObjectEnd !== -1) {
            raw = raw.substring(0, lastObjectEnd + 1) + "]}";
            return JSON.parse(raw).requirements || [];
          }
          return [];
        }
      };

      // Run all 3 chunks at the exact same time
      const chunkResults = await Promise.all(chunkRanges.map((range, index) => fetchChunk(range, index)));
      
      for (const reqs of chunkResults) {
        if (Array.isArray(reqs)) allRequirements = allRequirements.concat(reqs);
      }
      
      // Remove exact duplicates just in case
      const uniqueReqs = new Map();
      for (const req of allRequirements) {
        if (req.text && req.text.length > 5) {
          uniqueReqs.set(req.text.trim(), req);
        }
      }
      allRequirements = Array.from(uniqueReqs.values());

      console.log("[analyze] Matrix Pass Complete: " + allRequirements.length + " unique reqs found across 2 native PDF chunks.");
    } catch (e) {
      console.warn("[analyze] Matrix Pass Failed, using intelligence results only.", e);
    }
    
    let matrix: any = { requirements: allRequirements };

    // ─── SAVE & FINISH ────────────────────────────────────────────────────────
    await Analysis.findByIdAndUpdate(analysis._id, {
      status: "done",
      rfpTitle: intelligence.rfp_title || file.name,
      issuingAgency: intelligence.issuing_agency || "Unknown",
      executiveSummary: intelligence.executive_summary,
      goNoGoScore: intelligence.score,
      goNoGoReasoning: intelligence.reasoning,
      requirements: matrix.requirements || [],
      keyDates: intelligence.key_dates || [],
      redFlags: intelligence.red_flags || [],
      deliverables: (intelligence.eval_criteria || []).map((e: any) => ({ 
        text: `${e.factor}: ${e.weight}`, 
        page: e.page 
      })),
    });

    // Save PDF file to public/uploads
    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadPath = path.join(process.cwd(), "public", "uploads", `${analysis._id}.pdf`);
    await fs.mkdir(path.dirname(uploadPath), { recursive: true });
    await fs.writeFile(uploadPath, buffer);

    dbUser.uploadsThisMonth = (dbUser.uploadsThisMonth ?? 0) + 1;
    await dbUser.save();

    return NextResponse.json({ success: true, analysisId: analysis._id.toString() });

  } catch (err: any) {
    console.error("[analyze] Unhandled error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import Analysis from "@/models/Analysis";
import User from "@/models/User";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { PDFDocument } from "pdf-lib";

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

    // ─── SINGLE MASTER PASS: TEXT-ONLY ──────────────
    const masterPrompt = `Analyze this RFP document text and extract the complete strategic intelligence and requirements list.

Return JSON ONLY in this exact compressed schema (to save output tokens and prevent truncation):
{
  "rfp_title": "Full title",
  "issuing_agency": "Agency name",
  "executive_summary": "3 substantial paragraphs covering scope, compliance burden, and strategic fit",
  "score": <integer 1-100, where 1-30=No-Bid, 80-100=Strong Match>,
  "reasoning": "2-3 sentences justifying the score based on risks vs value",
  "key_dates": [
    ["Event label (e.g. Proposals Due, Questions Deadline)", "YYYY-MM-DD or description", <page_number>]
  ],
  "red_flags": [
    ["Clause text", "Specific risk explanation", "Financial|Legal|Operational|Timeline", <page_number>]
  ],
  "eval_criteria": [
    ["Factor name", "Points or percentage weight", <page_number>]
  ],
  "reqs": [
    ["Requirement sentence", "Technical|Management|Legal|Compliance|Pricing|Operational", true/false, "Critical|High|Medium|Low", <estimated_page_number>]
  ]
}

CRITICAL INSTRUCTIONS:
1. Extract ALL key dates from the ENTIRE document.
2. Ensure evaluation criteria are scoring points, not EEO goals.
3. In the "reqs" list, extract the top 100-150 most critical requirements (focus on shall, must, will, required, is responsible for).`;

    const fullText = pdfData.text || "";

    const runMasterPass = async () => {
      console.log("[analyze] Running Single Master Pass (Text)...");
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{
              role: "user",
              parts: [
                { text: masterPrompt },
                { text: `Document Text:\n\n${fullText}` }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
            safetySettings: SAFETY_SETTINGS
          })
        });

        const data = await res.json();
        if (data.error) {
          console.error(`[analyze] API Error in Master Pass:`, JSON.stringify(data.error));
          return null;
        }

        let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) raw = jsonMatch[0];

        const mapOutput = (obj: any) => {
          if (!obj) return null;
          
          const intelligence = {
            rfp_title: obj.rfp_title || "",
            issuing_agency: obj.issuing_agency || "",
            executive_summary: obj.executive_summary || "",
            score: obj.score || 50,
            reasoning: obj.reasoning || "",
            key_dates: Array.isArray(obj.key_dates) ? obj.key_dates.map((d: any) => ({
              label: d[0] || "",
              date: d[1] || "",
              page: d[2] || 1
            })) : [],
            red_flags: Array.isArray(obj.red_flags) ? obj.red_flags.map((f: any) => ({
              text: f[0] || "",
              reason: f[1] || "",
              risk_type: f[2] || "Operational",
              page: f[3] || 1
            })) : [],
            eval_criteria: Array.isArray(obj.eval_criteria) ? obj.eval_criteria.map((c: any) => ({
              factor: c[0] || "",
              weight: c[1] || "",
              page: c[2] || 1
            })) : []
          };

          const requirements = Array.isArray(obj.reqs) ? obj.reqs.map((r: any) => ({
            text: r[0] || "",
            category: r[1] || "Compliance",
            mandatory: typeof r[2] === "boolean" ? r[2] : true,
            severity: r[3] || "High",
            page: r[4] || 1
          })) : [];

          return { intelligence, requirements };
        };

        try {
          const parsed = JSON.parse(raw);
          return mapOutput(parsed);
        } catch (e: any) {
          console.warn("[analyze] Truncated JSON in Master Pass. Attempting recovery...");
          console.error("[analyze] Master Pass parse error:", e.message);
          console.log(`[analyze] Master Pass Raw length: ${raw.length}`);
          console.log(`[analyze] Master Pass Raw start preview:\n${raw.substring(0, 1000)}\n...`);
          console.log(`[analyze] Master Pass Raw end preview:\n...\n${raw.substring(Math.max(0, raw.length - 1000))}`);

          const lastObjectEnd = Math.max(raw.lastIndexOf("}"), raw.lastIndexOf("]"));
          if (lastObjectEnd !== -1) {
            raw = raw.substring(0, lastObjectEnd + 1);
            try {
              const parsed = JSON.parse(raw);
              return mapOutput(parsed);
            } catch (e1) {
              try {
                const parsed = JSON.parse(raw + "]}");
                return mapOutput(parsed);
              } catch (e2) {
                try {
                  const parsed = JSON.parse(raw + "]]}");
                  return mapOutput(parsed);
                } catch (e3) {
                  try {
                    const parsed = JSON.parse(raw + "}");
                    return mapOutput(parsed);
                  } catch (e4) {
                    return null;
                  }
                }
              }
            }
          }
          return null;
        }
      } catch (err) {
        console.error("[analyze] Master Pass fetch failed:", err);
        return null;
      }
    };

    const result = await runMasterPass();
    if (!result) {
      await Analysis.findByIdAndUpdate(analysis._id, {
        status: "error",
        errorMessage: "Failed to parse analysis results.",
      });
      return NextResponse.json({ error: "failed_parse" }, { status: 500 });
    }

    const { intelligence, requirements } = result;

    const uniqueReqs = new Map();
    for (const req of requirements) {
      if (req.text && req.text.length > 5) {
        uniqueReqs.set(req.text.trim(), req);
      }
    }
    const allRequirements = Array.from(uniqueReqs.values());
    console.log(`[analyze] Master Pass Complete: ${allRequirements.length} unique requirements extracted.`);

    // ─── SAVE & FINISH ────────────────────────────────────────────────────────
    await Analysis.findByIdAndUpdate(analysis._id, {
      status: "done",
      rfpTitle: intelligence.rfp_title || file.name,
      issuingAgency: intelligence.issuing_agency || "Unknown",
      executiveSummary: intelligence.executive_summary,
      goNoGoScore: intelligence.score,
      goNoGoReasoning: intelligence.reasoning,
      requirements: allRequirements || [],
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

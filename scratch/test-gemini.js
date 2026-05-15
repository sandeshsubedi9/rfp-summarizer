// Quick Gemini API reachability test
// Run with: node scratch/test-gemini.js

const GEMINI_API_KEY = "AIzaSyANCq5nn2ZFd1mKTJUJ9doXYyWWWhhszWs";

async function testGemini() {
  console.log("Testing Gemini API connectivity from your region...\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Reply with just the word: WORKS" }] }],
      }),
    });

    const data = await res.json();

    if (res.ok) {
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("✅ Gemini API is REACHABLE from your region.");
      console.log("   Response:", text);
      console.log("\n→ You can safely switch to Gemini for the pipeline.");
    } else {
      console.log("❌ Gemini API returned an error.");
      console.log("   Status:", res.status);
      console.log("   Error:", JSON.stringify(data?.error, null, 2));

      if (data?.error?.status === "PERMISSION_DENIED" || res.status === 403) {
        console.log("\n→ This is likely a REGIONAL RESTRICTION.");
        console.log("   Gemini is not available in your country via direct API.");
        console.log("   Stick with Groq. Upgrade to Dev Tier is the answer.");
      } else if (res.status === 429) {
        console.log("\n→ API key works but you're rate limited. Gemini IS reachable.");
      } else if (res.status === 400) {
        console.log("\n→ API key works but bad request format. Gemini IS reachable.");
      }
    }
  } catch (err) {
    console.log("❌ Network error — could not reach Google's servers at all.");
    console.log("   Error:", err.message);
    console.log("\n→ This is either a network block or DNS issue in your region.");
  }
}

testGemini();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Manually parse .env.local to avoid dependency issues in scratch
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim().replace(/["']/g, "") : null;

async function listModels() {
  if (!apiKey) {
    console.error("No API key found in .env.local");
    return;
  }
  
  console.log("Using API Key (first 4 chars):", apiKey.substring(0, 4));
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const result = await genAI.listModels();
    console.log("\n--- AVAILABLE MODELS ---");
    result.models.forEach(m => {
      console.log(`Model: ${m.name}`);
      console.log(`Methods: ${m.supportedGenerationMethods.join(", ")}`);
      console.log("---");
    });
  } catch (err) {
    console.error("Error listing models:", err.message);
  }
}

listModels();

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const match = envContent.match(/OPENROUTER_API_KEY=(.*)/);
const apiKey = match ? match[1].trim().replace(/["']/g, "") : null;

if (!apiKey) {
  console.log("No OPENROUTER_API_KEY found in .env.local");
  process.exit(1);
}

console.log("Fetching available free models from OpenRouter...");

fetch("https://openrouter.ai/api/v1/models", {
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }
})
.then(res => res.json())
.then(data => {
  const freeModels = data.data
    .filter(m => m.id.includes(":free") || m.pricing.prompt === "0")
    .map(m => ({ id: m.id, name: m.name, context: m.context_length }));
  
  console.log("\n--- Available Free Models ---");
  freeModels.forEach(m => {
    console.log(`${m.id.padEnd(50)} | Context: ${m.context}`);
  });
})
.catch(err => console.error("Error fetching models:", err));

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim().replace(/["']/g, "") : null;

console.log(`Testing API Key: ${apiKey.substring(0, 8)}...`);

// Expanded list - experimental and newer models
const tests = [
  { version: "v1beta", model: "gemini-2.0-flash-exp" },
  { version: "v1beta", model: "gemini-2.0-pro-exp" },
  { version: "v1beta", model: "gemini-exp-1206" },
  { version: "v1beta", model: "gemini-2.0-flash-thinking-exp-01-21" },
  { version: "v1beta", model: "gemini-2.5-pro-exp-03-25" },
  { version: "v1beta", model: "gemini-2.5-flash-preview-04-17" },
  { version: "v1beta", model: "gemini-2.0-flash" },
  { version: "v1beta", model: "gemini-2.0-flash-lite" },
];

let done = 0;
tests.forEach(({ version, model }) => {
  const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
  const body = `{"contents":[{"parts":[{"text":"hi"}]}]}`;
  const command = `curl -s -X POST "${url}" -H "Content-Type: application/json" -d "${body.replace(/"/g, '\\"')}"`;

  exec(command, (err, stdout) => {
    done++;
    console.log(`\n[${version}] ${model}:`);
    try {
      const res = JSON.parse(stdout);
      if (res.error) {
        console.log(`  ❌ ${res.error.status}: ${res.error.message.substring(0, 100)}`);
      } else if (res.candidates) {
        console.log(`  ✅ SUCCESS! This model works!`);
      } else {
        console.log(`  ⚠️  Unknown: ${JSON.stringify(res).substring(0, 100)}`);
      }
    } catch {
      console.log(`  ⚠️  Raw: ${stdout.substring(0, 100)}`);
    }
    if (done === tests.length) console.log("\n✅ Done testing all models!");
  });
});

import { callUserLlm } from "../src/lib/app-builder/llm";
import { buildHeuristicAppSpec } from "../src/lib/app-studio/build-app-spec";
import { detectProductKind } from "../src/lib/app-studio/product-kind";

async function main() {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) {
    console.error("No GROQ_API_KEY");
    process.exit(1);
  }

  const r = buildHeuristicAppSpec("ResumeLift resume builder");
  const b = buildHeuristicAppSpec("digital banking UPI freeze cards");
  console.log("kinds", detectProductKind(r), detectProductKind(b));

  const out = await callUserLlm({
    secrets: { provider: "groq", apiKey: key, model: "llama-3.3-70b-versatile" },
    maxTokens: 200,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: "Rewrite resume summary. Return only the paragraph.",
      },
      { role: "user", content: "I am a developer who likes React." },
    ],
  });
  console.log("AI_OK", out.slice(0, 220));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

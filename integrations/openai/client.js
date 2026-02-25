const SYSTEM_PROMPT = [
  "You are a civil petition draft assistant.",
  "Never fabricate citations.",
  "Use provided legal_sources only.",
  "If legal basis is insufficient, decision must be REQUEST_INFO or TRANSFER and legal_review must explicitly state insufficiency."
].join(" ");

export class OpenAIClient {
  async generateStructuredDraft(input, schema) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required when DRAFT_ENGINE_MODE=openai");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: SYSTEM_PROMPT }]
          },
          {
            role: "user",
            content: [{ type: "input_text", text: JSON.stringify(input) }]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "draft_reply",
            schema,
            strict: true
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI Responses API failed with status ${response.status}`);
    }

    const payload = await response.json();
    const outputText =
      (typeof payload.output_text === "string" && payload.output_text) ||
      extractOutputText(payload.output);

    if (!outputText) {
      throw new Error("OpenAI Responses API returned no structured output text");
    }

    return JSON.parse(outputText);
  }
}

function extractOutputText(output) {
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = item.content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      if (typeof part.text === "string" && part.text.trim()) {
        return part.text;
      }
    }
  }

  return null;
}

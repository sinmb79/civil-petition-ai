import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { maskPII } from "../../core/pii.js";
import { OpenAIClient } from "../../../integrations/openai/client.js";
import { validateDraftReplyShape } from "./validate.js";

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), "../schema/draft_reply.schema.json");
export const draftReplySchema = JSON.parse(readFileSync(schemaPath, "utf-8"));

export class DraftEngine {
  constructor(openAIClient = new OpenAIClient()) {
    this.openAIClient = openAIClient;
  }

  async generate(input) {
    const mode = process.env.DRAFT_ENGINE_MODE ?? "stub";
    const result = mode === "openai"
      ? await this.openAIClient.generateStructuredDraft(
          { ...input, raw_text: maskPII(input.raw_text) },
          draftReplySchema
        )
      : generateStubDraft(input);

    if (!validateDraftReplyShape(result)) {
      throw new Error("Draft reply failed schema validation");
    }

    return result;
  }
}

export function generateStubDraft(input) {
  const hasLegalBasis = input.legal_sources.length > 0;

  return {
    petition_summary: `Petition ${input.petition_id} was received and normalized for review.`,
    fact_analysis: hasLegalBasis
      ? "Submitted facts are materially consistent with retrieved legal sources."
      : "Submitted facts require additional legal basis before adjudication.",
    legal_review: hasLegalBasis
      ? "Legal sources were reviewed and mapped to the petition issues."
      : "Insufficient legal basis to provide a final decision.",
    decision: hasLegalBasis ? "APPROVE" : "REQUEST_INFO",
    action_plan: hasLegalBasis
      ? "Proceed with administrative drafting and legal citation verification."
      : "Request additional legal documents or transfer to competent department.",
    legal_basis: input.legal_sources.map((source) => ({
      title: source.title,
      article: source.article,
      effective_date: source.effective_date,
      source_url: source.source_url
    })),
    audit_risk: {
      level: hasLegalBasis ? "LOW" : "MODERATE",
      findings: hasLegalBasis ? ["No procedural omission detected"] : ["Missing legal basis reference"],
      recommendations: hasLegalBasis
        ? ["Maintain source traceability logs"]
        : ["Collect mandatory legal references before disposition"]
    }
  };
}

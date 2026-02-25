import { evaluateAuditRisk } from "./engines/audit-risk.js";
import { formatCitations } from "./engines/citation-formatter.js";
import { generateDraft } from "./engines/draft-generation.js";
import { retrieveLegalSources } from "./engines/legal-retrieval.js";
import { renderOutput } from "./engines/output-renderer.js";
import { structurePetition } from "./engines/petition-structuring.js";

export function runPipeline(input) {
  const aiMode = input.aiMode ?? "stub";
  if (aiMode !== "stub") {
    throw new Error("Only stub mode is supported in deterministic evaluation.");
  }

  const structured = structurePetition(input.petition);
  const matchedSources = retrieveLegalSources(input.petition, input.legalSources);
  const citations = formatCitations(matchedSources);
  const audit = evaluateAuditRisk({
    petition: input.petition,
    hasLegalBasis: citations.length > 0,
    auditCases: input.auditCases
  });

  return renderOutput(
    generateDraft({
      petition: input.petition,
      summary: structured.summary,
      facts: structured.facts,
      citations,
      audit
    })
  );
}

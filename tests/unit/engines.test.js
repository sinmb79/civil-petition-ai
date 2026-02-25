import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAuditRisk } from "../../src/engines/audit-risk.js";
import { formatCitations } from "../../src/engines/citation-formatter.js";
import { generateDraft } from "../../src/engines/draft-generation.js";
import { clearLegalCache, retrieveLegalSources } from "../../src/engines/legal-retrieval.js";
import { structurePetition } from "../../src/engines/petition-structuring.js";
import { runPipeline } from "../../src/pipeline.js";
import { validateCitationCompleteness } from "../../src/validators/citation-validator.js";

const legalSources = [
  {
    id: "LS1",
    law_name: "Civil Petition Handling Act",
    article: "Article 12",
    effective_date: "2024-01-01",
    source_link: "https://mock.law/cpha/a12",
    keywords: ["민원"],
    processing_types: ["GENERAL"]
  }
];

const auditCases = [
  {
    id: "AC1",
    trigger_keywords: ["절차 생략"],
    related_rules: ["R2_PROCEDURAL_OMISSION"]
  }
];

test("structures petition text", () => {
  const petition = structurePetition({
    raw_text: "민원 문장",
    processing_type: "GENERAL",
    budget_related: false,
    discretionary: false
  });
  assert.ok(petition.summary.includes("민원"));
});

test("retrieves and formats legal sources", () => {
  clearLegalCache();
  const petition = {
    raw_text: "민원",
    processing_type: "GENERAL",
    budget_related: false,
    discretionary: false
  };
  const matched = retrieveLegalSources(petition, legalSources);
  const citations = formatCitations(matched);
  assert.equal(citations[0].law_name, "Civil Petition Handling Act");
});

test("evaluates audit risk deterministically", () => {
  const payload = {
    petition: {
      raw_text: "절차 생략",
      processing_type: "GENERAL",
      budget_related: false,
      discretionary: false
    },
    hasLegalBasis: true,
    auditCases
  };
  assert.deepEqual(evaluateAuditRisk(payload), evaluateAuditRisk(payload));
});

test("validates citation completeness", () => {
  const errors = validateCitationCompleteness([{ law_name: "", article: "", effective_date: "", source_link: "" }]);
  assert.equal(errors.length, 4);
});

test("runs end-to-end pipeline in stub mode", () => {
  const output = runPipeline({
    petition: {
      raw_text: "민원",
      processing_type: "GENERAL",
      budget_related: false,
      discretionary: false
    },
    legalSources,
    auditCases,
    aiMode: "stub"
  });

  assert.equal(output.decision, "APPROVE");
});

test("generates request-info decision for missing legal basis", () => {
  const output = generateDraft({
    petition: {
      raw_text: "unknown",
      processing_type: "GENERAL",
      budget_related: false,
      discretionary: false
    },
    summary: "s",
    facts: "f",
    citations: [],
    audit: {
      level: "MODERATE",
      score: 3,
      rules: ["R1_MISSING_LEGAL_BASIS"],
      findings: [],
      recommendations: []
    }
  });
  assert.equal(output.decision, "REQUEST_INFO");
});

const DECISIONS = new Set(["APPROVE", "PARTIAL_APPROVE", "REJECT", "REQUEST_INFO", "TRANSFER"]);
const LEVELS = new Set(["LOW", "MODERATE", "HIGH"]);
const RULES = new Set([
  "R1_MISSING_LEGAL_BASIS",
  "R2_PROCEDURAL_OMISSION",
  "R3_ABUSE_OF_DISCRETION",
  "R4_BUDGET_MISUSE",
  "R5_PREFERENTIAL_TREATMENT",
  "R6_REPEATED_AUDIT_FINDINGS"
]);

export function validateDraftSchema(output) {
  const errors = [];
  const requiredStringFields = ["petition_summary", "fact_analysis", "legal_review", "action_plan"];
  for (const field of requiredStringFields) {
    if (typeof output[field] !== "string" || output[field].length === 0) {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  if (!DECISIONS.has(output.decision)) errors.push("decision is invalid");
  if (!Array.isArray(output.legal_basis)) errors.push("legal_basis must be an array");
  if (!output.audit_risk || typeof output.audit_risk !== "object") errors.push("audit_risk must be an object");

  if (output.audit_risk) {
    if (!LEVELS.has(output.audit_risk.level)) errors.push("audit_risk.level is invalid");
    if (!Number.isInteger(output.audit_risk.score) || output.audit_risk.score < 0) errors.push("audit_risk.score is invalid");
    if (!Array.isArray(output.audit_risk.rules) || !output.audit_risk.rules.every((rule) => RULES.has(rule))) {
      errors.push("audit_risk.rules is invalid");
    }
    if (!Array.isArray(output.audit_risk.findings)) errors.push("audit_risk.findings must be array");
    if (!Array.isArray(output.audit_risk.recommendations)) errors.push("audit_risk.recommendations must be array");
  }

  return errors;
}

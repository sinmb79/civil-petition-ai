const DECISIONS = new Set(["APPROVE", "REJECT", "REQUEST_INFO", "TRANSFER"]);
const LEVELS = new Set(["LOW", "MODERATE", "HIGH"]);

export function validateDraftReplyShape(output) {
  if (!output || typeof output !== "object") return false;

  const requiredStrings = ["petition_summary", "fact_analysis", "legal_review", "action_plan"];
  for (const key of requiredStrings) {
    if (typeof output[key] !== "string") return false;
  }

  if (!DECISIONS.has(output.decision)) return false;
  if (!Array.isArray(output.legal_basis)) return false;

  for (const basis of output.legal_basis) {
    if (!basis || typeof basis !== "object") return false;
    if (
      typeof basis.title !== "string" ||
      typeof basis.article !== "string" ||
      typeof basis.effective_date !== "string" ||
      typeof basis.source_url !== "string" ||
      basis.source_url.length === 0
    ) {
      return false;
    }
  }

  const risk = output.audit_risk;
  if (!risk || typeof risk !== "object") return false;
  if (!LEVELS.has(risk.level)) return false;
  if (!Array.isArray(risk.findings) || !risk.findings.every((v) => typeof v === "string")) return false;
  if (!Array.isArray(risk.recommendations) || !risk.recommendations.every((v) => typeof v === "string")) return false;

  return true;
}

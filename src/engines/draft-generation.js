function selectDecision(petition, rules) {
  if (petition.processing_type === "TRANSFER") return "TRANSFER";
  if (rules.includes("R1_MISSING_LEGAL_BASIS")) return "REQUEST_INFO";
  if (rules.includes("R4_BUDGET_MISUSE") || rules.includes("R5_PREFERENTIAL_TREATMENT")) return "REJECT";
  if (rules.includes("R2_PROCEDURAL_OMISSION") || rules.includes("R3_ABUSE_OF_DISCRETION")) return "PARTIAL_APPROVE";
  return "APPROVE";
}

export function generateDraft(input) {
  const decision = selectDecision(input.petition, input.audit.rules);
  const legalReview =
    input.citations.length > 0
      ? `Relevant legal basis identified: ${input.citations.map((c) => `${c.law_name} ${c.article}`).join(", ")}`
      : "Insufficient Legal Basis.";

  return {
    petition_summary: input.summary,
    fact_analysis: input.facts,
    legal_review: legalReview,
    decision,
    action_plan: `Decision=${decision}; follow-up based on risk level ${input.audit.level}`,
    legal_basis: input.citations,
    audit_risk: input.audit
  };
}

const RULE_SCORES = {
  R1_MISSING_LEGAL_BASIS: 3,
  R2_PROCEDURAL_OMISSION: 2,
  R3_ABUSE_OF_DISCRETION: 2,
  R4_BUDGET_MISUSE: 3,
  R5_PREFERENTIAL_TREATMENT: 3,
  R6_REPEATED_AUDIT_FINDINGS: 2
};

export function evaluateAuditRisk(input) {
  const rules = new Set();
  const text = input.petition.raw_text.toLowerCase();

  if (!input.hasLegalBasis) rules.add("R1_MISSING_LEGAL_BASIS");
  if (text.includes("절차 생략") || text.includes("procedure omitted")) rules.add("R2_PROCEDURAL_OMISSION");
  if (input.petition.discretionary) rules.add("R3_ABUSE_OF_DISCRETION");
  if (input.petition.budget_related && (text.includes("목적 외") || text.includes("budget transfer") || text.includes("전용"))) {
    rules.add("R4_BUDGET_MISUSE");
  }
  if (text.includes("특혜") || text.includes("친인척") || text.includes("specific vendor")) {
    rules.add("R5_PREFERENTIAL_TREATMENT");
  }

  for (const auditCase of input.auditCases) {
    const hasKeyword = auditCase.trigger_keywords.some((keyword) => text.includes(keyword.toLowerCase()));
    if (hasKeyword) {
      for (const rule of auditCase.related_rules) rules.add(rule);
      rules.add("R6_REPEATED_AUDIT_FINDINGS");
    }
  }

  const sortedRules = [...rules].sort();
  const score = sortedRules.reduce((sum, rule) => sum + RULE_SCORES[rule], 0);
  const level = score >= 5 ? "HIGH" : score >= 2 ? "MODERATE" : "LOW";

  return {
    score,
    level,
    rules: sortedRules,
    findings: sortedRules.map((rule) => `Detected ${rule}`),
    recommendations: sortedRules.length
      ? sortedRules.map((rule) => `Mitigate ${rule}`)
      : ["Proceed with standard administrative handling"]
  };
}

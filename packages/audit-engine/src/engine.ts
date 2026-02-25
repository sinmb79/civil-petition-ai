import type { AuditFinding, AuditRiskInput, AuditRiskOutput, RiskLevel } from '@civil-petition/core';

const HIGH_RISK_TOKENS = ['특혜', '봐주기', '청탁', '민원인 요구', '지인', '아는 사람', '압력'];

type RuleResult = {
  score: number;
  finding?: AuditFinding;
};

const hasIncompleteCitation = (input: AuditRiskInput): boolean =>
  input.legal_sources.some(
    (source) => !source.title || !source.article || !source.effective_date || !source.source_url,
  );

const containsPreferentialSignal = (rawText: string): boolean => {
  const text = rawText.toLowerCase();
  return HIGH_RISK_TOKENS.some((token) => text.includes(token.toLowerCase()));
};

const resolveLevel = (total: number): RiskLevel => {
  if (total >= 70) return 'HIGH';
  if (total >= 35) return 'MODERATE';
  return 'LOW';
};

export class AuditRiskEngine {
  evaluate(input: AuditRiskInput): AuditRiskOutput {
    const ruleResults: Record<string, RuleResult> = {
      R1_MISSING_LEGAL_BASIS:
        input.legal_sources.length === 0
          ? {
              score: 50,
              finding: {
                id: 'R1_MISSING_LEGAL_BASIS',
                risk_type: 'LACK_OF_LEGAL_BASIS',
                description: 'No legal source was provided for this decision context.',
                recommendation: 'Retrieve and cite at least one valid legal source before finalizing the decision.',
                severity: 'HIGH',
              },
            }
          : { score: 0 },
      R2_INCOMPLETE_CITATION:
        hasIncompleteCitation(input)
          ? {
              score: 30,
              finding: {
                id: 'R2_INCOMPLETE_CITATION',
                risk_type: 'CITATION_COMPLETENESS',
                description: 'One or more legal citations are missing required fields.',
                recommendation: 'Complete title, article, effective_date, and source_url for every citation.',
                severity: 'MEDIUM',
              },
            }
          : { score: 0 },
      R3_PROCEDURE_OMISSION:
        ['ACCEPT', 'PARTIAL', 'REJECT'].includes(input.decision) &&
        input.petition.discretionary === true &&
        !(input.procedural_steps_completed ?? []).includes('NOTICE')
          ? {
              score: 20,
              finding: {
                id: 'R3_PROCEDURE_OMISSION',
                risk_type: 'PROCEDURAL_OMISSION',
                description: 'Discretionary decision is missing NOTICE procedural step.',
                recommendation: 'Complete and document NOTICE before decision issuance.',
                severity: 'MEDIUM',
              },
            }
          : { score: 0 },
      R4_BUDGET_MISUSE:
        input.petition.budget_related === true && input.budget_context?.purpose_match === false
          ? {
              score: 40,
              finding: {
                id: 'R4_BUDGET_MISUSE',
                risk_type: 'BUDGET_MISUSE',
                description: 'Planned action appears not aligned with budget purpose.',
                recommendation: 'Align action scope with approved budget purpose or revise budget allocation.',
                severity: 'HIGH',
              },
            }
          : { score: 0 },
      R5_PREFERENTIAL_TREATMENT_SIGNAL:
        containsPreferentialSignal(input.petition.raw_text)
          ? {
              score: 25,
              finding: {
                id: 'R5_PREFERENTIAL_TREATMENT_SIGNAL',
                risk_type: 'PREFERENTIAL_TREATMENT',
                description: 'Petition text contains preferential treatment signal tokens.',
                recommendation: 'Require objective criteria and independent review to prevent preferential handling.',
                severity: 'MEDIUM',
              },
            }
          : { score: 0 },
      R6_REPEAT_AUDIT_PATTERN:
        (input.audit_cases?.length ?? 0) >= 3
          ? {
              score: 25,
              finding: {
                id: 'R6_REPEAT_AUDIT_PATTERN',
                risk_type: 'REPEAT_AUDIT_PATTERN',
                description: 'Multiple matching audit cases indicate repeated finding pattern.',
                recommendation: 'Escalate to compliance review and apply preventive controls from prior cases.',
                severity: 'HIGH',
              },
            }
          : (input.audit_cases?.length ?? 0) >= 1
            ? {
                score: 15,
                finding: {
                  id: 'R6_REPEAT_AUDIT_PATTERN',
                  risk_type: 'REPEAT_AUDIT_PATTERN',
                  description: 'At least one matching audit case was found.',
                  recommendation: 'Review prior audit cases and add mitigations to avoid repeated findings.',
                  severity: 'MEDIUM',
                },
              }
            : { score: 0 },
    };

    const byRule = Object.fromEntries(
      Object.entries(ruleResults)
        .filter(([, result]) => result.score > 0)
        .map(([ruleId, result]) => [ruleId, result.score]),
    );

    const findings = Object.values(ruleResults)
      .map((result) => result.finding)
      .filter((finding): finding is AuditFinding => Boolean(finding));

    const recommendations = [...new Set(findings.map((finding) => finding.recommendation))];
    const total = Object.values(byRule).reduce((sum, score) => sum + score, 0);

    return {
      level: resolveLevel(total),
      findings,
      recommendations,
      score_breakdown: {
        total,
        by_rule: byRule,
      },
    };
  }
}

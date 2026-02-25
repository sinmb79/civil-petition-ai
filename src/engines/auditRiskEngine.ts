import type { AuditEvaluation, LegalSource } from '../types.js';

export class AuditRiskEngine {
  evaluate(input: { sources: LegalSource[]; budgetRelated: boolean; discretionary: boolean }): AuditEvaluation {
    const findings: AuditEvaluation['findings'] = [];
    let scoreTotal = 0;

    if (input.sources.length === 0) {
      scoreTotal += 90;
      findings.push({
        riskType: 'LACK_OF_LEGAL_BASIS',
        description: 'No retrievable legal source was found for this petition.',
        recommendation: 'Collect statutes/ordinances before issuing a final answer.',
        severity: 'HIGH',
      });
    }

    if (input.discretionary) {
      scoreTotal += 20;
      findings.push({
        riskType: 'ABUSE_OF_DISCRETION',
        description: 'Discretionary handling path detected.',
        recommendation: 'Add documented rationale and approval chain.',
        severity: 'MODERATE',
      });
    }

    if (input.budgetRelated) {
      scoreTotal += 15;
      findings.push({
        riskType: 'BUDGET_MISUSE',
        description: 'Budget-related petition requires strict budget-purpose matching.',
        recommendation: 'Attach budget execution evidence and legal basis.',
        severity: 'MODERATE',
      });
    }

    const level = scoreTotal >= 70 ? 'HIGH' : scoreTotal >= 30 ? 'MODERATE' : 'LOW';
    return { level, scoreTotal, findings };
  }
}

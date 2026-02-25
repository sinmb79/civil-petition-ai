import { DraftEngine, LegalSource } from '../../packages/draft-engine/src';
import { applyValidationWithRepair } from '../../packages/core/validators';
import { AuditRiskEngine } from '../engines/auditRiskEngine';

type PetitionInput = {
  petition_id: string;
  raw_text: string;
  processing_type: string;
  budget_related: boolean;
  discretionary: boolean;
  legal_sources?: LegalSource[];
};

const draftEngine = new DraftEngine();
const auditRiskEngine = new AuditRiskEngine();

export async function generateDraftPayloadFromPetition(input: PetitionInput): Promise<Record<string, unknown>> {
  const legalSources = Array.isArray(input.legal_sources) ? input.legal_sources : [];

  const draftResult = await draftEngine.generateDraft({
    petition_summary: input.raw_text,
    facts: `processing_type=${input.processing_type}, budget_related=${input.budget_related}, discretionary=${input.discretionary}`,
    legal_sources: legalSources,
    request_id: input.petition_id
  });
  const validated = applyValidationWithRepair(draftResult, legalSources, input.raw_text);

  if (validated.validation.status === 'WARN') {
    console.warn(
      JSON.stringify({
        event: 'draft.validator.warn',
        petition_id: input.petition_id,
        issues: validated.validation.issues
      })
    );
  }

  const detectedRisks = buildDetectedRisks(input);
  const audit = auditRiskEngine.evaluate({
    tenant_id: 'default-tenant',
    detected_risks: detectedRisks
  });

  return {
    petition_id: input.petition_id,
    ...validated.output,
    audit_risk: {
      level: audit.level,
      findings: audit.explain.map((item) => item.reason),
      recommendations:
        (validated.output as any).decision === 'REQUEST_INFO'
          ? ['Collect legal sources and supporting documents, then re-run draft generation.']
          : ['Proceed with documented review and approval workflow.']
    }
  };
}

function buildDetectedRisks(input: {
  budget_related: boolean;
  discretionary: boolean;
}): Array<{ rule_id: string; risk_type: string; base_score: number }> {
  const risks: Array<{ rule_id: string; risk_type: string; base_score: number }> = [];

  if (input.budget_related) {
    risks.push({
      rule_id: 'RULE_BUDGET_001',
      risk_type: 'BUDGET_MISUSE',
      base_score: 3
    });
  }

  if (input.discretionary) {
    risks.push({
      rule_id: 'RULE_DISC_001',
      risk_type: 'ABUSE_OF_DISCRETION',
      base_score: 2
    });
  }

  return risks;
}

import {
  DraftReply,
  LegalSource,
  buildInsufficientLegalBasisReply,
  isDraftReply
} from '../../draft-engine/src';

export type ValidationStatus = 'PASS' | 'WARN' | 'FAIL';
export type ValidationIssue = {
  validator: 'schemaValidator' | 'citationAllowlistValidator' | 'piiValidator' | 'consistencyValidator';
  severity: 'WARN' | 'FAIL';
  message: string;
};

export type ValidationResult = {
  status: ValidationStatus;
  issues: ValidationIssue[];
};

const RESIDENT_ID_REGEX = /\b\d{6}-?[1-4]\d{6}\b/;
const PHONE_REGEX = /\b(?:01[0-9]|02|0[3-9][0-9])-?\d{3,4}-?\d{4}\b/;
const EMAIL_REGEX = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}\b/;
const REQUEST_INFO_CONFLICT_REGEX = /수용합니다/g;

export function schemaValidator(output: unknown): ValidationIssue[] {
  if (!isDraftReply(output)) {
    return [
      {
        validator: 'schemaValidator',
        severity: 'FAIL',
        message: 'Draft output does not satisfy DraftReply shape.'
      }
    ];
  }

  return [];
}

export function citationAllowlistValidator(
  output: DraftReply,
  legalSources: LegalSource[]
): ValidationIssue[] {
  const allowlist = new Set(
    legalSources.map((source) =>
      JSON.stringify([
        source.law_name,
        source.article_number,
        source.effective_date,
        source.source_link
      ])
    )
  );

  const invalid = output.legal_basis.find(
    (source) =>
      !allowlist.has(
        JSON.stringify([source.law_name, source.article_number, source.effective_date, source.source_link])
      )
  );

  if (invalid) {
    return [
      {
        validator: 'citationAllowlistValidator',
        severity: 'FAIL',
        message: `Citation is not in input legal_sources: ${invalid.law_name} ${invalid.article_number}`
      }
    ];
  }

  return [];
}

export function piiValidator(output: DraftReply): ValidationIssue[] {
  const textTargets = extractTextTargets(output);
  const hasPii = textTargets.some(
    (text) =>
      RESIDENT_ID_REGEX.test(text) || PHONE_REGEX.test(text) || EMAIL_REGEX.test(text)
  );

  if (hasPii) {
    return [
      {
        validator: 'piiValidator',
        severity: 'FAIL',
        message: 'PII pattern detected in draft output.'
      }
    ];
  }

  return [];
}

export function consistencyValidator(output: DraftReply): ValidationIssue[] {
  if (output.decision !== 'REQUEST_INFO') {
    return [];
  }

  const texts = [output.fact_analysis, output.legal_review, output.action_plan];
  const conflict = texts.some((text) => REQUEST_INFO_CONFLICT_REGEX.test(text));
  if (conflict) {
    return [
      {
        validator: 'consistencyValidator',
        severity: 'FAIL',
        message: 'REQUEST_INFO decision conflicts with acceptance phrase.'
      }
    ];
  }

  return [];
}

export function validatorPipeline(output: unknown, legalSources: LegalSource[]): ValidationResult {
  const schemaIssues = schemaValidator(output);
  if (schemaIssues.length > 0) {
    return { status: 'FAIL', issues: schemaIssues };
  }

  const draft = output as DraftReply;
  const issues = [
    ...citationAllowlistValidator(draft, legalSources),
    ...piiValidator(draft),
    ...consistencyValidator(draft)
  ];

  const hasFail = issues.some((issue) => issue.severity === 'FAIL');
  const hasWarn = issues.some((issue) => issue.severity === 'WARN');
  return {
    status: hasFail ? 'FAIL' : hasWarn ? 'WARN' : 'PASS',
    issues
  };
}

export function repairDraftResult(output: DraftReply): DraftReply {
  const repaired = deepClone(output);

  repaired.petition_summary = redactPii(repaired.petition_summary);
  repaired.fact_analysis = softenAndRedact(repaired.fact_analysis);
  repaired.legal_review = softenAndRedact(repaired.legal_review);
  repaired.action_plan = softenAndRedact(repaired.action_plan);
  repaired.audit_risk.findings = repaired.audit_risk.findings.map(softenAndRedact);
  repaired.audit_risk.recommendations = repaired.audit_risk.recommendations.map(softenAndRedact);

  return repaired;
}

export function applyValidationWithRepair(
  output: DraftReply,
  legalSources: LegalSource[],
  petitionSummary: string
): { output: DraftReply; validation: ValidationResult; repaired: boolean; fellBack: boolean } {
  const first = validatorPipeline(output, legalSources);
  if (first.status !== 'FAIL') {
    return { output, validation: first, repaired: false, fellBack: false };
  }

  const repairedOutput = repairDraftResult(output);
  const second = validatorPipeline(repairedOutput, legalSources);
  if (second.status !== 'FAIL') {
    return { output: repairedOutput, validation: second, repaired: true, fellBack: false };
  }

  const fallback = buildInsufficientLegalBasisReply(petitionSummary);
  return {
    output: fallback,
    validation: second,
    repaired: true,
    fellBack: true
  };
}

function extractTextTargets(output: DraftReply): string[] {
  return [
    output.petition_summary,
    output.fact_analysis,
    output.legal_review,
    output.action_plan,
    ...output.audit_risk.findings,
    ...output.audit_risk.recommendations
  ];
}

function redactPii(text: string): string {
  return text
    .replace(RESIDENT_ID_REGEX, '[REDACTED_RESIDENT_ID]')
    .replace(PHONE_REGEX, '[REDACTED_PHONE]')
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
}

function softenAndRedact(text: string): string {
  const softened = text.replace(REQUEST_INFO_CONFLICT_REGEX, '추가 검토가 필요합니다');
  return redactPii(softened);
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

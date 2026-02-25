import {
  DraftReply,
  LegalSource,
  buildInsufficientLegalBasisReply,
  isDraftReply
} from '../../draft-engine/src';
import { getRules, initializeRuleLoader } from '../src/rules/loader';

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

initializeRuleLoader();

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
  const { piiPatterns } = getRules();
  const regexes = piiPatterns.map((pattern) => new RegExp(pattern));
  const hasPii = textTargets.some((text) => regexes.some((regex) => regex.test(text)));

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
  const issues: ValidationIssue[] = [];
  const { requestInfoConflictPhrases, forbiddenClaims } = getRules();
  const forbiddenClaim = findPhrase(extractTextTargets(output), forbiddenClaims);
  if (forbiddenClaim) {
    issues.push({
      validator: 'consistencyValidator',
      severity: 'WARN',
      message: `Potentially over-assertive phrase found: ${forbiddenClaim}`
    });
  }

  if (output.decision !== 'REQUEST_INFO') {
    return issues;
  }

  const texts = [output.fact_analysis, output.legal_review, output.action_plan];
  const conflictPhrase = findPhrase(texts, requestInfoConflictPhrases);
  if (conflictPhrase) {
    issues.push({
      validator: 'consistencyValidator',
      severity: 'FAIL',
      message: `REQUEST_INFO decision conflicts with phrase: ${conflictPhrase}`
    });
  }

  return issues;
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

function softenAndRedact(text: string): string {
  const { requestInfoConflictPhrases } = getRules();
  let softened = text;
  for (const phrase of requestInfoConflictPhrases) {
    softened = softened.replace(new RegExp(escapeRegExp(phrase), 'g'), '추가 검토가 필요합니다');
  }
  return redactPii(softened);
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function findPhrase(texts: string[], phrases: string[]): string | null {
  for (const text of texts) {
    for (const phrase of phrases) {
      if (text.includes(phrase)) {
        return phrase;
      }
    }
  }
  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function redactPii(text: string): string {
  const { piiPatterns } = getRules();
  let value = text;
  for (const pattern of piiPatterns) {
    value = value.replace(new RegExp(pattern, 'g'), '[REDACTED]');
  }
  return value;
}

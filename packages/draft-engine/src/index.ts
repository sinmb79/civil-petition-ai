import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { OpenAIClient, createOpenAIClientFromEnv } from '../../../integrations/openai/client';

export type LegalSource = {
  law_name: string;
  article_number: string;
  effective_date: string;
  source_link: string;
};

export type DraftInput = {
  petition_summary: string;
  facts?: string;
  legal_sources: LegalSource[];
  request_id?: string;
};

export type AuditRiskLevel = 'LOW' | 'MODERATE' | 'HIGH';
export type DraftDecision = 'APPROVE' | 'PARTIAL_APPROVE' | 'REJECT' | 'REQUEST_INFO';

export type DraftReply = {
  petition_summary: string;
  fact_analysis: string;
  legal_review: string;
  decision: DraftDecision;
  action_plan: string;
  legal_basis: LegalSource[];
  audit_risk: {
    level: AuditRiskLevel;
    findings: string[];
    recommendations: string[];
  };
};

export class DraftEngine {
  constructor(private readonly openAIClient?: OpenAIClient) {}

  async generateDraft(input: DraftInput): Promise<DraftReply> {
    if (!input.legal_sources || input.legal_sources.length === 0) {
      return buildInsufficientLegalBasisReply(input.petition_summary);
    }

    const serializedInput = JSON.stringify(input);
    const maxInputChars = resolveMaxInputChars();
    if (serializedInput.length > maxInputChars) {
      return buildInputTooLongFallback(input.petition_summary, serializedInput.length, maxInputChars);
    }

    const cacheKey = createInputHash(serializedInput);
    const cached = getCachedReply(cacheKey);
    if (cached) {
      return cached;
    }

    const schema = loadDraftReplySchema();
    const systemPrompt = [
      'You generate deterministic administrative draft replies.',
      'You must only use the provided legal sources.',
      'Return JSON only and satisfy the provided schema exactly.',
      'If legal basis is insufficient, set decision to REQUEST_INFO.'
    ].join(' ');
    const userPrompt = serializedInput;

    const client = this.openAIClient ?? createOpenAIClientFromEnv();
    const reply = await client.createStructuredOutput<DraftReply>({
      systemPrompt,
      userPrompt,
      schemaName: 'draft_reply',
      schema
    });

    if (!isDraftReply(reply)) {
      throw new Error('Structured output did not match DraftReply shape.');
    }

    setCachedReply(cacheKey, reply);

    return reply;
  }
}

export function buildInsufficientLegalBasisReply(petitionSummary: string): DraftReply {
  return {
    petition_summary: petitionSummary,
    fact_analysis: 'Insufficient facts and legal sources to complete analysis.',
    legal_review: 'Insufficient Legal Basis: legal_sources is empty.',
    decision: 'REQUEST_INFO',
    action_plan: 'Request additional legal grounds and supporting documents from the petitioner.',
    legal_basis: [],
    audit_risk: {
      level: 'MODERATE',
      findings: ['Legal basis is missing; decision cannot be finalized.'],
      recommendations: ['Collect applicable statutes, article numbers, and effective dates before re-review.']
    }
  };
}

export function loadDraftReplySchema(): Record<string, unknown> {
  const schemaPath = path.resolve(
    process.cwd(),
    'packages',
    'draft-engine',
    'schema',
    'draft_reply.schema.json'
  );
  const raw = fs.readFileSync(schemaPath, 'utf8');
  return JSON.parse(raw) as Record<string, unknown>;
}

type CacheEntry = {
  reply: DraftReply;
  expiresAt: number;
};

const OPENAI_RESULT_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export function __resetDraftEngineCacheForTests(): void {
  OPENAI_RESULT_CACHE.clear();
}

function createInputHash(serializedInput: string): string {
  return createHash('sha256').update(serializedInput).digest('hex');
}

function getCachedReply(hash: string): DraftReply | null {
  const entry = OPENAI_RESULT_CACHE.get(hash);
  if (!entry) {
    return null;
  }

  if (Date.now() >= entry.expiresAt) {
    OPENAI_RESULT_CACHE.delete(hash);
    return null;
  }

  return entry.reply;
}

function setCachedReply(hash: string, reply: DraftReply): void {
  OPENAI_RESULT_CACHE.set(hash, {
    reply,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

function resolveMaxInputChars(): number {
  const raw = Number(process.env.MAX_INPUT_CHARS ?? 8000);
  if (!Number.isFinite(raw) || raw <= 0) {
    return 8000;
  }

  return Math.floor(raw);
}

function buildInputTooLongFallback(
  petitionSummary: string,
  inputLength: number,
  maxInputChars: number
): DraftReply {
  return {
    petition_summary: petitionSummary,
    fact_analysis: 'Input payload is too large for safe model invocation.',
    legal_review: `Insufficient Legal Basis: input length ${inputLength} exceeds MAX_INPUT_CHARS ${maxInputChars}.`,
    decision: 'REQUEST_INFO',
    action_plan: 'Reduce request payload size and resubmit with focused facts and legal sources.',
    legal_basis: [],
    audit_risk: {
      level: 'MODERATE',
      findings: ['Payload size guardrail triggered before model call.'],
      recommendations: ['Trim long narrative fields and retry draft generation.']
    }
  };
}

export function isDraftReply(value: unknown): value is DraftReply {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as DraftReply;
  return (
    typeof candidate.petition_summary === 'string' &&
    typeof candidate.fact_analysis === 'string' &&
    typeof candidate.legal_review === 'string' &&
    typeof candidate.decision === 'string' &&
    ['APPROVE', 'PARTIAL_APPROVE', 'REJECT', 'REQUEST_INFO'].includes(candidate.decision) &&
    typeof candidate.action_plan === 'string' &&
    Array.isArray(candidate.legal_basis) &&
    candidate.legal_basis.every(isLegalSource) &&
    !!candidate.audit_risk &&
    ['LOW', 'MODERATE', 'HIGH'].includes(candidate.audit_risk.level) &&
    Array.isArray(candidate.audit_risk.findings) &&
    candidate.audit_risk.findings.every((item) => typeof item === 'string') &&
    Array.isArray(candidate.audit_risk.recommendations) &&
    candidate.audit_risk.recommendations.every((item) => typeof item === 'string')
  );
}

function isLegalSource(value: unknown): value is LegalSource {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const source = value as LegalSource;
  return (
    typeof source.law_name === 'string' &&
    typeof source.article_number === 'string' &&
    typeof source.effective_date === 'string' &&
    typeof source.source_link === 'string'
  );
}

import type { RiskLevel } from '@prisma/client';

export type LegalSource = {
  sourceType: 'STATUTE' | 'ORDINANCE' | 'PRECEDENT' | 'APPEAL' | 'BUDGET' | 'AUDIT';
  title: string;
  article: string;
  effectiveDate: string;
  sourceUrl: string;
  content: string;
};

export type Citation = {
  lawName: string;
  articleNumber: string;
  effectiveDate: string;
  sourceReferenceLink: string;
};

export type DraftReplyOutput = {
  petition_summary: string;
  fact_analysis: string;
  legal_review: string;
  decision: 'ACCEPT' | 'PARTIAL' | 'REJECT' | 'TRANSFER' | 'REQUEST_INFO';
  action_plan: string;
  legal_basis: Citation[];
  audit_risk: {
    level: RiskLevel;
    findings: string[];
    recommendations: string[];
  };
};

export type AuditEvaluation = {
  level: RiskLevel;
  scoreTotal: number;
  findings: Array<{ riskType: string; description: string; recommendation: string; severity: RiskLevel }>;
};

export interface LegalApiAdapter {
  retrieveForPetition(input: { petitionId: string; rawText: string }): Promise<LegalSource[]>;
}

export interface AppLogger {
  info(payload: Record<string, unknown>, msg?: string): void;
  error(payload: Record<string, unknown>, msg?: string): void;
}

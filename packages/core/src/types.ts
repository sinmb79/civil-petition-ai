export type Decision = 'ACCEPT' | 'PARTIAL' | 'REJECT' | 'TRANSFER' | 'REQUEST_INFO';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface LegalSource {
  title?: string;
  article?: string;
  effective_date?: string;
  source_url?: string;
}

export interface PetitionSummary {
  id: string;
  raw_text: string;
  processing_type: string;
  budget_related: boolean;
  discretionary: boolean;
}

export interface BudgetContext {
  available?: boolean;
  purpose_match?: boolean;
}

export interface AuditFinding {
  id: string;
  risk_type: string;
  description: string;
  recommendation: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AuditCase {
  source: string;
  title: string;
  reference: string;
  date: string;
  summary: string;
  tags: string[];
}

export interface AuditRiskInput {
  petition: PetitionSummary;
  decision: Decision;
  legal_sources: LegalSource[];
  procedural_steps_completed?: string[];
  budget_context?: BudgetContext;
  audit_cases?: AuditCase[];
}

export interface AuditRiskOutput {
  level: RiskLevel;
  findings: AuditFinding[];
  recommendations: string[];
  score_breakdown: {
    total: number;
    by_rule: Record<string, number>;
  };
}

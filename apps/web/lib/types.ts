export type ProcessingType = 'standard' | 'expedited';

export type Petition = {
  id: string;
  raw_text: string;
  processing_type: ProcessingType;
  budget_related: boolean;
  discretionary: boolean;
  created_at: string;
};

export type LegalBasisItem = {
  law_name: string;
  article_number: string;
  effective_date: string;
  source_link: string;
};

export type AuditRisk = {
  level: 'LOW' | 'MODERATE' | 'HIGH';
  score_breakdown: Record<string, number>;
  findings: string[];
  recommendations: string[];
};

export type DraftReply = {
  petition_id: string;
  petition_summary: string;
  fact_analysis: string;
  legal_review: string;
  decision: string;
  action_plan: string;
  legal_basis: LegalBasisItem[];
  audit_risk: AuditRisk;
  created_at: string;
};

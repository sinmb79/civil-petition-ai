export interface Citation {
  lawName: string;
  articleNumber: string;
  effectiveDate: string;
  sourceLink: string;
}

export interface PetitionInput {
  id: string;
  content: string;
}

export interface AuditRisk {
  level: 'LOW' | 'MODERATE' | 'HIGH';
  findings: string[];
  recommendations: string[];
}

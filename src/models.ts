export interface Petition {
  id: string;
  raw_text_masked: string;
  petition_summary: string;
  decision?: string;
  created_at: string;
  updated_at: string;
}

export interface DraftReply {
  id: string;
  petition_id: string;
  summary_text: string;
  decision: string;
  created_at: string;
  updated_at: string;
}

export interface AuditCase {
  id: string;
  title: string;
  description: string;
  findingType: string;
}

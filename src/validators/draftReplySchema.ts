import { z } from 'zod';

const citationSchema = z.object({
  lawName: z.string().min(1),
  articleNumber: z.string().min(1),
  effectiveDate: z.string().min(1),
  sourceReferenceLink: z.string().min(1),
});

export const draftReplySchema = z.object({
  petition_summary: z.string().min(1),
  fact_analysis: z.string().min(1),
  legal_review: z.string().min(1),
  decision: z.enum(['ACCEPT', 'PARTIAL', 'REJECT', 'TRANSFER', 'REQUEST_INFO']),
  action_plan: z.string().min(1),
  legal_basis: z.array(citationSchema),
  audit_risk: z.object({
    level: z.enum(['LOW', 'MODERATE', 'HIGH']),
    findings: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
});

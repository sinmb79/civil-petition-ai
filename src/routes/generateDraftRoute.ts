import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { LegalRetrievalEngine } from '../engines/legalRetrievalEngine.js';
import { DraftEngine } from '../engines/draftEngine.js';
import { AuditRiskEngine } from '../engines/auditRiskEngine.js';
import { validateCitations } from '../validators/citationValidator.js';
import { draftReplySchema } from '../validators/draftReplySchema.js';
import type { AppLogger, LegalApiAdapter } from '../types.js';

export async function registerGenerateDraftRoute(app: FastifyInstance, deps: { prisma: PrismaClient; legalAdapter: LegalApiAdapter; logger: AppLogger }) {
  const legalEngine = new LegalRetrievalEngine(deps.legalAdapter);
  const draftEngine = new DraftEngine();
  const auditRiskEngine = new AuditRiskEngine();

  app.post('/api/petitions/:id/generate-draft', async (request, reply) => {
    const { id } = request.params as { id: string };
    const requestId = randomUUID();

    const petition = await deps.prisma.petition.findUnique({ where: { id } });
    if (!petition) {
      return reply.code(404).send({ error: 'Petition not found' });
    }

    const sources = await legalEngine.retrieve(id, petition.rawText);
    const citationValidation = validateCitations(sources);
    if (!citationValidation.valid) {
      return reply.code(422).send({ error: 'Citation validation failed', details: citationValidation.errors });
    }

    const draftBase = draftEngine.generateDraft({ petitionText: petition.rawText, sources });
    const audit = auditRiskEngine.evaluate({
      sources,
      budgetRelated: petition.budgetRelated,
      discretionary: petition.discretionary,
    });

    const draftOutput = {
      ...draftBase,
      audit_risk: {
        level: audit.level,
        findings: audit.findings.map((f) => f.description),
        recommendations: audit.findings.map((f) => f.recommendation),
      },
    };

    const parsed = draftReplySchema.safeParse(draftOutput);
    if (!parsed.success) {
      const errorId = randomUUID();
      deps.logger.error({ request_id: requestId, petition_id: id, error_id: errorId }, 'Draft schema validation failed');
      return reply.code(500).send({ error: 'Internal server error', error_id: errorId });
    }

    const persistedDraft = await deps.prisma.draftReply.create({
      data: {
        petitionId: petition.id,
        petitionSummary: parsed.data.petition_summary,
        factAnalysis: parsed.data.fact_analysis,
        legalReview: parsed.data.legal_review,
        decision: parsed.data.decision,
        actionPlan: parsed.data.action_plan,
        auditRiskLevel: parsed.data.audit_risk.level,
        scoreTotal: audit.scoreTotal,
      },
    });

    if (audit.findings.length > 0) {
      await deps.prisma.auditFinding.createMany({
        data: audit.findings.map((finding) => ({
          petitionId: petition.id,
          draftReplyId: persistedDraft.id,
          riskType: finding.riskType,
          description: finding.description,
          recommendation: finding.recommendation,
          severity: finding.severity,
        })),
      });
    }

    deps.logger.info(
      {
        request_id: requestId,
        petition_id: petition.id,
        decision: parsed.data.decision,
        audit_risk_level: parsed.data.audit_risk.level,
        score_total: audit.scoreTotal,
        number_of_sources: sources.length,
      },
      'Draft generated',
    );

    return reply.send(parsed.data);
  });
}

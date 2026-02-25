import { Router } from 'express';
import { ZodError } from 'zod';
import { PetitionService } from '../petition/petitionService';
import { DraftEngine, LegalSource } from '../../packages/draft-engine/src';
import { AuditRiskEngine } from '../engines/auditRiskEngine';

export function createPetitionRouter(service: PetitionService): Router {
  const router = Router();
  const draftEngine = new DraftEngine();
  const auditRiskEngine = new AuditRiskEngine();

  router.post('/', async (req, res) => {
    try {
      const created = await service.create(req.body);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation failed', issues: error.issues });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const data = await service.list({
        limit: req.query.limit as string | undefined,
        offset: req.query.offset as string | undefined
      });
      res.json(data);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation failed', issues: error.issues });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.get('/:id', async (req, res) => {
    const petition = await service.getById(req.params.id);
    if (!petition) {
      return res.status(404).json({ message: 'Petition not found' });
    }
    return res.json(petition);
  });

  router.patch('/:id', async (req, res) => {
    try {
      const petition = await service.update(req.params.id, req.body);
      if (!petition) {
        return res.status(404).json({ message: 'Petition not found' });
      }
      return res.json(petition);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation failed', issues: error.issues });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.delete('/:id', async (req, res) => {
    const deleted = await service.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Petition not found' });
    }
    return res.status(204).send();
  });

  router.post('/:id/generate-draft', async (req, res) => {
    const petition = await service.getById(req.params.id);
    if (!petition) {
      return res.status(404).json({ message: 'Petition not found' });
    }

    const legalSources = collectLegalSources(petition.id);

    try {
      const draft = await draftEngine.generateDraft({
        petition_summary: petition.raw_text,
        facts: `processing_type=${petition.processing_type}, budget_related=${petition.budget_related}, discretionary=${petition.discretionary}`,
        legal_sources: legalSources,
        request_id: petition.id
      });

      const detectedRisks = buildDetectedRisks(petition);
      const audit = auditRiskEngine.evaluate({
        tenant_id: 'default-tenant',
        detected_risks: detectedRisks
      });

      return res.status(200).json({
        petition_id: petition.id,
        ...draft,
        audit_risk: {
          level: audit.level,
          findings: audit.explain.map((item) => item.reason),
          recommendations:
            draft.decision === 'REQUEST_INFO'
              ? ['Collect legal sources and supporting documents, then re-run draft generation.']
              : ['Proceed with documented review and approval workflow.']
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation failed', issues: error.issues });
      }
      return res.status(500).json({ message: 'Draft generation failed' });
    }
  });

  return router;
}

function collectLegalSources(_petitionId: string): LegalSource[] {
  // Placeholder for legal retrieval integration. Empty list triggers REQUEST_INFO fallback.
  return [];
}

function buildDetectedRisks(petition: {
  budget_related: boolean;
  discretionary: boolean;
}): Array<{ rule_id: string; risk_type: string; base_score: number }> {
  const risks: Array<{ rule_id: string; risk_type: string; base_score: number }> = [];

  if (petition.budget_related) {
    risks.push({
      rule_id: 'RULE_BUDGET_001',
      risk_type: 'BUDGET_MISUSE',
      base_score: 3
    });
  }

  if (petition.discretionary) {
    risks.push({
      rule_id: 'RULE_DISC_001',
      risk_type: 'ABUSE_OF_DISCRETION',
      base_score: 2
    });
  }

  return risks;
}

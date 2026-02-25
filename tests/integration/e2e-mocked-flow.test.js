import test from 'node:test';
import assert from 'node:assert/strict';

import { MockAuditEngine } from '../../packages/audit-engine/src/index.js';
import { validateCitations } from '../../packages/citation-validator/src/index.js';
import { DraftEngine, validateDraftReplySchema } from '../../packages/draft-engine/src/index.js';
import { MockLegalEngine } from '../../packages/legal-engine/src/index.js';
import { PetitionService } from '../../packages/petition-service/src/index.js';

test('mocked end-to-end flow', () => {
  const petitionService = new PetitionService();
  const legalEngine = new MockLegalEngine();
  const auditEngine = new MockAuditEngine();
  const draftEngine = new DraftEngine();

  const petition = petitionService.createPetition({
    id: 'P-001',
    title: 'Streetlight maintenance petition',
    content: 'Streetlights near exit 3 have been out for two weeks.'
  });

  const legalSources = legalEngine.retrieveRelevantSources();
  assert.ok(legalSources.length >= 1);
  assert.ok(legalSources.length <= 2);

  assert.doesNotThrow(() => validateCitations(legalSources));

  const auditRisk = auditEngine.evaluate();
  assert.equal(auditRisk.level, 'LOW');
  assert.deepEqual(auditRisk.findings, []);

  const draft = draftEngine.generateDraft({
    petition,
    legalSources,
    auditRisk
  });

  assert.equal(validateDraftReplySchema(draft), true);
  assert.equal(draft.legal_basis.length, 2);
  assert.equal(draft.legal_basis[0].title, 'Civil Petitions Act');
});

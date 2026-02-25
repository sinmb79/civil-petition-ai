import test from 'node:test';
import assert from 'node:assert/strict';
import { AuditRiskEngine } from '../src/engines/auditRiskEngine.js';
import { AuditFindingAggregate, TenantRiskProfile } from '../src/models/auditModels.js';

test('increases score when same tenant has repeated same risk_type', () => {
  const engine = new AuditRiskEngine({
    tenantRiskProfiles: [
      new TenantRiskProfile({
        tenant_id: 'tenant-a',
        risk_type: 'PROCEDURAL_OMISSION',
        base_weight: 1,
        escalation_factor: 1.5,
      }),
    ],
    aggregateStore: [
      new AuditFindingAggregate({
        tenant_id: 'tenant-a',
        risk_type: 'PROCEDURAL_OMISSION',
        count: 3,
        last_detected_at: '2026-02-01T00:00:00.000Z',
      }),
    ],
  });

  const result = engine.evaluate({
    tenant_id: 'tenant-a',
    now: new Date('2026-03-01T00:00:00.000Z'),
    detected_risks: [
      {
        rule_id: 'RULE_PROC_001',
        risk_type: 'PROCEDURAL_OMISSION',
        base_score: 3,
      },
    ],
  });

  assert.equal(result.score, 4.5);
  assert.equal(result.explain[0].base_score, 3);
  assert.equal(result.explain[0].adjusted_score, 4.5);
  assert.match(result.explain[0].reason, /escalation_factor applied/);
});

test('does not leak repeated-pattern impact across tenants', () => {
  const engine = new AuditRiskEngine({
    tenantRiskProfiles: [
      new TenantRiskProfile({
        tenant_id: 'tenant-a',
        risk_type: 'BUDGET_MISUSE',
        base_weight: 1,
        escalation_factor: 2,
      }),
      new TenantRiskProfile({
        tenant_id: 'tenant-b',
        risk_type: 'BUDGET_MISUSE',
        base_weight: 1,
        escalation_factor: 2,
      }),
    ],
    aggregateStore: [
      new AuditFindingAggregate({
        tenant_id: 'tenant-a',
        risk_type: 'BUDGET_MISUSE',
        count: 5,
        last_detected_at: '2026-03-01T00:00:00.000Z',
      }),
    ],
  });

  const tenantB = engine.evaluate({
    tenant_id: 'tenant-b',
    now: new Date('2026-03-15T00:00:00.000Z'),
    detected_risks: [
      {
        rule_id: 'RULE_BUDGET_001',
        risk_type: 'BUDGET_MISUSE',
        base_score: 3,
      },
    ],
  });

  assert.equal(tenantB.score, 3);
  assert.match(tenantB.explain[0].reason, /standard score/);
});

test('changes risk level after escalation_factor is applied', () => {
  const engine = new AuditRiskEngine({
    tenantRiskProfiles: [
      new TenantRiskProfile({
        tenant_id: 'tenant-a',
        risk_type: 'PREFERENTIAL_TREATMENT',
        base_weight: 1,
        escalation_factor: 2,
      }),
    ],
    aggregateStore: [
      new AuditFindingAggregate({
        tenant_id: 'tenant-a',
        risk_type: 'PREFERENTIAL_TREATMENT',
        count: 3,
        last_detected_at: '2026-01-01T00:00:00.000Z',
      }),
    ],
  });

  const escalated = engine.evaluate({
    tenant_id: 'tenant-a',
    now: new Date('2026-03-01T00:00:00.000Z'),
    detected_risks: [
      {
        rule_id: 'RULE_PREF_001',
        risk_type: 'PREFERENTIAL_TREATMENT',
        base_score: 5,
      },
    ],
  });

  const baseline = new AuditRiskEngine().evaluate({
    tenant_id: 'tenant-a',
    now: new Date('2026-03-01T00:00:00.000Z'),
    detected_risks: [
      {
        rule_id: 'RULE_PREF_001',
        risk_type: 'PREFERENTIAL_TREATMENT',
        base_score: 5,
      },
    ],
  });

  assert.equal(baseline.level, 'MODERATE');
  assert.equal(escalated.level, 'HIGH');
  assert.equal(escalated.score, 10);
});

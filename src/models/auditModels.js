export const RISK_LEVEL = {
  LOW: 'LOW',
  MODERATE: 'MODERATE',
  HIGH: 'HIGH',
};

export class TenantRiskProfile {
  constructor({ tenant_id, risk_type, base_weight = 1, escalation_factor = 1, updated_at = new Date().toISOString() }) {
    this.tenant_id = tenant_id;
    this.risk_type = risk_type;
    this.base_weight = base_weight;
    this.escalation_factor = escalation_factor;
    this.updated_at = updated_at;
  }
}

export class AuditFindingAggregate {
  constructor({ tenant_id, risk_type, count = 0, last_detected_at = null }) {
    this.tenant_id = tenant_id;
    this.risk_type = risk_type;
    this.count = count;
    this.last_detected_at = last_detected_at;
  }
}

export class AuditRiskExplain {
  constructor({ rule_id, base_score, adjusted_score, reason }) {
    this.rule_id = rule_id;
    this.base_score = base_score;
    this.adjusted_score = adjusted_score;
    this.reason = reason;
  }
}

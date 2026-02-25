import { AuditFindingAggregate, AuditRiskExplain, RISK_LEVEL } from '../models/auditModels.js';

const SIX_MONTHS_DAYS = 183;

function isWithinLastSixMonths(lastDetectedAt, now) {
  if (!lastDetectedAt) {
    return false;
  }

  const last = new Date(lastDetectedAt);
  const diffMs = now.getTime() - last.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= SIX_MONTHS_DAYS;
}

function resolveLevel(totalScore) {
  if (totalScore >= 8) {
    return RISK_LEVEL.HIGH;
  }

  if (totalScore >= 4) {
    return RISK_LEVEL.MODERATE;
  }

  return RISK_LEVEL.LOW;
}

export class AuditRiskEngine {
  constructor({ tenantRiskProfiles = [], aggregateStore = [] } = {}) {
    this.tenantRiskProfiles = tenantRiskProfiles;
    this.aggregateStore = aggregateStore;
  }

  findProfile(tenantId, riskType) {
    return this.tenantRiskProfiles.find(
      (profile) => profile.tenant_id === tenantId && profile.risk_type === riskType,
    );
  }

  findAggregate(tenantId, riskType) {
    return this.aggregateStore.find(
      (aggregate) => aggregate.tenant_id === tenantId && aggregate.risk_type === riskType,
    );
  }

  isRepeatedRisk(tenantId, riskType, now) {
    const aggregate = this.findAggregate(tenantId, riskType);
    if (!aggregate) {
      return false;
    }

    return aggregate.count >= 3 && isWithinLastSixMonths(aggregate.last_detected_at, now);
  }

  updateAggregates(tenantId, detectedRisks, now) {
    for (const risk of detectedRisks) {
      let aggregate = this.findAggregate(tenantId, risk.risk_type);

      if (!aggregate) {
        aggregate = new AuditFindingAggregate({
          tenant_id: tenantId,
          risk_type: risk.risk_type,
          count: 0,
          last_detected_at: null,
        });
        this.aggregateStore.push(aggregate);
      }

      aggregate.count += 1;
      aggregate.last_detected_at = now.toISOString();
    }
  }

  evaluate({ tenant_id, detected_risks, now = new Date() }) {
    const explain = [];
    let totalScore = 0;

    for (const risk of detected_risks) {
      const profile = this.findProfile(tenant_id, risk.risk_type);
      const baseWeight = profile?.base_weight ?? 1;
      const escalationFactor = profile?.escalation_factor ?? 1;
      const repeated = this.isRepeatedRisk(tenant_id, risk.risk_type, now);

      const weightedBaseScore = risk.base_score * baseWeight;
      const adjustedScore = repeated ? weightedBaseScore * escalationFactor : weightedBaseScore;

      totalScore += adjustedScore;

      explain.push(
        new AuditRiskExplain({
          rule_id: risk.rule_id,
          base_score: weightedBaseScore,
          adjusted_score: adjustedScore,
          reason: repeated
            ? `${risk.risk_type} repeated 3+ times in 6 months for tenant ${tenant_id}; escalation_factor applied`
            : `${risk.risk_type} standard score for tenant ${tenant_id}`,
        }),
      );
    }

    this.updateAggregates(tenant_id, detected_risks, now);

    return {
      level: resolveLevel(totalScore),
      score: totalScore,
      explain,
    };
  }
}

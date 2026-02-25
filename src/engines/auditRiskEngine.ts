export type AuditRiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

type TenantRiskProfile = {
  tenant_id: string;
  risk_type: string;
  base_weight?: number;
  escalation_factor?: number;
};

type AuditFindingAggregate = {
  tenant_id: string;
  risk_type: string;
  count: number;
  last_detected_at: string | null;
};

type DetectedRisk = {
  rule_id: string;
  risk_type: string;
  base_score: number;
};

type AuditRiskExplain = {
  rule_id: string;
  base_score: number;
  adjusted_score: number;
  reason: string;
};

const SIX_MONTHS_DAYS = 183;

function isWithinLastSixMonths(lastDetectedAt: string | null, now: Date): boolean {
  if (!lastDetectedAt) {
    return false;
  }

  const last = new Date(lastDetectedAt);
  const diffMs = now.getTime() - last.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= SIX_MONTHS_DAYS;
}

function resolveLevel(totalScore: number): AuditRiskLevel {
  if (totalScore >= 8) {
    return 'HIGH';
  }

  if (totalScore >= 4) {
    return 'MODERATE';
  }

  return 'LOW';
}

export class AuditRiskEngine {
  constructor(
    private readonly options: {
      tenantRiskProfiles?: TenantRiskProfile[];
      aggregateStore?: AuditFindingAggregate[];
    } = {}
  ) {
    this.options.tenantRiskProfiles = this.options.tenantRiskProfiles ?? [];
    this.options.aggregateStore = this.options.aggregateStore ?? [];
  }

  private findProfile(tenantId: string, riskType: string): TenantRiskProfile | undefined {
    return this.options.tenantRiskProfiles?.find(
      (profile) => profile.tenant_id === tenantId && profile.risk_type === riskType
    );
  }

  private findAggregate(tenantId: string, riskType: string): AuditFindingAggregate | undefined {
    return this.options.aggregateStore?.find(
      (aggregate) => aggregate.tenant_id === tenantId && aggregate.risk_type === riskType
    );
  }

  private isRepeatedRisk(tenantId: string, riskType: string, now: Date): boolean {
    const aggregate = this.findAggregate(tenantId, riskType);
    if (!aggregate) {
      return false;
    }

    return aggregate.count >= 3 && isWithinLastSixMonths(aggregate.last_detected_at, now);
  }

  private updateAggregates(tenantId: string, detectedRisks: DetectedRisk[], now: Date): void {
    for (const risk of detectedRisks) {
      let aggregate = this.findAggregate(tenantId, risk.risk_type);
      if (!aggregate) {
        aggregate = {
          tenant_id: tenantId,
          risk_type: risk.risk_type,
          count: 0,
          last_detected_at: null
        };
        this.options.aggregateStore?.push(aggregate);
      }

      aggregate.count += 1;
      aggregate.last_detected_at = now.toISOString();
    }
  }

  evaluate(input: {
    tenant_id: string;
    detected_risks: DetectedRisk[];
    now?: Date;
  }): { level: AuditRiskLevel; score: number; explain: AuditRiskExplain[] } {
    const now = input.now ?? new Date();
    const explain: AuditRiskExplain[] = [];
    let totalScore = 0;

    for (const risk of input.detected_risks) {
      const profile = this.findProfile(input.tenant_id, risk.risk_type);
      const baseWeight = profile?.base_weight ?? 1;
      const escalationFactor = profile?.escalation_factor ?? 1;
      const repeated = this.isRepeatedRisk(input.tenant_id, risk.risk_type, now);

      const weightedBaseScore = risk.base_score * baseWeight;
      const adjustedScore = repeated ? weightedBaseScore * escalationFactor : weightedBaseScore;
      totalScore += adjustedScore;

      explain.push({
        rule_id: risk.rule_id,
        base_score: weightedBaseScore,
        adjusted_score: adjustedScore,
        reason: repeated
          ? `${risk.risk_type} repeated 3+ times in 6 months for tenant ${input.tenant_id}; escalation_factor applied`
          : `${risk.risk_type} standard score for tenant ${input.tenant_id}`
      });
    }

    this.updateAggregates(input.tenant_id, input.detected_risks, now);

    return {
      level: resolveLevel(totalScore),
      score: totalScore,
      explain
    };
  }
}

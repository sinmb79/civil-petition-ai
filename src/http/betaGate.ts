type BetaGateResult =
  | { blocked: false }
  | { blocked: true; message: string };

export function checkBetaGate(now = new Date()): BetaGateResult {
  const enabled = String(process.env.BETA_MODE ?? 'false').toLowerCase() === 'true';
  if (!enabled) {
    return { blocked: false };
  }

  const endDateRaw = process.env.BETA_END_DATE;
  if (!endDateRaw) {
    return { blocked: false };
  }

  const endDate = new Date(endDateRaw);
  if (Number.isNaN(endDate.getTime())) {
    return { blocked: false };
  }

  if (now > endDate) {
    return {
      blocked: true,
      message: `Beta period ended at ${endDate.toISOString()}. Service is temporarily unavailable.`
    };
  }

  return { blocked: false };
}

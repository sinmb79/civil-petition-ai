export function getConfig() {
  return {
    betaMode: process.env.BETA_MODE === 'true',
    betaEndDate: process.env.BETA_END_DATE ? new Date(process.env.BETA_END_DATE) : null,
    captchaEnabled: process.env.CAPTCHA_ENABLED === 'true',
    rateLimitPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE || 60),
    draftTtlHours: Number(process.env.DRAFT_TTL_HOURS || 24),
    storeRawPetition: process.env.STORE_RAW_PETITION === 'true'
  };
}

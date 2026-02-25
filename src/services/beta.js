export function isBetaActive(config, now = new Date()) {
  return config.betaMode && config.betaEndDate instanceof Date && !Number.isNaN(config.betaEndDate) && now < config.betaEndDate;
}

export function isBetaEnded(config, now = new Date()) {
  return config.betaMode && config.betaEndDate instanceof Date && !Number.isNaN(config.betaEndDate) && now >= config.betaEndDate;
}

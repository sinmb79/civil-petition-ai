export const logger = {
  info(message, payload = {}) {
    console.info({ level: 'info', message, payload, timestamp: new Date().toISOString() });
  },
  warn(message, payload = {}) {
    console.warn({ level: 'warn', message, payload, timestamp: new Date().toISOString() });
  },
  error(message, payload = {}) {
    console.error({ level: 'error', message, payload, timestamp: new Date().toISOString() });
  }
};

export function maskPII(text) {
  return text
    .replace(/\b\d{2,3}-\d{3,4}-\d{4}\b/g, "[MASKED_PHONE]")
    .replace(/\b\d{6}-\d{7}\b/g, "[MASKED_RRN]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[MASKED_EMAIL]");
}

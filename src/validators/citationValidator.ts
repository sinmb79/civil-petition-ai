import type { LegalSource } from '../types.js';

export function validateCitations(sources: LegalSource[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  sources.forEach((source, index) => {
    if (!source.title) errors.push(`sources[${index}].title is required`);
    if (!source.article) errors.push(`sources[${index}].article is required`);
    if (!source.effectiveDate) errors.push(`sources[${index}].effectiveDate is required`);
    if (!source.sourceUrl) errors.push(`sources[${index}].sourceUrl is required`);
  });

  return { valid: errors.length === 0, errors };
}

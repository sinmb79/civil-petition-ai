import type { Citation } from '@civil/core';

export interface CitationValidationResult {
  isValid: boolean;
  missingFields: string[];
}

export function validateCitationCompleteness(citation: Citation): CitationValidationResult {
  // TODO: replace with schema-driven validation once citation contracts are finalized.
  const missingFields = ['lawName', 'articleNumber', 'effectiveDate', 'sourceLink'].filter(
    (field) => !citation[field as keyof Citation]
  );

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

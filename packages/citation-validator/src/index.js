export class CitationValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CitationValidationError';
  }
}

const isPresent = (value) => typeof value === 'string' && value.trim().length > 0;

export const validateCitations = (legalSources) => {
  if (!Array.isArray(legalSources) || legalSources.length === 0) {
    throw new CitationValidationError('At least one legal source is required.');
  }

  legalSources.forEach((source, index) => {
    if (!isPresent(source.title)) {
      throw new CitationValidationError(`legalSources[${index}] is missing title.`);
    }

    if (!isPresent(source.effective_date)) {
      throw new CitationValidationError(`legalSources[${index}] is missing effective_date.`);
    }

    if (!isPresent(source.source_url)) {
      throw new CitationValidationError(`legalSources[${index}] is missing source_url.`);
    }

    const hasArticle = isPresent(source.article);
    const hasReferenceNumber = isPresent(source.reference_number);

    if (source.type === 'STATUTE' && !hasArticle) {
      throw new CitationValidationError(`legalSources[${index}] requires article for STATUTE type.`);
    }

    if (!hasArticle && !hasReferenceNumber) {
      throw new CitationValidationError(
        `legalSources[${index}] is missing article or reference_number.`
      );
    }
  });
};

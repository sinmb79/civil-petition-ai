export function validateCitationCompleteness(citations) {
  return citations.flatMap((citation, index) => {
    const errors = [];
    if (!citation.law_name) errors.push(`legal_basis[${index}].law_name is missing`);
    if (!citation.article) errors.push(`legal_basis[${index}].article is missing`);
    if (!citation.effective_date) errors.push(`legal_basis[${index}].effective_date is missing`);
    if (!citation.source_link) errors.push(`legal_basis[${index}].source_link is missing`);
    return errors;
  });
}

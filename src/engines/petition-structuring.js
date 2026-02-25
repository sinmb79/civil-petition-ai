export function structurePetition(petition) {
  const compactText = petition.raw_text.replace(/\s+/g, " ").trim();
  const summary = compactText.slice(0, 120);
  const facts = `processing_type=${petition.processing_type}, budget_related=${petition.budget_related}, discretionary=${petition.discretionary}`;
  return { summary, facts };
}

export function formatCitations(sources) {
  return sources.map((source) => ({
    law_name: source.law_name,
    article: source.article,
    effective_date: source.effective_date,
    source_link: source.source_link
  }));
}

import {
  createAuditCase,
  createAuditCorpusDocument,
  findAuditCasesByQuery,
  findDocumentById
} from '../dataStore.js';

function splitCaseSegments(rawText) {
  const segments = rawText
    .split(/\n\s*\n/g)
    .map((segment) => segment.trim())
    .filter(Boolean);
  return segments.length === 0 ? [rawText.trim()] : segments;
}

function makeReference(sourceOrg, publishedDate) {
  return publishedDate
    ? `${sourceOrg} 감사사례 (${publishedDate})`
    : `${sourceOrg} 감사사례`;
}

export function registerAuditCorpusDocument(input) {
  const document = createAuditCorpusDocument(input);
  const segments = splitCaseSegments(input.raw_text);

  const cases = segments.map((summary, index) =>
    createAuditCase({
      document_id: document.id,
      title: `${document.title} #${index + 1}`,
      reference: makeReference(document.source_org, document.published_date),
      date: document.published_date,
      summary,
      tags: document.tags
    })
  );

  return { document, cases };
}

export function searchAuditCorpusCases(query, limit = 10) {
  const matched = findAuditCasesByQuery(query, limit);
  return matched.map((item) => {
    const document = findDocumentById(item.document_id);
    return {
      ...item,
      source: {
        document_id: item.document_id,
        title: document?.title ?? null,
        source_org: document?.source_org ?? null,
        published_date: document?.published_date ?? null
      }
    };
  });
}

import {
  registerAuditCorpusDocument,
  searchAuditCorpusCases
} from '../services/auditCorpusService.js';

export function postAuditCorpusDocument(body) {
  const { title, source_org, published_date, raw_text, tags } = body ?? {};
  if (!title || !source_org || !raw_text || !Array.isArray(tags)) {
    return {
      status: 400,
      body: { message: 'title, source_org, raw_text, tags are required.' }
    };
  }

  const { document, cases } = registerAuditCorpusDocument({
    title,
    source_org,
    published_date: published_date ?? null,
    raw_text,
    tags
  });

  return {
    status: 201,
    body: {
      id: document.id,
      title: document.title,
      source_org: document.source_org,
      created_cases: cases.length
    }
  };
}

export function getAuditCorpusSearch(query) {
  const q = String(query?.q ?? '').trim();
  const limit = Number(query?.limit ?? 10);
  if (!q) {
    return {
      status: 400,
      body: { message: 'q query parameter is required.' }
    };
  }

  return {
    status: 200,
    body: searchAuditCorpusCases(q, Number.isFinite(limit) ? limit : 10)
  };
}

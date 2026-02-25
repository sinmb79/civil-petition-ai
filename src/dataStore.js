let documentSeq = 1;
let caseSeq = 1;

const auditCorpusDocuments = [];
const auditCases = [];

export function resetStore() {
  documentSeq = 1;
  caseSeq = 1;
  auditCorpusDocuments.length = 0;
  auditCases.length = 0;
}

export function createAuditCorpusDocument(data) {
  const now = new Date().toISOString();
  const document = {
    id: `doc_${documentSeq++}`,
    title: data.title,
    source_org: data.source_org,
    published_date: data.published_date ?? null,
    raw_text: data.raw_text,
    tags: data.tags,
    created_at: now,
    updated_at: now
  };
  auditCorpusDocuments.push(document);
  return document;
}

export function createAuditCase(data) {
  const now = new Date().toISOString();
  const auditCase = {
    id: `case_${caseSeq++}`,
    document_id: data.document_id,
    title: data.title,
    reference: data.reference,
    date: data.date ?? null,
    summary: data.summary,
    tags: data.tags,
    created_at: now,
    updated_at: now
  };
  auditCases.push(auditCase);
  return auditCase;
}

export function findAuditCasesByQuery(query, limit = 10) {
  const q = query.toLowerCase();
  return auditCases
    .filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

export function findDocumentById(id) {
  return auditCorpusDocuments.find((item) => item.id === id) ?? null;
}

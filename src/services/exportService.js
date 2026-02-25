const TEMPLATE_MAP = { A: 'TEMPLATE_A', B: 'TEMPLATE_B' };

function decisionToLabel(decision) {
  return ['수용', '부분수용', '불수용', '이송', '추가요구'].includes(decision) ? decision : decision;
}

function legalBasisToLines(legalBasis) {
  return legalBasis.map(
    (basis, index) =>
      `${index + 1}. ${basis.law_name} ${basis.article_number} (시행일: ${basis.effective_date}, 링크: ${basis.source_link})`
  );
}

export function buildExportPayload(draft, template) {
  const payload = {
    templateCode: TEMPLATE_MAP[template],
    petitionSummary: draft.petition_summary,
    factAndLegalReview: `${draft.fact_analysis}\n\n${draft.legal_review}`,
    decision: decisionToLabel(draft.decision),
    actionPlan: draft.action_plan,
    legalBasisLines: legalBasisToLines(draft.legal_basis)
  };
  if (template === 'B') payload.auditRisk = draft.audit_risk;
  return payload;
}

function crc32(buffer) {
  let crc = ~0;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let k = 0; k < 8; k += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function createZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name);
    const dataBuf = Buffer.from(entry.data);
    const compressed = dataBuf;
    const crc = crc32(dataBuf);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(dataBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const local = Buffer.concat([localHeader, nameBuf, compressed]);
    localParts.push(local);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(dataBuf.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);

    centralParts.push(Buffer.concat([central, nameBuf]));
    offset += local.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, end]);
}

function esc(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function generateDocxBuffer(payload) {
  const lines = [
    `${payload.templateCode} 문서`,
    '민원요지',
    payload.petitionSummary,
    '사실관계/법적검토',
    payload.factAndLegalReview,
    '처리결과',
    payload.decision,
    '조치계획',
    payload.actionPlan,
    '근거 목록',
    ...payload.legalBasisLines
  ];

  if (payload.auditRisk) {
    lines.push('감사 리스크');
    lines.push(`레벨: ${payload.auditRisk.level}`);
    lines.push(`핵심 지적: ${payload.auditRisk.findings.join(', ') || '없음'}`);
    lines.push(`보완 권고: ${payload.auditRisk.recommendations.join(', ') || '없음'}`);
  }

  const docBody = lines
    .map((line) => `<w:p><w:r><w:t xml:space="preserve">${esc(line)}</w:t></w:r></w:p>`)
    .join('');

  const files = [
    {
      name: '[Content_Types].xml',
      data: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
    },
    {
      name: '_rels/.rels',
      data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`
    },
    {
      name: 'word/document.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${docBody}</w:body></w:document>`
    }
  ];

  return createZip(files);
}

export function generatePdfBuffer(payload) {
  const text = [
    `${payload.templateCode} 문서`,
    '민원요지',
    payload.petitionSummary,
    '사실관계/법적검토',
    payload.factAndLegalReview,
    '처리결과',
    payload.decision,
    '조치계획',
    payload.actionPlan,
    '근거 목록',
    ...payload.legalBasisLines
  ];

  if (payload.auditRisk) {
    text.push('감사 리스크');
    text.push(`레벨: ${payload.auditRisk.level}`);
    text.push(`핵심 지적: ${payload.auditRisk.findings.join(', ') || '없음'}`);
    text.push(`보완 권고: ${payload.auditRisk.recommendations.join(', ') || '없음'}`);
  }

  // Minimal synthetic PDF-like payload for export/download workflow
  return Buffer.from(`%PDF-1.4\n${text.join('\n')}\n%%EOF`, 'utf8');
}

export function makeExportFilename(draft, extension, now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${draft.tenant_code}_${draft.petition_id}_${draft.id}_${y}${m}${d}.${extension}`;
}

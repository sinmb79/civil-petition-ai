import { findDraftById } from './data/store.js';
import {
  buildExportPayload,
  generateDocxBuffer,
  generatePdfBuffer,
  makeExportFilename
} from './services/exportService.js';

const STAFF_OR_HIGHER = new Set(['STAFF', 'MANAGER', 'ADMIN']);

function json(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': body.length });
  res.end(body);
}

export async function requestListener(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const match = req.method === 'GET' && url.pathname.match(/^\/api\/drafts\/([^/]+)\/export$/);

  if (!match) {
    return json(res, 404, { message: 'not found' });
  }

  const draftId = match[1];
  const format = url.searchParams.get('format');
  const template = url.searchParams.get('template');

  if (!['docx', 'pdf'].includes(format)) {
    return json(res, 400, { message: 'format must be docx or pdf' });
  }
  if (!['A', 'B'].includes(template)) {
    return json(res, 400, { message: 'template must be A or B' });
  }

  const role = req.headers['x-user-role'] ?? 'VIEWER';
  const tenantId = req.headers['x-tenant-id'];

  if (!STAFF_OR_HIGHER.has(role)) {
    return json(res, 403, { message: 'export forbidden for role' });
  }

  const draft = findDraftById(draftId);
  if (!draft) return json(res, 404, { message: 'draft not found' });
  if (!tenantId || draft.tenant_id !== tenantId) return json(res, 404, { message: 'draft not found' });

  const payload = buildExportPayload(draft, template);
  const buffer = format === 'docx' ? generateDocxBuffer(payload) : generatePdfBuffer(payload);
  const contentType =
    format === 'docx'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf';
  const filename = makeExportFilename(draft, format);

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': buffer.length
  });
  res.end(buffer);
}

export function createApp() {
  return requestListener;
}

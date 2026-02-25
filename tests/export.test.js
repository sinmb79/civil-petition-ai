import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../src/app.js';

async function withServer(run) {
  const server = createServer(createApp());
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('DOCX export returns 200, mime, filename, and keyword payload', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/drafts/draft-001/export?format=docx&template=A`, {
      headers: { 'x-user-role': 'STAFF', 'x-tenant-id': 'tenant-1' }
    });

    assert.equal(res.status, 200);
    assert.match(
      res.headers.get('content-type'),
      /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/
    );
    assert.match(
      res.headers.get('content-disposition'),
      /^attachment; filename="TN01_petition-100_draft-001_\d{8}\.docx"$/
    );

    const text = Buffer.from(await res.arrayBuffer()).toString('utf8');
    assert.match(text, /word\/document\.xml/);
    assert.match(text, /민원요지/);
    assert.match(text, /부분수용/);
  });
});

test('PDF export returns 200, mime, filename, and keyword payload', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/drafts/draft-001/export?format=pdf&template=B`, {
      headers: { 'x-user-role': 'STAFF', 'x-tenant-id': 'tenant-1' }
    });

    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /application\/pdf/);
    assert.match(
      res.headers.get('content-disposition'),
      /^attachment; filename="TN01_petition-100_draft-001_\d{8}\.pdf"$/
    );

    const text = Buffer.from(await res.arrayBuffer()).toString('utf8');
    assert.match(text, /TEMPLATE_B/);
    assert.match(text, /감사 리스크/);
    assert.match(text, /MODERATE/);
  });
});

test('VIEWER cannot export', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/drafts/draft-001/export?format=docx&template=A`, {
      headers: { 'x-user-role': 'VIEWER', 'x-tenant-id': 'tenant-1' }
    });
    assert.equal(res.status, 403);
  });
});

test('other tenant cannot access draft export', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/drafts/draft-002/export?format=docx&template=A`, {
      headers: { 'x-user-role': 'STAFF', 'x-tenant-id': 'tenant-1' }
    });
    assert.ok([403, 404].includes(res.status));
  });
});

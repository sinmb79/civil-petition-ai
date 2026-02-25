import express from 'express';
import { RoleName } from '@prisma/client';
import { headerAuth, requireRole } from './auth.js';
import { prisma } from './prisma.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(headerAuth);

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/petitions/:id', requireRole(RoleName.ADMIN, RoleName.MANAGER, RoleName.STAFF, RoleName.VIEWER), async (req, res) => {
    const petition = await prisma.petition.findFirst({
      where: { id: req.params.id, tenantId: req.auth!.tenantId },
    });

    if (!petition) {
      return res.status(404).json({ message: 'Not found' });
    }

    return res.json(petition);
  });

  app.post('/petitions', requireRole(RoleName.ADMIN, RoleName.MANAGER, RoleName.STAFF), async (req, res) => {
    const { title, content } = req.body as { title?: string; content?: string };
    if (!title || !content) {
      return res.status(400).json({ message: 'title and content are required' });
    }

    const petition = await prisma.petition.create({
      data: {
        title,
        content,
        tenantId: req.auth!.tenantId,
      },
    });

    return res.status(201).json(petition);
  });

  app.delete('/petitions/:id', requireRole(RoleName.ADMIN), async (req, res) => {
    const petition = await prisma.petition.findFirst({
      where: { id: req.params.id, tenantId: req.auth!.tenantId },
    });

    if (!petition) {
      return res.status(404).json({ message: 'Not found' });
    }

    await prisma.petition.delete({ where: { id: petition.id } });
    return res.status(204).send();
  });

  app.post('/audit-corpus-documents', requireRole(RoleName.ADMIN, RoleName.MANAGER), async (req, res) => {
    const { title, body } = req.body as { title?: string; body?: string };
    if (!title || !body) {
      return res.status(400).json({ message: 'title and body are required' });
    }

    const doc = await prisma.auditCorpusDocument.create({
      data: {
        title,
        body,
        tenantId: req.auth!.tenantId,
      },
    });

    return res.status(201).json(doc);
  });

  return app;
}

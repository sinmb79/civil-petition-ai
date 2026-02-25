import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { Petition, ProcessingType } from '../../../lib/types';

function makeRequestId() {
  return `req_${Math.random().toString(36).slice(2, 10)}`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ items: db.petitions });
  }

  if (req.method === 'POST') {
    const request_id = makeRequestId();
    const { raw_text, processing_type, budget_related, discretionary } = req.body ?? {};

    if (!raw_text || typeof raw_text !== 'string') {
      return res.status(400).json({
        error: 'raw_text is required',
        request_id
      });
    }

    const type = processing_type as ProcessingType;
    if (!['standard', 'expedited'].includes(type)) {
      return res.status(400).json({ error: 'Invalid processing_type', request_id });
    }

    const petition: Petition = {
      id: crypto.randomUUID(),
      raw_text,
      processing_type: type,
      budget_related: Boolean(budget_related),
      discretionary: Boolean(discretionary),
      created_at: new Date().toISOString()
    };

    db.petitions.unshift(petition);
    return res.status(201).json(petition);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

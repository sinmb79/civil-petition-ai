import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../lib/db';

function makeRequestId() {
  return `req_${Math.random().toString(36).slice(2, 10)}`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const request_id = makeRequestId();
  const id = req.query.id;
  const petition = db.petitions.find((item) => item.id === id);
  if (!petition) {
    return res.status(404).json({ error: 'Petition not found', request_id });
  }

  return res.status(200).json({ petition, draft: db.drafts[petition.id] ?? null });
}

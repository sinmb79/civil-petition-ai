import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';

export function assignRequestId(req: Request): string {
  const fromHeader = req.header('X-REQUEST-ID');
  const requestId = fromHeader && fromHeader.trim().length > 0 ? fromHeader : randomUUID();
  req.request_id = requestId;
  return requestId;
}

export function getRequestId(req: Request): string {
  return req.request_id ?? assignRequestId(req);
}

export function jsonError(res: Response, req: Request, status: number, message: string): Response {
  return res.status(status).json({
    error_id: randomUUID(),
    request_id: getRequestId(req),
    message
  });
}

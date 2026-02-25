import { RoleName } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from './prisma.js';

export type AuthContext = {
  userId: string;
  tenantId: string;
  tenantCode: string;
  roles: RoleName[];
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export async function headerAuth(req: Request, res: Response, next: NextFunction) {
  const email = req.header('X-USER-EMAIL');
  const tenantCode = req.header('X-TENANT-CODE');

  if (!email || !tenantCode) {
    return res.status(401).json({ message: 'Missing authentication headers' });
  }

  const tenant = await prisma.tenant.findUnique({ where: { code: tenantCode } });
  if (!tenant) {
    return res.status(401).json({ message: 'Invalid tenant' });
  }

  const user = await prisma.user.findFirst({
    where: { email, tenantId: tenant.id },
    include: { roles: { include: { role: true } } },
  });

  if (!user) {
    return res.status(401).json({ message: 'Invalid user for tenant' });
  }

  req.auth = {
    userId: user.id,
    tenantId: tenant.id,
    tenantCode: tenant.code,
    roles: user.roles.map((ur) => ur.role.name),
  };

  return next();
}

export function requireRole(...allowedRoles: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const hasRole = req.auth.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
}

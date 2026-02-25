import { PrismaClient } from '../generated/prisma';

export function createPrismaClient() {
  return new PrismaClient();
}

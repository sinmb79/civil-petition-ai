import { PrismaClient } from '../src/generated/prisma';
import { GenerationJobRepository } from '../src/repository/generationJobRepository';

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const jobs = new GenerationJobRepository(prisma as any);
    const result = await jobs.cleanupExpired(new Date());
    console.info(
      JSON.stringify({
        event: 'generation_jobs.cleanup',
        deleted_count: result.count,
        timestamp: new Date().toISOString()
      })
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: 'generation_jobs.cleanup.error',
      message: String(error?.message ?? error),
      timestamp: new Date().toISOString()
    })
  );
  process.exit(1);
});

export type GenerationJobStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED';

export type GenerationJob = {
  id: string;
  status: GenerationJobStatus;
  input_masked_json: string;
  result_json: string | null;
  error: string | null;
  created_at: Date;
  updated_at: Date;
  expires_at: Date | null;
};

type PrismaClientLike = {
  generationJob: {
    create: (args: {
      data: {
        status: GenerationJobStatus;
        input_masked_json: string;
        expires_at: Date | null;
      };
    }) => Promise<GenerationJob>;
    findUnique: (args: { where: { id: string } }) => Promise<GenerationJob | null>;
    findFirst: (args: {
      where: { status: GenerationJobStatus };
      orderBy: { created_at: 'asc' | 'desc' };
    }) => Promise<GenerationJob | null>;
    update: (args: {
      where: { id: string };
      data: Partial<Pick<GenerationJob, 'status' | 'result_json' | 'error'>>;
    }) => Promise<GenerationJob>;
    updateMany: (args: {
      where: { id: string; status?: GenerationJobStatus };
      data: Partial<Pick<GenerationJob, 'status'>>;
    }) => Promise<{ count: number }>;
    deleteMany: (args: { where: { expires_at: { lt: Date } } }) => Promise<{ count: number }>;
  };
  $transaction: <T>(fn: (tx: PrismaClientLike) => Promise<T>) => Promise<T>;
};

export class GenerationJobRepository {
  constructor(private readonly prisma: PrismaClientLike) {}

  createQueued(inputMaskedJson: string, ttlHours: number): Promise<GenerationJob> {
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    return this.prisma.generationJob.create({
      data: {
        status: 'QUEUED',
        input_masked_json: inputMaskedJson,
        expires_at: expiresAt
      }
    });
  }

  getById(id: string): Promise<GenerationJob | null> {
    return this.prisma.generationJob.findUnique({ where: { id } });
  }

  async claimQueued(): Promise<GenerationJob | null> {
    return this.prisma.$transaction(async (tx) => {
      const candidate = await tx.generationJob.findFirst({
        where: { status: 'QUEUED' },
        orderBy: { created_at: 'asc' }
      });

      if (!candidate) {
        return null;
      }

      const updated = await tx.generationJob.updateMany({
        where: { id: candidate.id, status: 'QUEUED' },
        data: { status: 'RUNNING' }
      });
      if (updated.count === 0) {
        return null;
      }

      return tx.generationJob.findUnique({ where: { id: candidate.id } });
    });
  }

  complete(jobId: string, payload: { result_json?: string; error?: string }): Promise<GenerationJob> {
    const isFailed = !!payload.error;
    return this.prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: isFailed ? 'FAILED' : 'DONE',
        result_json: payload.result_json ?? null,
        error: payload.error ?? null
      }
    });
  }

  cleanupExpired(now = new Date()): Promise<{ count: number }> {
    return this.prisma.generationJob.deleteMany({
      where: { expires_at: { lt: now } }
    });
  }
}

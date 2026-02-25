import type { PetitionRepository, PetitionCreateInput, PetitionListOptions, PetitionListResult, PetitionUpdateInput } from './petitionRepository';

type PrismaClientLike = {
  petition: {
    create: (args: { data: Required<PetitionCreateInput> }) => Promise<any>;
    findMany: (args: { orderBy: { created_at: 'desc' | 'asc' }; skip: number; take: number }) => Promise<any[]>;
    findUnique: (args: { where: { id: string } }) => Promise<any | null>;
    update: (args: { where: { id: string }; data: PetitionUpdateInput }) => Promise<any>;
    delete: (args: { where: { id: string } }) => Promise<any>;
  };
};

export class PrismaPetitionRepository implements PetitionRepository {
  constructor(private readonly prisma: PrismaClientLike) {}

  async create(data: Required<PetitionCreateInput>) {
    return this.prisma.petition.create({ data });
  }

  async list(options: PetitionListOptions): Promise<PetitionListResult> {
    const rows = await this.prisma.petition.findMany({
      orderBy: { created_at: 'desc' },
      skip: options.offset,
      take: options.limit + 1
    });

    const hasNext = rows.length > options.limit;
    const items = hasNext ? rows.slice(0, options.limit) : rows;

    return {
      items,
      nextOffset: hasNext ? options.offset + options.limit : null
    };
  }

  async findById(id: string) {
    return this.prisma.petition.findUnique({ where: { id } });
  }

  async update(id: string, data: PetitionUpdateInput) {
    try {
      return await this.prisma.petition.update({ where: { id }, data });
    } catch {
      return null;
    }
  }

  async delete(id: string) {
    try {
      await this.prisma.petition.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

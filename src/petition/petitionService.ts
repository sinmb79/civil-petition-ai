import { z } from 'zod';
import type { PetitionCreateInput, PetitionRepository, PetitionUpdateInput } from '../repository/petitionRepository';

const createSchema = z.object({
  raw_text: z.string().min(10),
  processing_type: z.string().min(1),
  budget_related: z.boolean().optional().default(false),
  discretionary: z.boolean().optional().default(false)
});

const updateSchema = z
  .object({
    raw_text: z.string().min(10).optional(),
    processing_type: z.string().min(1).optional(),
    budget_related: z.boolean().optional(),
    discretionary: z.boolean().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field must be provided.'
  });

const listSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export class PetitionService {
  constructor(private readonly repository: PetitionRepository) {}

  create(input: PetitionCreateInput) {
    const data = createSchema.parse(input);
    return this.repository.create(data);
  }

  list(input: { limit?: number | string; offset?: number | string }) {
    const options = listSchema.parse(input);
    return this.repository.list(options);
  }

  getById(id: string) {
    return this.repository.findById(id);
  }

  update(id: string, input: PetitionUpdateInput) {
    const data = updateSchema.parse(input);
    return this.repository.update(id, data);
  }

  delete(id: string) {
    return this.repository.delete(id);
  }
}

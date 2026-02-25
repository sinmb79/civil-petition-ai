import { PetitionService } from '../../src/petition/petitionService';
import type { PetitionRepository } from '../../src/repository/petitionRepository';

const now = new Date('2026-01-01T00:00:00.000Z');

function createRepositoryMock(): jest.Mocked<PetitionRepository> {
  return {
    create: jest.fn(),
    list: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };
}

describe('PetitionService', () => {
  it('creates petition with defaults', async () => {
    const repo = createRepositoryMock();
    const service = new PetitionService(repo);

    repo.create.mockResolvedValue({
      id: '1',
      raw_text: 'valid petition text',
      processing_type: 'GENERAL',
      budget_related: false,
      discretionary: false,
      created_at: now,
      updated_at: now
    });

    await service.create({ raw_text: 'valid petition text', processing_type: 'GENERAL' });

    expect(repo.create).toHaveBeenCalledWith({
      raw_text: 'valid petition text',
      processing_type: 'GENERAL',
      budget_related: false,
      discretionary: false
    });
  });

  it('rejects invalid create payload', async () => {
    const service = new PetitionService(createRepositoryMock());

    await expect(service.create({ raw_text: 'short', processing_type: '' })).rejects.toThrow();
  });

  it('reads petition by id', async () => {
    const repo = createRepositoryMock();
    const service = new PetitionService(repo);
    repo.findById.mockResolvedValue(null);

    await service.getById('missing-id');

    expect(repo.findById).toHaveBeenCalledWith('missing-id');
  });

  it('updates petition partially', async () => {
    const repo = createRepositoryMock();
    const service = new PetitionService(repo);
    repo.update.mockResolvedValue(null);

    await service.update('id-1', { processing_type: 'URGENT' });

    expect(repo.update).toHaveBeenCalledWith('id-1', { processing_type: 'URGENT' });
  });

  it('deletes petition', async () => {
    const repo = createRepositoryMock();
    const service = new PetitionService(repo);
    repo.delete.mockResolvedValue(true);

    const deleted = await service.delete('id-1');

    expect(repo.delete).toHaveBeenCalledWith('id-1');
    expect(deleted).toBe(true);
  });
});

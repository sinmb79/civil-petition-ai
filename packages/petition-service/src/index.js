export class PetitionService {
  createPetition(input) {
    const timestamp = '2025-01-01T00:00:00.000Z';

    return {
      id: input.id,
      title: input.title,
      content: input.content,
      created_at: timestamp,
      updated_at: timestamp
    };
  }
}

export class InMemoryPetitionRepository {
  constructor() {
    this.store = new Map();
  }

  async create(data) {
    const id = `pet_${this.store.size + 1}`;
    const record = { id, ...data };
    this.store.set(id, record);
    return record;
  }

  async findById(id) {
    return this.store.get(id) ?? null;
  }

  async update(id, data) {
    const prev = this.store.get(id);
    if (!prev) throw new Error('petition not found');
    const next = { ...prev, ...data };
    this.store.set(id, next);
    return next;
  }

  async delete(id) {
    this.store.delete(id);
  }
}

export class InMemoryAuditLogRepository {
  constructor() {
    this.logs = [];
  }

  async create(data) {
    const record = {
      id: `log_${this.logs.length + 1}`,
      created_at: new Date(),
      ...data
    };
    this.logs.push(record);
    return record;
  }

  async list() {
    return [...this.logs];
  }
}

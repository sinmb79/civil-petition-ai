import { DraftReply, Petition } from './types';

type DB = {
  petitions: Petition[];
  drafts: Record<string, DraftReply>;
};

const globalForDB = globalThis as unknown as { __petitionDb?: DB };

export const db: DB =
  globalForDB.__petitionDb ?? {
    petitions: [],
    drafts: {}
  };

if (!globalForDB.__petitionDb) {
  globalForDB.__petitionDb = db;
}

export interface CacheRecord<T> {
  value: T;
  effectiveDate?: string;
  fetchedAt: string;
}

export interface ILegalCache {
  get<T>(key: string): Promise<CacheRecord<T> | null>;
  set<T>(key: string, record: CacheRecord<T>, ttlSeconds: number): Promise<void>;
}

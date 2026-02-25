import { RateLimitError } from './errors.js';

export interface IRateLimiter {
  consume(bucket?: string): void;
}

export class SlidingWindowRateLimiter implements IRateLimiter {
  private readonly events = new Map<string, number[]>();

  constructor(
    private readonly limitPerMinute: number,
    private readonly now: () => number = () => Date.now(),
  ) {}

  consume(bucket = 'default'): void {
    const current = this.now();
    const windowStart = current - 60_000;
    const prev = this.events.get(bucket) ?? [];
    const filtered = prev.filter((ts) => ts >= windowStart);

    if (filtered.length >= this.limitPerMinute) {
      throw new RateLimitError();
    }

    filtered.push(current);
    this.events.set(bucket, filtered);
  }
}

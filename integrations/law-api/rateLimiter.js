import { RateLimitError } from './errors.js';

export class SlidingWindowRateLimiter {
  constructor(limitPerMinute, now = () => Date.now()) {
    this.limitPerMinute = limitPerMinute;
    this.now = now;
    this.events = new Map();
  }

  consume(bucket = 'default') {
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

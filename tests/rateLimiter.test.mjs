import test from 'node:test';
import assert from 'node:assert/strict';
import { SlidingWindowRateLimiter } from '../integrations/law-api/rateLimiter.js';
import { RateLimitError } from '../integrations/law-api/errors.js';

test('sliding window limiter throws when exceeded', () => {
  let now = 1000;
  const limiter = new SlidingWindowRateLimiter(2, () => now);
  limiter.consume('search');
  now += 100;
  limiter.consume('search');
  now += 100;
  assert.throws(() => limiter.consume('search'), RateLimitError);
});

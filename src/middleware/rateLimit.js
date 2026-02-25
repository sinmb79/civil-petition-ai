export function createIpRateLimiter(limitPerMinute) {
  const bucket = new Map();

  return function ipRateLimit(req, res, next) {
    const now = Date.now();
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const entry = bucket.get(ip) || { count: 0, windowStart: now };

    if (now - entry.windowStart >= 60_000) {
      entry.count = 0;
      entry.windowStart = now;
    }

    entry.count += 1;
    bucket.set(ip, entry);

    if (entry.count > limitPerMinute) {
      return res.status(429).json({ message: 'Rate limit exceeded' });
    }

    next();
  };
}

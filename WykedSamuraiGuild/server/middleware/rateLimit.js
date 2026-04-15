const buckets = new Map();

function nowMs() {
  return Date.now();
}

function buildKey(req, keyPrefix) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  return `${keyPrefix}:${ip}`;
}

export function createRateLimiter({
  keyPrefix,
  limit,
  windowMs,
  message,
}) {
  return function rateLimiter(req, res, next) {
    const key = buildKey(req, keyPrefix);
    const windowStart = nowMs() - windowMs;
    const recent = (buckets.get(key) || []).filter((entryTs) => entryTs > windowStart);

    if (recent.length >= limit) {
      return res.status(429).json({
        error: message || 'Too many requests. Please try again shortly.',
        retryAfterSeconds: Math.ceil(windowMs / 1000),
      });
    }

    recent.push(nowMs());
    buckets.set(key, recent);
    return next();
  };
}

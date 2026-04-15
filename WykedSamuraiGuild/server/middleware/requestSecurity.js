const HTML_OR_SCRIPT_PATTERN = /<[^>]+>|javascript:|on\w+\s*=|<\s*script/gi;
const FRAUD_KEYWORDS = [/wire transfer/i, /gift card/i, /crypto only/i, /pay .* upfront/i, /guaranteed income/i];
const HATE_OR_HARASSMENT_KEYWORDS = [/\bslur\b/i, /kill yourself/i, /racially inferior/i];
const sexualContentKeywords = [/explicit sex/i, /nude/i, /porn/i];
const floodTracker = new Map();

function normalize(value) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
}

function sanitizeText(value, maxLength = 1000) {
  const trimmed = normalize(value).slice(0, maxLength);
  return trimmed.replace(HTML_OR_SCRIPT_PATTERN, '');
}

function detectUnsafeContent(text) {
  const sample = String(text || '');
  return (
    FRAUD_KEYWORDS.some((pattern) => pattern.test(sample))
    || HATE_OR_HARASSMENT_KEYWORDS.some((pattern) => pattern.test(sample))
    || sexualContentKeywords.some((pattern) => pattern.test(sample))
  );
}

function detectFlood(req, keySuffix, maxInWindow = 8, windowMs = 20_000) {
  const ip = req.ip || 'unknown';
  const key = `${ip}:${keySuffix}`;
  const start = Date.now() - windowMs;
  const current = (floodTracker.get(key) || []).filter((ts) => ts >= start);
  current.push(Date.now());
  floodTracker.set(key, current);
  return current.length > maxInWindow;
}

export function sanitizeBody(schema = {}) {
  return function sanitizeBodyMiddleware(req, res, next) {
    if (!req.body || typeof req.body !== 'object') {
      req.body = {};
      return next();
    }

    const sanitized = {};
    for (const [field, config] of Object.entries(schema)) {
      const { maxLength = 500, required = false } = config || {};
      const cleaned = sanitizeText(req.body[field], maxLength);
      if (required && !cleaned) {
        return res.status(400).json({ error: `${field} is required.` });
      }
      if (cleaned) {
        sanitized[field] = cleaned;
      }
    }

    req.body = {
      ...req.body,
      ...sanitized,
    };
    return next();
  };
}

export function requireObjectBody(req, res, next) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid JSON payload.' });
  }
  return next();
}

export function contentSafetyGate({ fields = [], category = 'general' } = {}) {
  return function contentSafetyGateMiddleware(req, res, next) {
    const composite = fields.map((field) => sanitizeText(req.body?.[field], 2000)).join(' ');

    if (!composite) {
      return next();
    }

    if (detectUnsafeContent(composite)) {
      return res.status(400).json({ error: 'Content violates platform safety requirements.' });
    }

    if (category === 'recruiter' && FRAUD_KEYWORDS.some((pattern) => pattern.test(composite))) {
      return res.status(400).json({ error: 'Potential recruiter fraud/scam content detected.' });
    }

    if (detectFlood(req, category)) {
      return res.status(429).json({ error: 'Activity temporarily throttled due to flood detection.' });
    }

    return next();
  };
}

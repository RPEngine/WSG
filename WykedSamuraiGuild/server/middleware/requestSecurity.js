import { runModerationHooks } from "./moderationHooks.js";

const HTML_OR_SCRIPT_PATTERN = /<[^>]+>|javascript:|on\w+\s*=|<\s*script/gi;
function normalize(value) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
}

function sanitizeText(value, maxLength = 1000) {
  const trimmed = normalize(value).slice(0, maxLength);
  return trimmed.replace(HTML_OR_SCRIPT_PATTERN, '');
}

function validateBoolean(value) {
  return typeof value === 'boolean';
}

export function sanitizeBody(schema = {}, options = {}) {
  const { strict = true } = options;
  return function sanitizeBodyMiddleware(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      req.body = {};
      return next();
    }

    const bodyKeys = Object.keys(req.body);
    const schemaKeys = Object.keys(schema);

    if (strict) {
      const unknownKeys = bodyKeys.filter((key) => !schemaKeys.includes(key));
      if (unknownKeys.length) {
        return res.status(400).json({ error: `Unsupported fields: ${unknownKeys.join(', ')}` });
      }
    }

    const sanitized = {};
    for (const [field, config] of Object.entries(schema)) {
      const {
        maxLength = 500,
        required = false,
        type = 'string',
        allowedValues = null,
      } = config || {};
      const value = req.body[field];

      if (value === undefined || value === null || value === '') {
        if (required) {
          return res.status(400).json({ error: `${field} is required.` });
        }
        continue;
      }

      if (type === 'boolean') {
        if (!validateBoolean(value)) {
          return res.status(400).json({ error: `${field} must be a boolean.` });
        }
        sanitized[field] = value;
        continue;
      }

      if (typeof value !== 'string') {
        return res.status(400).json({ error: `${field} must be a string.` });
      }

      const cleaned = sanitizeText(value, maxLength);
      if (required && !cleaned) {
        return res.status(400).json({ error: `${field} is required.` });
      }

      if (allowedValues && !allowedValues.includes(cleaned)) {
        return res.status(400).json({ error: `${field} is invalid.` });
      }

      if (cleaned) {
        sanitized[field] = cleaned;
      }
    }

    req.body = sanitized;
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

    const moderationResult = runModerationHooks({
      req,
      text: composite,
      category,
    });

    if (moderationResult?.ok === false) {
      return res.status(moderationResult.status || 400).json({
        error: moderationResult.error || 'We could not process your request.',
      });
    }

    return next();
  };
}

const scamFraudPatterns = [/wire transfer/i, /gift card/i, /crypto only/i, /pay .* upfront/i, /guaranteed income/i];
const unsafeContentPatterns = [/\bslur\b/i, /kill yourself/i, /racially inferior/i, /explicit sex/i, /nude/i, /porn/i];
const floodTracker = new Map();

function detectFlood(req, category, maxInWindow = 8, windowMs = 20_000) {
  const ip = req.ip || 'unknown';
  const key = `${ip}:${category}`;
  const start = Date.now() - windowMs;
  const current = (floodTracker.get(key) || []).filter((ts) => ts >= start);
  current.push(Date.now());
  floodTracker.set(key, current);
  return current.length > maxInWindow;
}

function messageValidationHook({ text }) {
  if (!text || !String(text).trim()) {
    return { ok: true };
  }
  return { ok: true };
}

function spamFloodHook({ req, category }) {
  if (detectFlood(req, category)) {
    return { ok: false, status: 429, error: 'Activity temporarily throttled due to flood detection.' };
  }
  return { ok: true };
}

function unsafeContentHook({ text }) {
  if (unsafeContentPatterns.some((pattern) => pattern.test(text))) {
    return { ok: false, status: 400, error: 'Content violates platform safety requirements.' };
  }
  return { ok: true };
}

function scamFraudHook({ text, category }) {
  if (category === 'recruiter' && scamFraudPatterns.some((pattern) => pattern.test(text))) {
    return { ok: false, status: 400, error: 'Potential recruiter fraud/scam content detected.' };
  }
  return { ok: true };
}

const defaultHooks = [
  messageValidationHook,
  spamFloodHook,
  unsafeContentHook,
  scamFraudHook,
];

export function runModerationHooks({ req, text, category = 'general', hooks = defaultHooks }) {
  for (const hook of hooks) {
    const result = hook({ req, text, category });
    if (result?.ok === false) {
      return result;
    }
  }

  return { ok: true };
}

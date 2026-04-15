import {
  buildFriendliHeaders,
  getAiProviderConfig,
  getFriendliChatCompletionsUrl,
  mapFriendliStatusToMessage,
  requireFriendliConfig,
} from "../config/ai.js";

const HEARTBEAT_INTERVAL_MS = 4 * 60 * 1000;
const HEARTBEAT_IDLE_TIMEOUT_MS = 20 * 60 * 1000;

let lastAiActivityAt = 0;
let heartbeatIntervalId = null;
let heartbeatRunning = false;

const heartbeatRequestPayload = (endpointId) => ({
  model: endpointId,
  messages: [
    { role: "system", content: "ping" },
    { role: "user", content: "keep alive" },
  ],
  max_tokens: 1,
  temperature: 0,
});

const sendAiHeartbeatPing = async () => {
  let config;
  try {
    config = requireFriendliConfig();
  } catch {
    console.log("[ai-heartbeat] ping failed");
    return;
  }

  const baseUrl = String(process.env.FRIENDLI_API_BASE_URL || config.baseUrl || "").replace(/\/+$/, "");
  const endpoint = `${baseUrl}/chat/completions`;
  const token = String(process.env.FRIENDLI_API_TOKEN || config.token || "").trim();
  const body = heartbeatRequestPayload(config.endpointId);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      console.log("[ai-heartbeat] ping success");
      return;
    }

    console.log("[ai-heartbeat] ping failed");
  } catch {
    console.log("[ai-heartbeat] ping failed");
  }
};

export const shouldKeepHeartbeatRunning = () => {
  if (!lastAiActivityAt) return false;
  return (Date.now() - lastAiActivityAt) < HEARTBEAT_IDLE_TIMEOUT_MS;
};

export const stopAiHeartbeat = ({ dueToInactivity = false } = {}) => {
  if (heartbeatIntervalId) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }

  heartbeatRunning = false;
  if (dueToInactivity) {
    console.log("[ai-heartbeat] stopped after inactivity");
  }
};

export const startAiHeartbeat = () => {
  if (heartbeatRunning) return;

  heartbeatIntervalId = setInterval(async () => {
    if (!shouldKeepHeartbeatRunning()) {
      stopAiHeartbeat({ dueToInactivity: true });
      return;
    }

    await sendAiHeartbeatPing();
  }, HEARTBEAT_INTERVAL_MS);

  heartbeatRunning = true;
  console.log("[ai-heartbeat] started");
};

export const markAiActive = () => {
  lastAiActivityAt = Date.now();

  if (!heartbeatRunning) {
    startAiHeartbeat();
  }
};

const scenarioOutputSchema = {
  title: "string",
  premise: "string",
  openingSituation: "string",
};

const promptForScenario = ({ prompt, genre, tone, constraints }) => {
  const contextLines = [
    prompt ? `Prompt: ${prompt}` : null,
    genre ? `Genre: ${genre}` : null,
    tone ? `Tone: ${tone}` : null,
    constraints ? `Constraints: ${constraints}` : null,
  ].filter(Boolean);

  return [
    "You are a scenario generator for tabletop or roleplay experiences.",
    "Return STRICT JSON only, no markdown, no explanation, no code fences.",
    `Required JSON schema: ${JSON.stringify(scenarioOutputSchema)}`,
    "Each field must be a non-empty string.",
    ...contextLines,
  ].join("\n");
};

const parseGeneratedJson = (rawText) => {
  const trimmed = String(rawText || "").trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      throw new Error("AI did not return valid JSON.");
    }

    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }
};

const validateGeneratedScenario = (payload) => {
  const requiredKeys = Object.keys(scenarioOutputSchema);

  for (const key of requiredKeys) {
    if (typeof payload?.[key] !== "string" || !payload[key].trim()) {
      throw new Error(`Generated scenario is missing required field: ${key}`);
    }
  }

  return {
    title: payload.title.trim(),
    premise: payload.premise.trim(),
    openingSituation: payload.openingSituation.trim(),
  };
};

const parseResponseBody = async (response) => {
  const rawBody = await response.text();
  if (!rawBody) {
    return { rawBody: "", parsedBody: null };
  }

  try {
    return { rawBody, parsedBody: JSON.parse(rawBody) };
  } catch {
    return { rawBody, parsedBody: { raw: rawBody } };
  }
};

const callFriendli = async ({ messages, parameters = {} }) => {
  const config = requireFriendliConfig();
  const endpoint = getFriendliChatCompletionsUrl();
  const requestBody = {
    model: config.endpointId,
    messages,
    max_tokens: parameters?.max_new_tokens ?? 300,
    temperature: parameters?.temperature ?? 0.7,
  };

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: buildFriendliHeaders(),
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    console.error("[ai:friendli] Network failure", {
      endpoint,
      endpointId: config.endpointId,
      deployedModelName: config.deployedModelName,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("AI provider request failed.");
  }

  const { rawBody, parsedBody } = await parseResponseBody(response);

  if (!response.ok) {
    const message = mapFriendliStatusToMessage(response.status);
    console.error("[ai:friendli] Provider request failed", {
      status: response.status,
      statusText: response.statusText,
      endpoint,
      endpointId: config.endpointId,
      message,
      rawBody,
    });
    throw new Error(message);
  }

  return {
    payload: parsedBody,
    rawBody,
    status: response.status,
    statusText: response.statusText,
    requestBody,
    endpoint,
    config,
  };
};

export const testFriendliConnection = async () => {
  const result = await callFriendli({
    messages: [
      { role: "system", content: "You are a concise assistant." },
      { role: "user", content: "Reply with exactly: ok" },
    ],
    parameters: {
      max_new_tokens: 8,
      temperature: 0,
    },
  });

  return {
    status: "ok",
    provider: result.config.provider,
    model: result.config.endpointId,
    endpointId: result.config.endpointId,
    deployedModelName: result.config.deployedModelName,
    baseUrl: result.config.baseUrl,
    endpoint: result.endpoint,
    method: "POST",
    tokenPresent: result.config.tokenPresent,
    request: {
      headers: {
        Authorization: "Bearer [REDACTED]",
        "Content-Type": "application/json",
      },
      body: result.requestBody,
    },
    timestamp: new Date().toISOString(),
    response: result.payload,
  };
};

export const checkFriendliHealth = async () => {
  const config = getAiProviderConfig();

  try {
    await callFriendli({
      messages: [
        { role: "system", content: "You are a concise assistant." },
        { role: "user", content: "Reply with exactly: ok" },
      ],
      parameters: {
        max_new_tokens: 8,
        temperature: 0,
      },
    });

    return {
      provider: config.provider,
      status: "ok",
      model: config.endpointId,
      endpointId: config.endpointId,
      deployedModelName: config.deployedModelName,
      baseUrl: config.baseUrl,
      endpoint: getFriendliChatCompletionsUrl(),
      method: "POST",
      token: { present: config.tokenPresent, envName: config.tokenPresent ? "FRIENDLI_API_TOKEN" : null },
      endpointIdConfig: { present: Boolean(config.endpointId), envName: "FRIENDLI_ENDPOINT_ID" },
      failureReason: null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      provider: config.provider,
      status: "degraded",
      model: config.endpointId,
      endpointId: config.endpointId,
      deployedModelName: config.deployedModelName,
      baseUrl: config.baseUrl,
      endpoint: getFriendliChatCompletionsUrl(),
      method: "POST",
      token: { present: config.tokenPresent, envName: config.tokenPresent ? "FRIENDLI_API_TOKEN" : null },
      endpointIdConfig: { present: Boolean(config.endpointId), envName: "FRIENDLI_ENDPOINT_ID" },
      failureReason: error instanceof Error ? error.message : "AI provider request failed.",
      timestamp: new Date().toISOString(),
    };
  }
};

export const runFriendliDebugTest = async () => {
  const config = getAiProviderConfig();
  const endpoint = getFriendliChatCompletionsUrl();
  const requestBody = {
    model: config.endpointId,
    messages: [
      { role: "system", content: "You are a concise assistant." },
      { role: "user", content: "Reply with exactly: debug-ok" },
    ],
    max_tokens: 12,
    temperature: 0,
  };

  if (!config.tokenPresent || !config.endpointId) {
    return {
      status: 500,
      statusText: "ConfigError",
      rawBody: JSON.stringify({ error: "Missing Friendli config." }),
      baseUrl: config.baseUrl,
      endpointId: config.endpointId,
      tokenPresent: config.tokenPresent,
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: buildFriendliHeaders(),
      body: JSON.stringify(requestBody),
    });
    const rawBody = await response.text();

    return {
      status: response.status,
      statusText: response.statusText,
      rawBody,
      baseUrl: config.baseUrl,
      endpointId: config.endpointId,
      tokenPresent: config.tokenPresent,
    };
  } catch (error) {
    return {
      status: 503,
      statusText: "NetworkError",
      rawBody: error instanceof Error ? error.message : String(error),
      baseUrl: config.baseUrl,
      endpointId: config.endpointId,
      tokenPresent: config.tokenPresent,
    };
  }
};

export const generateScenarioFromAI = async ({ prompt, genre, tone, constraints }) => {
  const inputPrompt = promptForScenario({ prompt, genre, tone, constraints });

  try {
    const { payload: result } = await callFriendli({
      messages: [
        {
          role: "system",
          content: "You are a scenario generator for tabletop or roleplay experiences. Return strict JSON only.",
        },
        {
          role: "user",
          content: inputPrompt,
        },
      ],
      parameters: {
        max_new_tokens: 300,
        temperature: 0.7,
      },
    });

    const textOutput = Array.isArray(result)
      ? result[0]?.generated_text || result[0]?.summary_text || ""
      : result?.choices?.[0]?.message?.content || result?.generated_text || "";

    return validateGeneratedScenario(parseGeneratedJson(textOutput));
  } catch (error) {
    console.error("[ai:generate] Failed to generate scenario", {
      ...getAiProviderConfig(),
      hasPrompt: Boolean(prompt),
      genre: genre || null,
      tone: tone || null,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};

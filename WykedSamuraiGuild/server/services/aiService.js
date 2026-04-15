const FRIENDLI_PROVIDER = "friendli";
const DEFAULT_AI_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";
const FRIENDLI_MODEL = process.env.FRIENDLI_MODEL || DEFAULT_AI_MODEL;
const DEFAULT_FRIENDLI_BASE_URL = "https://api.friendli.ai/dedicated";
const FRIENDLI_BASE_URL = (process.env.FRIENDLI_API_BASE_URL || DEFAULT_FRIENDLI_BASE_URL).trim();
const FRIENDLI_CHAT_COMPLETIONS_PATH = "/v1/chat/completions";
const FRIENDLI_CHAT_COMPLETIONS_ENDPOINT = `${FRIENDLI_BASE_URL.replace(/\/+$/, "")}${FRIENDLI_CHAT_COMPLETIONS_PATH}`;

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

    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    return JSON.parse(candidate);
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

const resolveFriendliToken = () => {
  const rawFriendliToken = process.env.FRIENDLI_API_TOKEN;
  const token = typeof rawFriendliToken === "string" ? rawFriendliToken.trim() : "";
  const envName = token ? "FRIENDLI_API_TOKEN" : null;

  return {
    token,
    envName,
    tokenPresent: Boolean(token),
  };
};

const validateFriendliToken = (token) => {
  if (typeof token !== "string") {
    throw new Error("Invalid Friendli token: token must be a string.");
  }
  if (!token) {
    throw new Error("Missing Friendli API token. Set FRIENDLI_API_TOKEN.");
  }
  if (!token.trim()) {
    throw new Error("Invalid Friendli token: token is empty after trim.");
  }
};

const extractProviderErrorMessage = (payload, fallbackText = "") => {
  if (!payload || typeof payload !== "object") {
    return fallbackText || "Unknown Friendli error.";
  }

  const nestedError = payload.error;
  if (nestedError && typeof nestedError === "object") {
    return nestedError.message || nestedError.error || fallbackText || "Unknown Friendli error.";
  }

  return payload.error || payload.message || payload.raw || fallbackText || "Unknown Friendli error.";
};

const callFriendli = async ({
  model,
  messages,
  parameters = {},
}) => {
  const { token, envName, tokenPresent } = resolveFriendliToken();
  validateFriendliToken(token);
  const endpoint = FRIENDLI_CHAT_COMPLETIONS_ENDPOINT;
  const requestModel = model || FRIENDLI_MODEL;
  const requestBody = {
    model: requestModel,
    messages,
    max_tokens: parameters?.max_new_tokens ?? 300,
    temperature: parameters?.temperature ?? 0.7,
  };

  console.log("[ai:request] Provider diagnostics", {
    provider: FRIENDLI_PROVIDER,
    baseUrl: FRIENDLI_BASE_URL,
    model: requestModel,
    tokenPresent,
  });

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    console.error("[ai:generate] Friendli network failure", {
      endpoint,
      model: requestModel,
      tokenEnvName: envName,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  const bodyText = await response.text();

  let payload = null;
  if (bodyText) {
    try {
      payload = JSON.parse(bodyText);
    } catch {
      payload = { raw: bodyText };
    }
  }

  if (!response.ok) {
    const reason = extractProviderErrorMessage(payload, response.statusText);
    const message = `Provider rejected request: ${reason}.`.trim();
    console.error("[ai:generate] Friendli HTTP error details", {
      status: response.status,
      statusText: response.statusText,
      bodyText,
    });
    console.error("[ai:generate] Friendli request failed", {
      endpoint,
      model: requestModel,
      tokenEnvName: envName,
      status: response.status,
      reason: message,
    });
    throw new Error(`Friendli request failed (${response.status}): ${message}`);
  }

  return {
    payload,
    model: requestModel,
    endpoint,
    method: "POST",
    tokenEnvName: envName,
    requestBody,
  };
};

export const testFriendliConnection = async () => {
  const healthModel = process.env.FRIENDLI_HEALTH_MODEL || FRIENDLI_MODEL;
  const { payload, model, endpoint, method, tokenEnvName, requestBody } = await callFriendli({
    model: healthModel,
    messages: [
      {
        role: "system",
        content: "You are a concise assistant.",
      },
      {
        role: "user",
        content: "Friendli health check:",
      },
    ],
    parameters: {
      max_new_tokens: 12,
      return_full_text: false,
      temperature: 0.2,
    },
  });

  return {
    status: "ok",
    provider: FRIENDLI_PROVIDER,
    model,
    baseUrl: FRIENDLI_BASE_URL,
    endpoint,
    method,
    tokenEnvName,
    tokenPresent: true,
    request: {
      headers: {
        Authorization: "Bearer [REDACTED]",
        "Content-Type": "application/json",
      },
      body: requestBody,
    },
    timestamp: new Date().toISOString(),
    response: payload,
  };
};

export const checkFriendliHealth = async () => {
  const { token, envName, tokenPresent } = resolveFriendliToken();

  try {
    validateFriendliToken(token);
  } catch (error) {
    const failureReason = error instanceof Error
      ? error.message
      : "Missing token. Configure FRIENDLI_API_TOKEN.";
    console.error("[ai:test] Friendli provider test failed:", {
      reason: failureReason,
      endpoint: FRIENDLI_CHAT_COMPLETIONS_ENDPOINT,
      baseUrl: FRIENDLI_BASE_URL,
      model: FRIENDLI_MODEL,
      tokenEnvName: null,
      tokenPresent: false,
    });
    return {
      provider: FRIENDLI_PROVIDER,
      status: "degraded",
      model: FRIENDLI_MODEL,
      baseUrl: FRIENDLI_BASE_URL,
      endpoint: FRIENDLI_CHAT_COMPLETIONS_ENDPOINT,
      method: "POST",
      token: {
        present: false,
        envName: null,
      },
      failureReason,
      timestamp: new Date().toISOString(),
    };
  }

  const requestBody = {
    model: FRIENDLI_MODEL,
    messages: [
      {
        role: "system",
        content: "You are a concise assistant.",
      },
      {
        role: "user",
        content: "Reply with exactly: ok",
      },
    ],
    max_tokens: 5,
    temperature: 0,
  };

  try {
    console.log("[ai:test] Provider diagnostics", {
      provider: FRIENDLI_PROVIDER,
      baseUrl: FRIENDLI_BASE_URL,
      model: FRIENDLI_MODEL,
      tokenPresent,
    });

    const response = await fetch(FRIENDLI_CHAT_COMPLETIONS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    let payload = null;
    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = { raw: responseText };
      }
    }

    if (!response.ok) {
      console.error("[ai:test] Friendli HTTP error details", {
        status: response.status,
        statusText: response.statusText,
        bodyText: responseText,
      });
      const reason = payload?.error?.message || payload?.error || payload?.message || response.statusText || "Unknown Friendli error.";
      throw new Error(`Friendli request failed (${response.status}): ${reason}`);
    }

    return {
      provider: FRIENDLI_PROVIDER,
      status: "ok",
      model: FRIENDLI_MODEL,
      baseUrl: FRIENDLI_BASE_URL,
      endpoint: FRIENDLI_CHAT_COMPLETIONS_ENDPOINT,
      method: "POST",
      token: {
        present: true,
        envName,
      },
      failureReason: null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : "Unknown Friendli error.";
    console.error("[ai:test] Friendli provider test failed:", {
      reason: failureReason,
      endpoint: FRIENDLI_CHAT_COMPLETIONS_ENDPOINT,
      baseUrl: FRIENDLI_BASE_URL,
      model: FRIENDLI_MODEL,
      tokenEnvName: envName,
      tokenPresent: true,
    });
    return {
      provider: FRIENDLI_PROVIDER,
      status: "degraded",
      model: FRIENDLI_MODEL,
      baseUrl: FRIENDLI_BASE_URL,
      endpoint: FRIENDLI_CHAT_COMPLETIONS_ENDPOINT,
      method: "POST",
      token: {
        present: true,
        envName,
      },
      failureReason,
      timestamp: new Date().toISOString(),
    };
  }
};

export const generateScenarioFromAI = async ({ prompt, genre, tone, constraints }) => {
  const inputPrompt = promptForScenario({ prompt, genre, tone, constraints });

  try {
    const { payload: result } = await callFriendli({
      model: FRIENDLI_MODEL,
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
        return_full_text: false,
        temperature: 0.7,
      },
    });

    const textOutput = Array.isArray(result)
      ? result[0]?.generated_text || result[0]?.summary_text || ""
      : result?.choices?.[0]?.message?.content || result?.generated_text || "";

    const parsed = parseGeneratedJson(textOutput);
    return validateGeneratedScenario(parsed);
  } catch (error) {
    console.error("[ai:generate] Failed to generate scenario", {
      provider: FRIENDLI_PROVIDER,
      baseUrl: FRIENDLI_BASE_URL,
      model: FRIENDLI_MODEL,
      hasPrompt: Boolean(prompt),
      genre: genre || null,
      tone: tone || null,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};

const FRIENDLI_PROVIDER = "friendli";
const DEFAULT_DEPLOYED_MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.3";
const FRIENDLI_DEPLOYED_MODEL_NAME = (process.env.FRIENDLI_MODEL || DEFAULT_DEPLOYED_MODEL_NAME).trim();
const DEFAULT_FRIENDLI_ENDPOINT_ID = "dep94342bhagvi8";
const FRIENDLI_ENDPOINT_ID = (process.env.FRIENDLI_ENDPOINT_ID || DEFAULT_FRIENDLI_ENDPOINT_ID).trim();
const DEFAULT_FRIENDLI_BASE_URL = "https://api.friendli.ai/dedicated/v1";
const FRIENDLI_BASE_URL = (process.env.FRIENDLI_API_BASE_URL || DEFAULT_FRIENDLI_BASE_URL).trim();
const FRIENDLI_CHAT_COMPLETIONS_PATH = "/chat/completions";
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

const resolveFriendliEndpointId = () => {
  const rawFriendliEndpointId = process.env.FRIENDLI_ENDPOINT_ID;
  const endpointId = typeof rawFriendliEndpointId === "string"
    ? rawFriendliEndpointId.trim()
    : FRIENDLI_ENDPOINT_ID;

  return {
    endpointId,
    envName: endpointId ? "FRIENDLI_ENDPOINT_ID" : null,
    endpointPresent: Boolean(endpointId),
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

const validateFriendliEndpointId = (endpointId) => {
  if (typeof endpointId !== "string") {
    throw new Error("Invalid Friendli endpoint ID: endpoint ID must be a string.");
  }
  if (!endpointId) {
    throw new Error("Missing Friendli endpoint ID. Set FRIENDLI_ENDPOINT_ID.");
  }
  if (!endpointId.trim()) {
    throw new Error("Invalid Friendli endpoint ID: endpoint ID is empty after trim.");
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
  messages,
  parameters = {},
}) => {
  const { token, envName, tokenPresent } = resolveFriendliToken();
  const { endpointId } = resolveFriendliEndpointId();
  validateFriendliToken(token);
  validateFriendliEndpointId(endpointId);
  const endpoint = FRIENDLI_CHAT_COMPLETIONS_ENDPOINT;
  const requestBody = {
    model: endpointId,
    messages,
    max_tokens: parameters?.max_new_tokens ?? 300,
    temperature: parameters?.temperature ?? 0.7,
  };

  console.log("[ai:request] Provider diagnostics", {
    provider: FRIENDLI_PROVIDER,
    baseUrl: FRIENDLI_BASE_URL,
    endpointId,
    deployedModelName: FRIENDLI_DEPLOYED_MODEL_NAME,
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
      endpointId,
      deployedModelName: FRIENDLI_DEPLOYED_MODEL_NAME,
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
      endpointId,
      deployedModelName: FRIENDLI_DEPLOYED_MODEL_NAME,
      tokenEnvName: envName,
      status: response.status,
      reason: message,
    });
    throw new Error(`Friendli request failed (${response.status}): ${message}`);
  }

  return {
    payload,
    model: endpointId,
    endpointId,
    deployedModelName: FRIENDLI_DEPLOYED_MODEL_NAME,
    endpoint,
    method: "POST",
    tokenEnvName: envName,
    requestBody,
  };
};

export const testFriendliConnection = async () => {
  const { payload, model, endpointId, deployedModelName, endpoint, method, tokenEnvName, requestBody } = await callFriendli({
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
    endpointId,
    deployedModelName,
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
  const { endpointId, envName: endpointEnvName, endpointPresent } = resolveFriendliEndpointId();

  try {
    validateFriendliToken(token);
    validateFriendliEndpointId(endpointId);
  } catch (error) {
    const failureReason = error instanceof Error
      ? error.message
      : "Missing config. Configure FRIENDLI_API_TOKEN and FRIENDLI_ENDPOINT_ID.";
    console.error("[ai:test] Friendli provider test failed:", {
      reason: failureReason,
      endpoint: FRIENDLI_CHAT_COMPLETIONS_ENDPOINT,
      baseUrl: FRIENDLI_BASE_URL,
      endpointId,
      deployedModelName: FRIENDLI_DEPLOYED_MODEL_NAME,
      tokenEnvName: tokenPresent ? envName : null,
      endpointEnvName: endpointPresent ? endpointEnvName : null,
      tokenPresent,
      endpointPresent,
    });
    return {
      provider: FRIENDLI_PROVIDER,
      status: "degraded",
      model: endpointId,
      endpointId,
      deployedModelName: FRIENDLI_DEPLOYED_MODEL_NAME,
      baseUrl: FRIENDLI_BASE_URL,
      endpoint: FRIENDLI_CHAT_COMPLETIONS_ENDPOINT,
      method: "POST",
      token: {
        present: tokenPresent,
        envName: tokenPresent ? envName : null,
      },
      endpointIdConfig: {
        present: endpointPresent,
        envName: endpointPresent ? endpointEnvName : null,
      },
      failureReason,
      timestamp: new Date().toISOString(),
    };
  }

  const requestBody = {
    model: endpointId,
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
      endpointId,
      deployedModelName: FRIENDLI_DEPLOYED_MODEL_NAME,
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
      model: endpointId,
      endpointId,
      deployedModelName: FRIENDLI_DEPLOYED_MODEL_NAME,
      baseUrl: FRIENDLI_BASE_URL,
      endpoint: FRIENDLI_CHAT_COMPLETIONS_ENDPOINT,
      method: "POST",
      token: {
        present: true,
        envName,
      },
      endpointIdConfig: {
        present: true,
        envName: endpointEnvName,
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
      endpointId,
      deployedModelName: FRIENDLI_DEPLOYED_MODEL_NAME,
      tokenEnvName: envName,
      tokenPresent: true,
    });
    return {
      provider: FRIENDLI_PROVIDER,
      status: "degraded",
      model: endpointId,
      endpointId,
      deployedModelName: FRIENDLI_DEPLOYED_MODEL_NAME,
      baseUrl: FRIENDLI_BASE_URL,
      endpoint: FRIENDLI_CHAT_COMPLETIONS_ENDPOINT,
      method: "POST",
      token: {
        present: true,
        envName,
      },
      endpointIdConfig: {
        present: true,
        envName: endpointEnvName,
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
      endpointId: FRIENDLI_ENDPOINT_ID,
      deployedModelName: FRIENDLI_DEPLOYED_MODEL_NAME,
      hasPrompt: Boolean(prompt),
      genre: genre || null,
      tone: tone || null,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};

const DEFAULT_AI_MODEL = "HuggingFaceH4/zephyr-7b-beta";
const HF_MODEL = process.env.HUGGING_FACE_MODEL || DEFAULT_AI_MODEL;
const HF_ROUTER_ENDPOINT = "https://router.huggingface.co/v1/chat/completions";
const HF_ROUTER_MODEL = process.env.HUGGING_FACE_ROUTER_MODEL || HF_MODEL;

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

const resolveHuggingFaceToken = () => {
  const rawApiKey = process.env.HUGGINGFACE_API_KEY;
  const rawApiToken = process.env.HUGGINGFACE_API_TOKEN;
  const trimmedApiKey = typeof rawApiKey === "string" ? rawApiKey.trim() : "";
  const trimmedApiToken = typeof rawApiToken === "string" ? rawApiToken.trim() : "";
  const hfToken = trimmedApiKey || trimmedApiToken;
  const envName = trimmedApiKey ? "HUGGINGFACE_API_KEY" : trimmedApiToken ? "HUGGINGFACE_API_TOKEN" : null;

  return {
    token: hfToken,
    envName,
  };
};

const validateHuggingFaceToken = (token) => {
  if (typeof token !== "string") {
    throw new Error("Invalid Hugging Face token: token must be a string.");
  }
  if (!token) {
    throw new Error("Missing Hugging Face token. Set HUGGINGFACE_API_KEY or HUGGINGFACE_API_TOKEN.");
  }
  if (!token.trim()) {
    throw new Error("Invalid Hugging Face token: token is empty after trim.");
  }
  if (!token.startsWith("hf_")) {
    throw new Error("Invalid Hugging Face token: expected a token starting with \"hf_\".");
  }
};

const extractProviderErrorMessage = (payload, fallbackText = "") => {
  if (!payload || typeof payload !== "object") {
    return fallbackText || "Unknown Hugging Face error.";
  }

  const nestedError = payload.error;
  if (nestedError && typeof nestedError === "object") {
    return nestedError.message || nestedError.error || fallbackText || "Unknown Hugging Face error.";
  }

  return payload.error || payload.message || payload.raw || fallbackText || "Unknown Hugging Face error.";
};

const callHuggingFace = async ({
  model,
  inputs,
  parameters = {},
}) => {
  const { token, envName } = resolveHuggingFaceToken();
  validateHuggingFaceToken(token);
  const endpoint = HF_ROUTER_ENDPOINT;
  const requestModel = model || HF_ROUTER_MODEL;
  const userContent = typeof inputs === "string" ? inputs : JSON.stringify(inputs);
  const requestBody = {
    model: requestModel,
    messages: [
      {
        role: "user",
        content: userContent,
      },
    ],
    max_tokens: parameters?.max_new_tokens ?? 300,
    temperature: parameters?.temperature ?? 0.7,
  };

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
    console.error("[ai:generate] Hugging Face router network failure", {
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
    const routerHint = response.status === 410 ? " Verify requests are sent to https://router.huggingface.co." : "";
    const message = `Provider rejected request: ${reason}.${routerHint}`.trim();
    console.error("[ai:generate] Hugging Face router HTTP error details", {
      status: response.status,
      statusText: response.statusText,
      bodyText,
    });
    console.error("[ai:generate] Hugging Face router request failed", {
      endpoint,
      model: requestModel,
      tokenEnvName: envName,
      status: response.status,
      reason: message,
    });
    throw new Error(`Hugging Face request failed (${response.status}): ${message}`);
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

export const testHuggingFaceConnection = async () => {
  const healthModel = process.env.HUGGING_FACE_HEALTH_MODEL || HF_MODEL;
  const { payload, model, endpoint, method, tokenEnvName, requestBody } = await callHuggingFace({
    model: healthModel,
    inputs: "Hugging Face health check:",
    parameters: {
      max_new_tokens: 12,
      return_full_text: false,
      temperature: 0.2,
    },
  });

  return {
    status: "ok",
    provider: "huggingface",
    model,
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

export const checkHuggingFaceHealth = async () => {
  const { token, envName } = resolveHuggingFaceToken();

  try {
    validateHuggingFaceToken(token);
  } catch (error) {
    const failureReason = error instanceof Error
      ? error.message
      : "Missing token. Configure HUGGINGFACE_API_KEY or HUGGINGFACE_API_TOKEN.";
    console.error("[ai:test] Hugging Face router provider test failed:", {
      reason: failureReason,
      endpoint: HF_ROUTER_ENDPOINT,
      model: HF_ROUTER_MODEL,
      tokenEnvName: null,
      tokenPresent: false,
    });
    return {
      provider: "huggingface",
      status: "degraded",
      model: HF_ROUTER_MODEL,
      endpoint: HF_ROUTER_ENDPOINT,
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
    model: HF_ROUTER_MODEL,
    messages: [
      {
        role: "user",
        content: "Reply with exactly: ok",
      },
    ],
    max_tokens: 5,
    temperature: 0,
  };

  try {
    const response = await fetch(HF_ROUTER_ENDPOINT, {
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
      console.error("[ai:test] Hugging Face router HTTP error details", {
        status: response.status,
        statusText: response.statusText,
        bodyText: responseText,
      });
      const reason = payload?.error?.message || payload?.error || payload?.message || response.statusText || "Unknown Hugging Face router error.";
      throw new Error(`Hugging Face router request failed (${response.status}): ${reason}`);
    }

    return {
      provider: "huggingface",
      status: "ok",
      model: HF_ROUTER_MODEL,
      endpoint: HF_ROUTER_ENDPOINT,
      method: "POST",
      token: {
        present: true,
        envName,
      },
      failureReason: null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : "Unknown Hugging Face router error.";
    console.error("[ai:test] Hugging Face router provider test failed:", {
      reason: failureReason,
      endpoint: HF_ROUTER_ENDPOINT,
      model: HF_ROUTER_MODEL,
      tokenEnvName: envName,
      tokenPresent: true,
    });
    return {
      provider: "huggingface",
      status: "degraded",
      model: HF_ROUTER_MODEL,
      endpoint: HF_ROUTER_ENDPOINT,
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
    const { payload: result } = await callHuggingFace({
      model: HF_MODEL,
      inputs: inputPrompt,
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
      model: HF_MODEL,
      hasPrompt: Boolean(prompt),
      genre: genre || null,
      tone: tone || null,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};

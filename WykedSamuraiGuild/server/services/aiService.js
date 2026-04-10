const DEFAULT_AI_MODEL = "HuggingFaceH4/zephyr-7b-beta";
const HF_MODEL = process.env.HUGGING_FACE_MODEL || DEFAULT_AI_MODEL;
const HF_ROUTER_ENDPOINT = "https://router.huggingface.co/v1/chat/completions";
const HF_ROUTER_MODEL = process.env.HUGGING_FACE_ROUTER_MODEL || HF_MODEL;
const HF_ROUTER_TOKEN_ENV = "HUGGINGFACE_API_TOKEN";

const HF_TOKEN_ENV_NAMES = [
  "HUGGINGFACE_API_TOKEN",
  "HUGGING_FACE_API_TOKEN",
  "WSG_HF_API_TOKEN",
  "HF_TOKEN",
];

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
  for (const envName of HF_TOKEN_ENV_NAMES) {
    const value = process.env[envName];
    if (typeof value === "string" && value.trim()) {
      return {
        token: value.trim(),
        envName,
      };
    }
  }

  return {
    token: "",
    envName: null,
  };
};

const huggingFaceEndpoint = (model) => {
  const normalizedModel = String(model || "").trim().replace(/^\/+|\/+$/g, "");
  const safeModelPath = normalizedModel
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://api-inference.huggingface.co/models/${safeModelPath}`;
};

const callHuggingFace = async ({
  model,
  inputs,
  parameters = {},
  options = { wait_for_model: true },
}) => {
  const { token, envName } = resolveHuggingFaceToken();
  if (!token) {
    throw new Error(
      `Missing Hugging Face token. Set one of: ${HF_TOKEN_ENV_NAMES.join(", ")}.`,
    );
  }
  const endpoint = huggingFaceEndpoint(model);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs,
      parameters,
      options,
    }),
  });

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
    const message =
      (payload && typeof payload === "object" && (payload.error || payload.message || payload.raw))
      || response.statusText
      || "Unknown Hugging Face error.";
    console.error("[ai:generate] Hugging Face inference request failed", {
      endpoint,
      model,
      tokenEnvName: envName,
      status: response.status,
      reason: message,
    });
    throw new Error(`Hugging Face request failed (${response.status}): ${message}`);
  }

  return {
    payload,
    model,
    endpoint,
    method: "POST",
    tokenEnvName: envName,
    requestBody: {
      inputs,
      parameters,
      options,
    },
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
  const token = process.env[HF_ROUTER_TOKEN_ENV]?.trim() || "";

  if (!token) {
    const failureReason = `Missing token. Configure ${HF_ROUTER_TOKEN_ENV}.`;
    console.error("[ai:test] Hugging Face router provider test failed:", {
      reason: failureReason,
      endpoint: HF_ROUTER_ENDPOINT,
      model: HF_ROUTER_MODEL,
      tokenEnvName: HF_ROUTER_TOKEN_ENV,
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
        envName: HF_ROUTER_TOKEN_ENV,
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
        envName: HF_ROUTER_TOKEN_ENV,
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
      tokenEnvName: HF_ROUTER_TOKEN_ENV,
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
        envName: HF_ROUTER_TOKEN_ENV,
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
      : result?.generated_text || "";

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

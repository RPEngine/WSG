const HF_MODEL = process.env.HUGGING_FACE_MODEL || "mistralai/Mistral-7B-Instruct-v0.3";

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

const getHuggingFaceToken = () => {
  const token = process.env.WSG_HF_API_TOKEN;
  if (!token) {
    throw new Error("Missing Hugging Face token. Set WSG_HF_API_TOKEN in environment.");
  }

  return token;
};

const huggingFaceEndpoint = (model) => `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`;

const callHuggingFace = async ({
  model,
  inputs,
  parameters = {},
  options = { wait_for_model: true },
}) => {
  const token = getHuggingFaceToken();
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
    throw new Error(`Hugging Face request failed (${response.status}): ${message}`);
  }

  return {
    payload,
    model,
    endpoint,
  };
};

export const testHuggingFaceConnection = async () => {
  const { payload, model, endpoint } = await callHuggingFace({
    model: HF_MODEL,
    inputs: "Connection test. Reply with one short sentence.",
    parameters: {
      max_new_tokens: 24,
      return_full_text: false,
    },
  });

  return {
    status: "ok",
    provider: "huggingface",
    model,
    endpoint,
    timestamp: new Date().toISOString(),
    response: payload,
  };
};

export const generateScenarioFromAI = async ({ prompt, genre, tone, constraints }) => {
  const inputPrompt = promptForScenario({ prompt, genre, tone, constraints });

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
};

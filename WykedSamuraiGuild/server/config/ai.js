const FRIENDLI_PROVIDER = "friendli";
const DEFAULT_BASE_URL = "https://api.friendli.ai/dedicated/v1";
const DEFAULT_ENDPOINT_ID = "depfbgnsxtxk2bc";

const trim = (value) => (typeof value === "string" ? value.trim() : "");

export const getAiProviderConfig = () => {
  const baseUrl = trim(process.env.FRIENDLI_API_BASE_URL) || DEFAULT_BASE_URL;
  const token = trim(process.env.FRIENDLI_API_TOKEN);
  const endpointId = trim(process.env.FRIENDLI_ENDPOINT_ID) || DEFAULT_ENDPOINT_ID;
  const deployedModelName = trim(process.env.FRIENDLI_DEPLOYED_MODEL_NAME) || endpointId;

  return {
    provider: FRIENDLI_PROVIDER,
    baseUrl,
    token,
    endpointId,
    deployedModelName,
    tokenPresent: Boolean(token),
  };
};

export const getFriendliChatCompletionsUrl = () => {
  const { baseUrl } = getAiProviderConfig();
  return `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
};

export const buildFriendliHeaders = () => {
  const { token } = getAiProviderConfig();

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const requireFriendliConfig = () => {
  const config = getAiProviderConfig();

  if (!config.tokenPresent) {
    throw new Error("Missing Friendli API token. Set FRIENDLI_API_TOKEN.");
  }

  if (!config.endpointId) {
    throw new Error("Missing Friendli endpoint ID. Set FRIENDLI_ENDPOINT_ID.");
  }

  return config;
};

export const mapFriendliStatusToMessage = (status) => {
  if (status === 401) {
    return "Friendli authentication failed.";
  }
  if (status === 404) {
    return "Friendli endpoint or route not found.";
  }
  if (status === 503) {
    return "The AI endpoint is waking up or unavailable.";
  }
  return "AI provider request failed.";
};

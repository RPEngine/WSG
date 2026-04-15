import { checkFriendliHealth } from "../services/aiService.js";
import { generateAndSaveScenario, getAllowedScenarioStatuses } from "../services/scenarioService.js";

export const testAiConnection = async (req, res) => {
  try {
    const friendli = await checkFriendliHealth();

    return res.status(200).json({
      ok: true,
      backend: "ok",
      provider: friendli?.provider || "friendli",
      model: friendli?.model || process.env.FRIENDLI_ENDPOINT_ID || "dep94342bhagvi8",
      endpointId: friendli?.endpointId || process.env.FRIENDLI_ENDPOINT_ID || "dep94342bhagvi8",
      deployedModelName: friendli?.deployedModelName || process.env.FRIENDLI_MODEL || "mistralai/Mistral-7B-Instruct-v0.3",
      baseUrl: friendli?.baseUrl || "https://api.friendli.ai/dedicated/v1",
      timestamp: friendli?.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      backend: "error",
      provider: "friendli",
      model: process.env.FRIENDLI_ENDPOINT_ID || "dep94342bhagvi8",
      endpointId: process.env.FRIENDLI_ENDPOINT_ID || "dep94342bhagvi8",
      deployedModelName: process.env.FRIENDLI_MODEL || "mistralai/Mistral-7B-Instruct-v0.3",
      baseUrl: "https://api.friendli.ai/dedicated/v1",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Provider test failed.",
    });
  }
};

export const generateAiScenario = async (req, res) => {
  try {
    const result = await generateAndSaveScenario(req.body || {});
    const statusCode = result.created ? 201 : 200;

    return res.status(statusCode).json({
      ...result,
      allowedStatuses: getAllowedScenarioStatuses(),
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Failed to generate scenario",
    });
  }
};

export const aiChat = generateAiScenario;

import { getAiProviderConfig } from "../config/ai.js";
import { checkFriendliHealth, markAiActive, runFriendliDebugTest } from "../services/aiService.js";
import { generateAndSaveScenario, getAllowedScenarioStatuses } from "../services/scenarioService.js";

export const testAiConnection = async (req, res) => {
  const config = getAiProviderConfig();

  try {
    const friendli = await checkFriendliHealth();
    markAiActive();

    return res.status(200).json({
      ok: true,
      backend: "ok",
      provider: friendli?.provider || config.provider,
      model: friendli?.model || config.endpointId,
      endpointId: friendli?.endpointId || config.endpointId,
      deployedModelName: friendli?.deployedModelName || config.deployedModelName,
      baseUrl: friendli?.baseUrl || config.baseUrl,
      tokenPresent: config.tokenPresent,
      timestamp: friendli?.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      backend: "error",
      provider: config.provider,
      model: config.endpointId,
      endpointId: config.endpointId,
      deployedModelName: config.deployedModelName,
      baseUrl: config.baseUrl,
      tokenPresent: config.tokenPresent,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Provider test failed.",
    });
  }
};

export const debugFriendliTest = async (req, res) => {
  const result = await runFriendliDebugTest();
  const status = Number.isInteger(result.status) ? result.status : 500;
  if (status >= 200 && status < 300) {
    markAiActive();
  }

  return res.status(status).json({
    status: result.status,
    statusText: result.statusText,
    rawBody: result.rawBody,
    baseUrl: result.baseUrl,
    endpointId: result.endpointId,
    tokenPresent: result.tokenPresent,
    timestamp: new Date().toISOString(),
  });
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

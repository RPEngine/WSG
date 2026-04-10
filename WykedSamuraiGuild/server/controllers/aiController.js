import { checkHuggingFaceHealth } from "../services/aiService.js";
import { generateAndSaveScenario, getAllowedScenarioStatuses } from "../services/scenarioService.js";

export const testAiConnection = async (req, res) => {
  const huggingFace = await checkHuggingFaceHealth();
  const providerStatus = huggingFace?.status === "ok" ? "ok" : "degraded";

  return res.status(200).json({
    backend: "ok",
    provider: providerStatus,
    providerName: huggingFace?.provider || "huggingface",
    model: huggingFace?.model || null,
    reason: providerStatus === "ok"
      ? null
      : (huggingFace?.failureReason || "Provider test failed."),
    timestamp: huggingFace?.timestamp || new Date().toISOString(),
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

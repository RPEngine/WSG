import { checkHuggingFaceHealth } from "../services/aiService.js";
import { generateAndSaveScenario, getAllowedScenarioStatuses } from "../services/scenarioService.js";

export const testAiConnection = async (req, res) => {
  try {
    const huggingFace = await checkHuggingFaceHealth();

    return res.status(200).json({
      ok: true,
      backend: "ok",
      provider: huggingFace?.provider || "huggingface",
      model: huggingFace?.model || "HuggingFaceH4/zephyr-7b-beta",
      timestamp: huggingFace?.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      backend: "error",
      provider: "huggingface",
      model: "HuggingFaceH4/zephyr-7b-beta",
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

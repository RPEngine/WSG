import { checkHuggingFaceHealth } from "../services/aiService.js";

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

import { checkHuggingFaceHealth } from "../services/aiService.js";

export const testAiConnection = async (req, res) => {
  const huggingFace = await checkHuggingFaceHealth();
  const providerStatus = huggingFace?.status === "ok" ? "ok" : "degraded";

  if (providerStatus === "ok") {
    return res.status(200).json({
      backend: "ok",
      provider: "ok",
      providerName: huggingFace?.provider || "huggingface",
      model: huggingFace?.model || null,
    });
  }

  return res.status(200).json({
    backend: "ok",
    provider: "degraded",
    providerName: huggingFace?.provider || "huggingface",
    reason: huggingFace?.failureReason || "Provider test failed.",
    model: huggingFace?.model || null,
  });
};

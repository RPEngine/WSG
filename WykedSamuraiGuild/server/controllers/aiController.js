import { checkHuggingFaceHealth } from "../services/aiService.js";

export const testAiConnection = async (req, res) => {
  const huggingFace = await checkHuggingFaceHealth();
  const backendStatus = "ok";
  const providerReachable = huggingFace.reachable === true;
  const providerStatus = providerReachable ? "ok" : "degraded";

  return res.status(200).json({
    status: backendStatus,
    service: "wsg-backend",
    message: "Backend is running.",
    port: process.env.PORT || 3000,
    timestamp: new Date().toISOString(),
    aiTest: {
      backendStatus,
      tokenStatus: huggingFace?.token?.present ? "present" : "missing",
      tokenEnvName: huggingFace?.token?.envName || null,
      providerStatus,
      providerReachable,
      provider: huggingFace?.provider || "huggingface",
      model: huggingFace?.model || null,
      endpoint: huggingFace?.endpoint || null,
      method: huggingFace?.method || "POST",
      requestPreview: huggingFace?.requestPreview || null,
      failureReason: huggingFace?.failureReason || null,
    },
    huggingFace,
  });
};

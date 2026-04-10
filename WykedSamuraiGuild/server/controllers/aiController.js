import { checkHuggingFaceHealth } from "../services/aiService.js";

export const testAiConnection = async (req, res) => {
  const huggingFace = await checkHuggingFaceHealth();
  const backendStatus = "ok";
  const providerStatus = huggingFace?.status === "ok" ? "ok" : "degraded";

  return res.status(200).json({
    backendStatus,
    providerStatus,
    provider: huggingFace?.provider || "huggingface",
    modelTested: huggingFace?.model || null,
    errorReason: providerStatus === "ok" ? null : (huggingFace?.failureReason || "Provider test failed."),
    tokenEnvName: huggingFace?.token?.envName || null,
    tokenStatus: huggingFace?.token?.present ? "present" : "missing",
    endpoint: huggingFace?.endpoint || null,
    method: huggingFace?.method || "POST",
    providerReachable: huggingFace?.reachable === true,
    timestamp: new Date().toISOString(),
    details: huggingFace,
  });
};

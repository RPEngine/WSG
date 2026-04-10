import { checkHuggingFaceHealth } from "../services/aiService.js";

export const testAiConnection = async (req, res) => {
  const huggingFace = await checkHuggingFaceHealth();
  return res.status(200).json({
    status: "ok",
    service: "wsg-backend",
    message: "Backend is running.",
    port: process.env.PORT || 3000,
    timestamp: new Date().toISOString(),
    huggingFace,
  });
};

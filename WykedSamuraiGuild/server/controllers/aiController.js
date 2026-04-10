import { testHuggingFaceConnection } from "../services/aiService.js";

export const testAiConnection = async (req, res) => {
  try {
    const result = await testHuggingFaceConnection();
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check AI connection.";
    const missingToken = message.includes("Missing Hugging Face token");

    return res.status(missingToken ? 500 : 502).json({
      status: "error",
      provider: "huggingface",
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
};

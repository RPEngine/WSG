import { getAiProviderConfig } from "../config/ai.js";
import {
  checkFriendliHealth,
  generateScenarioFromAI,
  getPendingScenarioContextForUser,
  markAiActive,
  runFriendliDebugTest,
} from "../services/aiService.js";
import { generateAndSaveScenario, getAllowedScenarioStatuses } from "../services/scenarioService.js";
import { findUserById, getRecentScenarioMemory } from "../models/userStore.js";

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

function buildAiContextEnvelope({ user, recentScenarioMemory, pendingScenarioContext }) {
  return {
    profile: {
      motivation: user?.motivation || "",
      primaryArchetype: user?.primary_archetype || "",
      secondaryArchetype: user?.secondary_archetype || "",
      reflectionProfile: user?.reflection_profile && typeof user.reflection_profile === "object" ? user.reflection_profile : {},
      derivedArchetypeProfile: user?.derived_archetype_profile && typeof user.derived_archetype_profile === "object" ? user.derived_archetype_profile : {},
    },
    recentScenarioMemory,
    pendingScenarioContext: pendingScenarioContext?.payload || null,
    relevantMemoryTags: Array.from(new Set((recentScenarioMemory || []).flatMap((entry) => entry.memoryTags || []))),
  };
}

export const aiChat = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const user = userId ? await findUserById(userId) : null;
    const recentScenarioMemory = userId ? await getRecentScenarioMemory(userId, 3) : [];
    const pendingScenarioContext = userId ? getPendingScenarioContextForUser(userId) : null;
    const aiContext = buildAiContextEnvelope({ user, recentScenarioMemory, pendingScenarioContext });
    const clientContext = req.body?.context && typeof req.body.context === "object" ? req.body.context : null;
    const contextPrefix = `Structured Context JSON:\n${JSON.stringify({
      ...aiContext,
      clientContext,
    }, null, 2)}`;

    const result = await generateScenarioFromAI({
      prompt: [contextPrefix, String(req.body?.prompt || "").trim()].filter(Boolean).join("\n\n"),
      genre: req.body?.genre || "Conversational Support",
      tone: req.body?.tone || "Context-aware",
      constraints: [req.body?.constraints, "Use structured context for continuity and profile-aware narration."].filter(Boolean).join(" "),
    });
    markAiActive();
    return res.status(200).json({
      scenario: result,
      aiContext,
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Failed to generate AI reply",
    });
  }
};

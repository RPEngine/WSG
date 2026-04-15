import {
  buildScenarioCompletionPayload,
  generateAndSaveScenario,
  getAllScenarios,
  getScenarioDetails,
  getAllowedScenarioStatuses,
  onScenarioCompleted,
} from "../services/scenarioService.js";

export const generateScenario = async (req, res) => {
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

export const listScenarioCatalog = (req, res) => {
  const scenarios = getAllScenarios();

  return res.json({
    items: scenarios,
    count: scenarios.length,
    allowedStatuses: getAllowedScenarioStatuses(),
  });
};

export const getScenarioById = (req, res) => {
  const scenario = getScenarioDetails(req.params.id);

  if (!scenario) {
    return res.status(404).json({ error: "Scenario not found" });
  }

  return res.json({
    item: scenario,
    allowedStatuses: getAllowedScenarioStatuses(),
  });
};

export const completeScenario = async (req, res) => {
  try {
    const scenarioId = String(req.params.id || req.body?.scenarioId || "").trim();
    const payload = buildScenarioCompletionPayload({
      scenarioId,
      title: req.body?.title,
      mode: req.body?.mode,
      userId: req.user.id,
      profileSnapshot: req.body?.profileSnapshot,
      scenarioResults: req.body?.scenarioResults,
    });

    if (!payload.scenarioId) {
      return res.status(400).json({ error: "scenarioId is required." });
    }

    const completionPayload = await onScenarioCompleted(payload);
    return res.status(201).json({ completion: completionPayload });
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Failed to complete scenario",
    });
  }
};

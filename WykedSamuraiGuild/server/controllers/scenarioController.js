import {
  generateAndSaveScenario,
  getAllScenarios,
  getScenarioDetails,
  getAllowedScenarioStatuses,
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

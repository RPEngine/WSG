import { generateScenarioFromAI } from "./aiService.js";
import {
  allowedScenarioStatuses,
  createScenarioWithInitialVersion,
  findScenarioByDuplicateHash,
  buildScenarioDuplicateHash,
  listScenarios,
  getScenarioById,
} from "../models/scenarioStore.js";

const duplicateResponse = (scenario) => ({
  scenario,
  created: false,
  duplicate: true,
  message: "Duplicate scenario detected. Returning existing scenario.",
});

const createdResponse = (scenario) => ({
  scenario,
  created: true,
  duplicate: false,
});

export const generateAndSaveScenario = async ({ prompt, genre, tone, constraints }) => {
  const generated = await generateScenarioFromAI({ prompt, genre, tone, constraints });
  const duplicateHash = buildScenarioDuplicateHash(generated);

  const existing = findScenarioByDuplicateHash(duplicateHash);
  if (existing) {
    return duplicateResponse(getScenarioById(existing.id));
  }

  const { scenario } = createScenarioWithInitialVersion(generated);
  return createdResponse(getScenarioById(scenario.id));
};

export const getAllScenarios = () => listScenarios();

export const getScenarioDetails = (scenarioId) => getScenarioById(scenarioId);

export const getAllowedScenarioStatuses = () => allowedScenarioStatuses;

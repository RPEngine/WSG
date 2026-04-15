import { generateScenarioFromAI, markAiActive, pushScenarioContextToAI } from "./aiService.js";
import {
  allowedScenarioStatuses,
  createScenarioWithInitialVersion,
  findScenarioByDuplicateHash,
  buildScenarioDuplicateHash,
  listScenarios,
  getScenarioById,
} from "../models/scenarioStore.js";
import { saveScenarioMemory, updateUserArchetypeContext } from "../models/userStore.js";

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
  markAiActive();
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

const normalizeText = (value) => String(value || "").trim();

const normalizeMode = (mode) => (mode === "roleplay" ? "roleplay" : "professional");

const buildDeterministicSummary = (payload) => {
  const scenarioId = normalizeText(payload.scenarioId);
  const title = normalizeText(payload.title) || scenarioId;
  const answers = payload.scenarioResults?.answers || {};
  const profile = payload.profileSnapshot || {};

  if (scenarioId === "find-your-why") {
    const origins = normalizeText(answers.hall_memory) || "an unrecorded answer";
    const aspiration = normalizeText(answers.hall_ambition) || "an unrecorded answer";
    const weight = normalizeText(answers.hall_burden) || "an unrecorded answer";
    const bonds = normalizeText(answers.hall_connection) || "an unrecorded answer";
    const motivation = normalizeText(profile.motivation);
    const primary = normalizeText(profile.primaryArchetype) || "unresolved";
    const secondary = normalizeText(profile.secondaryArchetype) || "unresolved";
    const motivationFragment = motivation ? ` Their final motivation was: "${motivation}".` : "";
    return `The user completed the guild initiation rite, Forge Your Purpose. They chose ${origins} in the Hall of Origins, ${aspiration} in the Hall of Aspiration, ${weight} in the Hall of Weight, and ${bonds} in the Hall of Bonds.${motivationFragment} Their primary archetype resolved as ${primary} and their secondary archetype resolved as ${secondary}.`;
  }

  return `The user completed scenario "${title}" (${scenarioId}) in ${normalizeMode(payload.mode)} mode. Completion state: ${normalizeText(payload.scenarioResults?.completionState) || "complete"}.`;
};

const buildMemoryTags = (payload) => {
  const tags = new Set(["scenario", normalizeText(payload.scenarioId).toLowerCase()].filter(Boolean));
  const profile = payload.profileSnapshot || {};
  const scenarioResults = payload.scenarioResults || {};
  if (payload.scenarioId === "find-your-why") {
    tags.add("initiation");
    tags.add("motivation");
  }
  [profile.primaryArchetype, profile.secondaryArchetype].forEach((value) => {
    const normalized = normalizeText(value).toLowerCase();
    if (normalized) tags.add(normalized);
  });
  Object.values(scenarioResults.answers || {}).forEach((answer) => {
    const normalized = normalizeText(answer).toLowerCase();
    if (normalized) tags.add(normalized.replace(/\s+/g, "_"));
  });
  return Array.from(tags);
};

export const buildScenarioCompletionPayload = ({ scenarioId, title, mode, userId, profileSnapshot, scenarioResults }) => {
  const basePayload = {
    scenarioId: normalizeText(scenarioId),
    title: normalizeText(title) || normalizeText(scenarioId),
    completedAt: new Date().toISOString(),
    mode: normalizeMode(mode),
    userId,
    profileSnapshot: profileSnapshot && typeof profileSnapshot === "object" ? profileSnapshot : {},
    scenarioResults: scenarioResults && typeof scenarioResults === "object" ? scenarioResults : {},
  };
  const summary = buildDeterministicSummary(basePayload);
  return {
    ...basePayload,
    summary,
    memoryTags: buildMemoryTags({ ...basePayload, summary }),
  };
};

export const onScenarioCompleted = async (payload) => {
  await updateUserArchetypeContext(payload.userId, payload.profileSnapshot, payload.scenarioResults);
  await saveScenarioMemory(payload.userId, payload);
  pushScenarioContextToAI(payload);
  return payload;
};

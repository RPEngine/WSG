import crypto from "crypto";

const scenarios = new Map();
const versions = new Map();
const changeLogs = new Map();
const duplicateIndex = new Map();

let scenarioCounter = 0;
let versionCounter = 0;
let changeLogCounter = 0;

const nowIso = () => new Date().toISOString();

export const normalizeForDuplicateKey = (value = "") =>
  String(value).trim().replace(/\s+/g, " ").toLowerCase();

export const buildScenarioDuplicateHash = ({ title, premise, openingSituation }) => {
  const normalizedPayload = [title, premise, openingSituation]
    .map((value) => normalizeForDuplicateKey(value))
    .join("|");

  return crypto.createHash("sha256").update(normalizedPayload).digest("hex");
};

export const findScenarioByDuplicateHash = (duplicateHash) => {
  const scenarioId = duplicateIndex.get(duplicateHash);
  if (!scenarioId) {
    return null;
  }

  return scenarios.get(scenarioId) || null;
};

export const createScenarioWithInitialVersion = ({ title, premise, openingSituation }) => {
  const duplicateHash = buildScenarioDuplicateHash({ title, premise, openingSituation });

  const scenarioId = `scn_${++scenarioCounter}`;
  const versionId = `ver_${++versionCounter}`;
  const changeLogId = `chg_${++changeLogCounter}`;
  const createdAt = nowIso();

  const version = {
    id: versionId,
    scenarioId,
    number: 1,
    title,
    premise,
    openingSituation,
    createdAt,
  };

  const scenario = {
    id: scenarioId,
    status: "active",
    title,
    premise,
    openingSituation,
    duplicateHash,
    currentVersionId: versionId,
    versionIds: [versionId],
    changeLogIds: [changeLogId],
    createdAt,
    updatedAt: createdAt,
  };

  const changeLog = {
    id: changeLogId,
    scenarioId,
    versionId,
    action: "created",
    fromStatus: null,
    toStatus: "active",
    note: "Version 1 created automatically on first save",
    createdAt,
  };

  versions.set(versionId, version);
  scenarios.set(scenarioId, scenario);
  changeLogs.set(changeLogId, changeLog);
  duplicateIndex.set(duplicateHash, scenarioId);

  return { scenario, version, changeLog };
};

const hydrateScenario = (scenario) => {
  if (!scenario) {
    return null;
  }

  const scenarioVersions = scenario.versionIds
    .map((versionId) => versions.get(versionId))
    .filter(Boolean);

  const scenarioChangeLogs = scenario.changeLogIds
    .map((changeLogId) => changeLogs.get(changeLogId))
    .filter(Boolean);

  return {
    ...scenario,
    versions: scenarioVersions,
    changeLogs: scenarioChangeLogs,
  };
};

export const listScenarios = () =>
  Array.from(scenarios.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(hydrateScenario);

export const getScenarioById = (scenarioId) => hydrateScenario(scenarios.get(scenarioId));

export const allowedScenarioStatuses = ["active", "replaced", "flagged"];

import {
  getAreaThread,
  getDirectChatThread,
  getScenarioThread,
  postAreaMessage,
  postDirectChatMessage,
  postScenarioMessage,
} from "../services/chatService.js";

export async function getDirectChat(req, res) {
  try {
    const thread = await getDirectChatThread(req.user.id, String(req.params.connectionId || ""));
    return res.json({ thread });
  } catch (error) {
    return res.status(404).json({ error: error.message || "Direct chat not found." });
  }
}

export async function postDirectChat(req, res) {
  try {
    const result = await postDirectChatMessage(
      req.user.id,
      String(req.params.connectionId || ""),
      req.body?.content,
    );
    return res.status(201).json(result);
  } catch (error) {
    const statusCode = error.message === "Message content is required." ? 400 : 404;
    return res.status(statusCode).json({ error: error.message || "Unable to send direct message." });
  }
}

export function getScenarioChat(req, res) {
  const scenarioId = String(req.query?.scenarioId || "starter-scenario");
  const thread = getScenarioThread(scenarioId);
  return res.json({ thread, type: "scenario" });
}

export function postScenarioChat(req, res) {
  try {
    const scenarioId = String(req.body?.scenarioId || "starter-scenario");
    const thread = postScenarioMessage(req.user.id, scenarioId, req.body?.content);
    return res.status(201).json({ thread, type: "scenario" });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to send scenario message." });
  }
}

export function getAreaChat(req, res) {
  const areaId = String(req.query?.areaId || "guild-plaza");
  const thread = getAreaThread(areaId);
  return res.json({ thread, type: "area" });
}

export function postAreaChat(req, res) {
  try {
    const areaId = String(req.body?.areaId || "guild-plaza");
    const thread = postAreaMessage(req.user.id, areaId, req.body?.content);
    return res.status(201).json({ thread, type: "area" });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to send area message." });
  }
}

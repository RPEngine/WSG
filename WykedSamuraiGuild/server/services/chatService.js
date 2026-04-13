import {
  addChannelMessage,
  addDirectMessage,
  getChannelThread,
  getDirectThread,
} from "../models/chatStore.js";
import { findUserById } from "../models/userStore.js";

function cleanMessageContent(content) {
  return String(content || "").trim();
}

function assertMessageContent(content) {
  const trimmed = cleanMessageContent(content);
  if (!trimmed) {
    throw new Error("Message content is required.");
  }
  return trimmed;
}

export async function getDirectChatThread(userId, connectionId) {
  const participant = await findUserById(connectionId);
  if (!participant) {
    throw new Error("Connection not found.");
  }
  return getDirectThread(userId, connectionId);
}

export async function postDirectChatMessage(userId, connectionId, content) {
  const participant = await findUserById(connectionId);
  if (!participant) {
    throw new Error("Connection not found.");
  }

  const messageContent = assertMessageContent(content);
  const message = addDirectMessage({
    senderId: userId,
    recipientId: connectionId,
    content: messageContent,
  });

  return {
    message,
    thread: getDirectThread(userId, connectionId),
  };
}

export function getScenarioThread(scenarioId = "starter-scenario") {
  return getChannelThread({ type: "scenario", id: scenarioId });
}

export function postScenarioMessage(userId, scenarioId, content) {
  const messageContent = assertMessageContent(content);
  addChannelMessage({
    type: "scenario",
    id: scenarioId,
    senderId: userId,
    content: messageContent,
  });

  return getScenarioThread(scenarioId);
}

export function getAreaThread(areaId = "guild-plaza") {
  return getChannelThread({ type: "area", id: areaId });
}

export function postAreaMessage(userId, areaId, content) {
  const messageContent = assertMessageContent(content);
  addChannelMessage({
    type: "area",
    id: areaId,
    senderId: userId,
    content: messageContent,
  });

  return getAreaThread(areaId);
}

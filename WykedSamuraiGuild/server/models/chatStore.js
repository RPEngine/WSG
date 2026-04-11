import crypto from "crypto";

const directThreads = new Map();
const scenarioStreams = new Map();
const areaStreams = new Map();

function nowIso() {
  return new Date().toISOString();
}

function toThreadKey(userAId, userBId) {
  return [String(userAId), String(userBId)].sort().join(":");
}

function buildMessage({ senderId, content }) {
  return {
    id: crypto.randomUUID(),
    senderId,
    content: String(content || "").trim(),
    createdAt: nowIso(),
  };
}

export function getDirectThread(userAId, userBId) {
  const key = toThreadKey(userAId, userBId);
  const messages = directThreads.get(key) || [];
  return {
    key,
    participants: [userAId, userBId],
    messages,
  };
}

export function addDirectMessage({ senderId, recipientId, content }) {
  const key = toThreadKey(senderId, recipientId);
  const nextMessage = buildMessage({ senderId, content });
  const existing = directThreads.get(key) || [];
  const updated = [...existing, nextMessage].slice(-200);
  directThreads.set(key, updated);
  return nextMessage;
}

function getChannelStore(type) {
  if (type === "scenario") {
    return scenarioStreams;
  }
  return areaStreams;
}

export function getChannelThread({ type, id }) {
  const store = getChannelStore(type);
  const key = String(id || "").trim() || (type === "scenario" ? "starter-scenario" : "guild-plaza");
  const messages = store.get(key) || [];
  return { id: key, messages };
}

export function addChannelMessage({ type, id, senderId, content }) {
  const store = getChannelStore(type);
  const key = String(id || "").trim() || (type === "scenario" ? "starter-scenario" : "guild-plaza");
  const nextMessage = buildMessage({ senderId, content });
  const existing = store.get(key) || [];
  const updated = [...existing, nextMessage].slice(-300);
  store.set(key, updated);
  return { channelId: key, message: nextMessage };
}

import { findUserById, listUsers } from "../models/userStore.js";

function toConnectionSummary(user) {
  return {
    id: user.id,
    displayName: user.displayName || user.legalName || user.username || "Guild Member",
    username: user.username || "member",
    role: user.role || "employee_member",
    status: "online",
    unreadCount: 0,
  };
}

function matchConnection(connection, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) {
    return true;
  }

  return [connection.displayName, connection.username, connection.role]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export async function listConnectionsForUser(userId) {
  const currentUser = await findUserById(userId);
  if (!currentUser) {
    return [];
  }

  const users = await listUsers();
  return users
    .filter((user) => user.id !== userId)
    .map(toConnectionSummary)
    .slice(0, 100);
}

export async function searchConnectionsForUser(userId, query = "") {
  const connections = await listConnectionsForUser(userId);
  return connections
    .filter((connection) => matchConnection(connection, query))
    .slice(0, 50);
}

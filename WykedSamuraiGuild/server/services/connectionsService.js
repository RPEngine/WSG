export async function listConnectionsForUser(userId) {
  if (!userId) return [];
  return [];
}

export async function searchConnectionsForUser(userId, query = "") {
  if (!userId || !String(query || "").trim()) return [];
  return [];
}

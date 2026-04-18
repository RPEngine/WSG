import {
  listConnectionsForUser,
  searchConnectionsForUser,
} from "../services/connectionsService.js";

export async function listConnections(req, res) {
  try {
    const userId = req.user?.id || null;
    if (!userId) {
      return res.json({ items: [], connections: [], count: 0 });
    }
    const items = await listConnectionsForUser(userId);
    return res.json({ items, count: items.length });
  } catch (error) {
    console.warn("[connections] list fallback", {
      userId: req.user?.id || null,
      error: error?.message || "Unable to list connections.",
    });
    return res.json({ items: [], connections: [], count: 0, degraded: true });
  }
}

export async function searchConnections(req, res) {
  const query = String(req.query?.q || "");
  const items = await searchConnectionsForUser(req.user.id, query);
  return res.json({ items, count: items.length, query });
}

import {
  listConnectionsForUser,
  searchConnectionsForUser,
} from "../services/connectionsService.js";

export async function listConnections(req, res) {
  const userId = req.user?.id || null;
  if (!userId) {
    return res.json({ items: [], connections: [], count: 0 });
  }
  const items = await listConnectionsForUser(userId);
  return res.json({ items, count: items.length });
}

export async function searchConnections(req, res) {
  const query = String(req.query?.q || "");
  const items = await searchConnectionsForUser(req.user.id, query);
  return res.json({ items, count: items.length, query });
}

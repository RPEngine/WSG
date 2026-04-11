import { getUserFromSessionToken } from "../services/authService.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const sessionToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  const user = getUserFromSessionToken(sessionToken);
  if (!user) {
    console.warn("[auth] requireAuth failed", { hasAuthorizationHeader: Boolean(authHeader), hasSessionToken: Boolean(sessionToken) });
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("[auth] requireAuth success", { userId: user.id, email: user.email });
  req.user = user;
  return next();
}

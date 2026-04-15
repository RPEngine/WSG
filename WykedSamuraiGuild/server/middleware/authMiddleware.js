import { getSessionWithUser } from "../models/userStore.js";
import { getUserFromSessionToken, isRecentAuth } from "../services/authService.js";
import { requiresPolicyReacceptance } from "../config/policy.js";

export async function requireSessionAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const sessionToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  const user = await getUserFromSessionToken(sessionToken);
  if (!user) {
    console.warn("[auth] requireAuth failed", { hasAuthorizationHeader: Boolean(authHeader), hasSessionToken: Boolean(sessionToken) });
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("[auth] requireAuth success", { userId: user.id, email: user.email });
  req.user = user;
  req.sessionToken = sessionToken;
  return next();
}

export async function requireAuth(req, res, next) {
  await requireSessionAuth(req, res, async () => {
    if (requiresPolicyReacceptance(req.user)) {
      return res.status(403).json({
        error: "Policy acceptance is required before accessing protected resources.",
        policy_reacceptance_required: true,
      });
    }
    return next();
  });
}

export async function requireRecentReauth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const sessionToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!sessionToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const session = await getSessionWithUser(sessionToken);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!isRecentAuth(session)) {
    return res.status(403).json({
      error: "Re-authentication required for this action.",
      reauth_required: true,
    });
  }

  return next();
}

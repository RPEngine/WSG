import {
  getUserFromSessionToken,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/authService.js";

function tokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return "";
}

export function register(req, res) {
  try {
    const result = registerUser(req.body || {});
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to register." });
  }
}

export function login(req, res) {
  try {
    const result = loginUser(req.body || {});
    return res.json(result);
  } catch (error) {
    return res.status(401).json({ error: error.message || "Unable to login." });
  }
}

export function logout(req, res) {
  const sessionToken = tokenFromRequest(req);
  logoutUser(sessionToken);

  return res.status(204).send();
}

export function me(req, res) {
  const sessionToken = tokenFromRequest(req);
  const user = getUserFromSessionToken(sessionToken);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.json({ user });
}

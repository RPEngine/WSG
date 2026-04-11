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

export async function register(req, res) {
  const email = req.body?.email || "";
  const role = req.body?.role || "";
  console.log("[auth] signup request received", {
    email,
    role,
    fields: Object.keys(req.body || {}),
  });
  try {
    const result = await registerUser(req.body || {});
    console.log("[auth] signup success", {
      userId: result?.user?.id,
      email: result?.user?.email,
      role: result?.user?.role,
    });
    return res.status(201).json(result);
  } catch (error) {
    console.warn("[auth] signup failure", {
      email,
      error: error.message || "Unable to register.",
    });
    return res.status(400).json({ error: error.message || "Unable to register." });
  }
}

export async function login(req, res) {
  const identifier = req.body?.identifier || req.body?.email || "";
  console.log("[auth] login request received", {
    identifier,
    fields: Object.keys(req.body || {}),
  });
  try {
    const result = await loginUser(req.body || {});
    console.log("[auth] login success", {
      userId: result?.user?.id,
      email: result?.user?.email,
    });
    return res.json(result);
  } catch (error) {
    console.warn("[auth] login failure", {
      identifier,
      error: error.message || "Unable to login.",
    });
    return res.status(401).json({ error: error.message || "Unable to login." });
  }
}

export async function logout(req, res) {
  const sessionToken = tokenFromRequest(req);
  await logoutUser(sessionToken);

  return res.status(204).send();
}

export async function me(req, res) {
  const sessionToken = tokenFromRequest(req);
  const user = await getUserFromSessionToken(sessionToken);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.json({ user });
}

import crypto from "crypto";
import {
  createSession,
  createUser,
  deleteSession,
  findUserByIdentifier,
  findUserById,
  getSession,
  toPublicUser,
  touchLastActiveAt,
} from "../models/userStore.js";

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

const PASSWORD_POLICY_MESSAGE = "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function validatePassword(password) {
  return typeof password === "string" && PASSWORD_POLICY_REGEX.test(password);
}

const VALID_ROLES = new Set(["employee_member", "employer", "recruiter"]);

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deriveUsername({ legalName, email }) {
  const emailLocalPart = String(email || "").split("@")[0];
  const legalNameSlug = slugify(legalName);
  const emailSlug = slugify(emailLocalPart);
  const base = legalNameSlug || emailSlug || "member";
  return base.slice(0, 24) || "member";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function scaffoldVerificationPlan({ email, backupEmail }) {
  const normalizedPrimaryEmail = String(email || "").trim();
  const normalizedBackupEmail = String(backupEmail || "").trim();

  return {
    primaryEmail: {
      required: true,
      email: normalizedPrimaryEmail,
      status: "pending",
      sendMode: "mocked",
      mockReason: "mail-delivery-not-configured",
      nextAction: "triggerPrimaryEmailVerificationCode",
    },
    backupEmail: normalizedBackupEmail
      ? {
          required: true,
          email: normalizedBackupEmail,
          status: "pending",
          sendMode: "mocked",
          mockReason: "mail-delivery-not-configured",
          nextAction: "triggerBackupEmailRecoveryCode",
        }
      : {
          required: false,
          email: "",
          status: "not_provided",
          sendMode: "none",
          nextAction: "promptBackupEmailCapture",
        },
  };
}

function mockVerificationDispatch(verificationPlan) {
  // Hook: replace this with actual provider integration when transactional email is enabled.
  return {
    mode: "mocked",
    queuedAt: new Date().toISOString(),
    channels: [
      verificationPlan.primaryEmail.required ? "primary-email" : null,
      verificationPlan.backupEmail.required ? "backup-email" : null,
    ].filter(Boolean),
  };
}

export function registerUser(payload = {}) {
  const legalName = payload.legalName?.trim() || "";
  const email = payload.email?.trim() || "";
  const password = payload.password || "";
  const role = payload.role?.trim() || "";
  const organizationName = payload.organizationName?.trim() || "";
  const backupEmail = payload.backupEmail?.trim() || "";
  const username = deriveUsername({ legalName, email });
  const displayName = legalName;

  if (!legalName || legalName.length < 2) {
    throw new Error("Legal name is required.");
  }
  if (!validateEmail(email)) {
    throw new Error("Primary email must be valid.");
  }
  if (!validatePassword(password)) {
    throw new Error(PASSWORD_POLICY_MESSAGE);
  }
  if (!VALID_ROLES.has(role)) {
    throw new Error("A valid role is required.");
  }
  if (findUserByIdentifier(email)) {
    throw new Error("That email is already in use.");
  }
  if (backupEmail && !validateEmail(backupEmail)) {
    throw new Error("Backup email must be valid.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const user = createUser({
    username,
    displayName,
    legalName,
    email,
    role,
    organizationName,
    backupEmail,
    emailVerified: false,
    backupEmailVerified: false,
    passwordHash,
    passwordSalt: salt,
  });
  const sessionToken = createSession(user.id);
  const verificationPlan = scaffoldVerificationPlan({ email, backupEmail });
  const verificationDispatch = mockVerificationDispatch(verificationPlan);

  return { user, sessionToken, verificationPlan, verificationDispatch };
}

export function loginUser(payload = {}) {
  const identifier = payload.identifier?.trim() || payload.email?.trim() || "";
  const password = payload.password || "";

  if (!identifier || !password) {
    throw new Error("Identifier and password are required.");
  }

  const user = findUserByIdentifier(identifier);
  if (!user) {
    throw new Error("Invalid credentials.");
  }

  const attemptedHash = hashPassword(password, user.passwordSalt);
  if (attemptedHash !== user.passwordHash) {
    throw new Error("Invalid credentials.");
  }

  touchLastActiveAt(user.id);
  const sessionToken = createSession(user.id);
  return { user: toPublicUser(user), sessionToken };
}

export function logoutUser(sessionToken) {
  if (sessionToken) {
    deleteSession(sessionToken);
  }
}

export function getUserFromSessionToken(sessionToken) {
  if (!sessionToken) {
    return null;
  }

  const session = getSession(sessionToken);
  if (!session) {
    return null;
  }

  const user = findUserById(session.userId);
  if (!user) {
    return null;
  }

  touchLastActiveAt(user.id);
  return toPublicUser(user);
}

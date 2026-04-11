import bcrypt from "bcrypt";
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

const PASSWORD_POLICY_MESSAGE = "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function validatePassword(password) {
  return typeof password === "string" && PASSWORD_POLICY_REGEX.test(password);
}

const VALID_ROLES = new Set(["employee_member", "employer", "recruiter"]);

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
  return {
    mode: "mocked",
    queuedAt: new Date().toISOString(),
    channels: [
      verificationPlan.primaryEmail.required ? "primary-email" : null,
      verificationPlan.backupEmail.required ? "backup-email" : null,
    ].filter(Boolean),
  };
}

export async function registerUser(payload = {}) {
  const legalName = payload.legalName?.trim() || "";
  const email = payload.email?.trim() || "";
  const password = payload.password || "";
  const role = payload.role?.trim() || "";
  const organizationName = payload.organizationName?.trim() || "";
  const backupEmail = payload.backupEmail?.trim() || "";
  const displayName = legalName;

  if (!legalName || legalName.length < 2) throw new Error("Legal name is required.");
  if (!validateEmail(email)) throw new Error("Primary email must be valid.");
  if (!validatePassword(password)) throw new Error(PASSWORD_POLICY_MESSAGE);
  if (!VALID_ROLES.has(role)) throw new Error("A valid role is required.");
  if (backupEmail && !validateEmail(backupEmail)) throw new Error("Backup email must be valid.");

  const existingUser = await findUserByIdentifier(email);
  if (existingUser) throw new Error("That email is already in use.");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({
    displayName,
    legalName,
    email,
    role,
    organizationName,
    backupEmail,
    passwordHash,
  });

  const sessionToken = await createSession(user.id);
  const verificationPlan = scaffoldVerificationPlan({ email, backupEmail });
  const verificationDispatch = mockVerificationDispatch(verificationPlan);

  return { user, sessionToken, verificationPlan, verificationDispatch };
}

export async function loginUser(payload = {}) {
  const identifier = payload.identifier?.trim() || payload.email?.trim() || "";
  const password = payload.password || "";

  if (!identifier || !password) throw new Error("Identifier and password are required.");

  const user = await findUserByIdentifier(identifier);
  if (!user) throw new Error("Invalid credentials.");

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) throw new Error("Invalid credentials.");

  await touchLastActiveAt(user.id);
  const sessionToken = await createSession(user.id);
  return { user: await toPublicUser(user), sessionToken };
}

export async function logoutUser(sessionToken) {
  if (sessionToken) {
    await deleteSession(sessionToken);
  }
}

export async function getUserFromSessionToken(sessionToken) {
  if (!sessionToken) return null;

  const session = await getSession(sessionToken);
  if (!session) return null;

  const user = await findUserById(session.user_id);
  if (!user) return null;

  await touchLastActiveAt(user.id);
  return toPublicUser(user);
}

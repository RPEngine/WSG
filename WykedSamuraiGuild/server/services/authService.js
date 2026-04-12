import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
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
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
const GOOGLE_CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || "").trim();
const googleOauthClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

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
  if (!user.password_hash) {
    throw new Error("This account uses Google sign-in. Continue with Google to access it.");
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) throw new Error("Invalid credentials.");

  await touchLastActiveAt(user.id);
  const sessionToken = await createSession(user.id);
  return { user: await toPublicUser(user), sessionToken };
}

export async function authenticateWithGoogle(payload = {}) {
  const credential = String(payload.credential || "").trim();

  if (!GOOGLE_CLIENT_ID || !googleOauthClient) {
    throw new Error("Google sign-in is not configured on the server.");
  }

  if (!credential) {
    throw new Error("Google credential is required.");
  }

  let ticket;
  try {
    ticket = await googleOauthClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
  } catch {
    throw new Error("Invalid Google credential.");
  }

  const verifiedPayload = ticket.getPayload() || {};
  const issuer = String(verifiedPayload.iss || "");
  const audience = String(verifiedPayload.aud || "");
  const email = String(verifiedPayload.email || "").trim().toLowerCase();
  const emailVerified = verifiedPayload.email_verified === true;
  const fullName = String(verifiedPayload.name || "").trim();
  const subject = String(verifiedPayload.sub || "").trim();

  if (!GOOGLE_ISSUERS.has(issuer)) throw new Error("Invalid Google token issuer.");
  if (audience !== GOOGLE_CLIENT_ID) throw new Error("Google token audience mismatch.");
  if (!email || !validateEmail(email)) throw new Error("Google account email is invalid.");
  if (!emailVerified) throw new Error("Google account email must be verified.");
  if (!subject) throw new Error("Google account identifier is missing.");

  const existingUser = await findUserByIdentifier(email);
  const user = existingUser || await createUser({
    displayName: fullName || email.split("@")[0] || "Guild Member",
    legalName: fullName || email.split("@")[0] || "Guild Member",
    email,
    role: "employee_member",
    organizationName: "",
    backupEmail: "",
    passwordHash: null,
    authProvider: "google",
    providerSubject: subject,
  });

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

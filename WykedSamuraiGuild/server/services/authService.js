import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import {
  consumeAuthChallenge,
  createAuthChallenge,
  createSession,
  createUser,
  deleteSession,
  findUserByIdentifier,
  findUserById,
  getSession,
  getSessionWithUser,
  markSessionReauthenticated,
  toPublicUser,
  touchLastActiveAt,
  updateUserPolicyAcceptance,
} from "../models/userStore.js";
import {
  createPolicyAcceptanceRecord,
  createVerificationPlaceholder,
  requiresPolicyReacceptance,
} from "../config/policy.js";

const PASSWORD_POLICY_MESSAGE = "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
const GOOGLE_CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || "").trim();
const googleOauthClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const isProduction = process.env.NODE_ENV === "production";
const MFA_CODE = String(process.env.MFA_TEST_CODE || (isProduction ? "" : "000000"));
const REAUTH_WINDOW_MS = Number(process.env.REAUTH_WINDOW_MS || (1000 * 60 * 15));

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
  const policyAgreement = payload.policyAgreement === true;
  const userAgent = String(payload.userAgent || "").trim();
  const ipAddress = String(payload.ipAddress || "").trim();
  const displayName = legalName;

  if (!legalName || legalName.length < 2) throw new Error("Legal name is required.");
  if (!validateEmail(email)) throw new Error("Primary email must be valid.");
  if (!validatePassword(password)) throw new Error(PASSWORD_POLICY_MESSAGE);
  if (!VALID_ROLES.has(role)) throw new Error("A valid role is required.");
  if (backupEmail && !validateEmail(backupEmail)) throw new Error("Backup email must be valid.");
  if (!policyAgreement) throw new Error("You must accept the Guild policy requirements to create an account.");

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
    policyAcceptance: createPolicyAcceptanceRecord({ userAgent, ipAddress }),
    verification: createVerificationPlaceholder(),
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
  const previousSessionToken = String(payload.sessionToken || payload.currentSessionToken || "").trim();
  if (user.mfa_enabled === true) {
    const mfaChallengeToken = await createAuthChallenge(user.id, "login_mfa");
    return { user: await toPublicUser(user), mfa_required: true, mfa_challenge_token: mfaChallengeToken };
  }

  const sessionToken = await createSession(user.id, { replaceToken: previousSessionToken });
  return { user: await toPublicUser(user), sessionToken };
}

export async function authenticateWithGoogle(payload = {}) {
  const credential = String(payload.idToken || payload.credential || "").trim();

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
  const issuer = String(verifiedPayload.iss || "").trim();
  const audience = String(verifiedPayload.aud || "");
  const email = String(verifiedPayload.email || "").trim().toLowerCase();
  const emailVerified = verifiedPayload.email_verified === true;
  const fullName = String(verifiedPayload.name || "").trim();
  const subject = String(verifiedPayload.sub || "").trim();
  const expUnixSeconds = Number(verifiedPayload.exp || 0);

  if (!GOOGLE_ISSUERS.has(issuer)) throw new Error("Invalid Google token issuer.");
  if (audience !== GOOGLE_CLIENT_ID) throw new Error("Google token audience mismatch.");
  if (!email || !validateEmail(email)) throw new Error("Google account email is invalid.");
  if (!emailVerified) throw new Error("Google account email must be verified.");
  if (!subject) throw new Error("Google account identifier is missing.");
  if (!expUnixSeconds || Number.isNaN(expUnixSeconds) || (expUnixSeconds * 1000) <= Date.now()) {
    throw new Error("Google token is expired.");
  }

  const existingUser = await findUserByIdentifier(email);
  if (existingUser?.auth_provider === "google" && existingUser?.provider_subject && existingUser.provider_subject !== subject) {
    throw new Error("Google account identity mismatch.");
  }

  let user = existingUser;
  if (!user) {
    const policyAgreement = payload.policyAgreement === true;
    if (!policyAgreement) {
      throw new Error("You must accept the Guild policy requirements to create an account.");
    }
    const userAgent = String(payload.userAgent || "").trim();
    const ipAddress = String(payload.ipAddress || "").trim();
    user = await createUser({
      displayName: fullName || email.split("@")[0] || "Guild Member",
      legalName: fullName || email.split("@")[0] || "Guild Member",
      email,
      role: "employee_member",
      organizationName: "",
      backupEmail: "",
      passwordHash: null,
      authProvider: "google",
      providerSubject: subject,
      policyAcceptance: createPolicyAcceptanceRecord({ userAgent, ipAddress }),
      verification: createVerificationPlaceholder(),
    });
  }

  await touchLastActiveAt(user.id);
  if (user.mfa_enabled === true) {
    const mfaChallengeToken = await createAuthChallenge(user.id, "login_mfa");
    return { user: await toPublicUser(user), mfa_required: true, mfa_challenge_token: mfaChallengeToken };
  }

  const previousSessionToken = String(payload.sessionToken || payload.currentSessionToken || "").trim();
  const sessionToken = await createSession(user.id, {
    replaceToken: previousSessionToken,
    mfaConfirmed: user.mfa_enabled === true,
  });
  return { user: await toPublicUser(user), sessionToken };
}

export async function acceptCurrentPolicies(payload = {}) {
  const sessionToken = String(payload.sessionToken || "").trim();
  if (!sessionToken) throw new Error("Session token is required.");
  if (payload.policyAgreement !== true) throw new Error("Policy agreement is required.");

  const user = await getUserFromSessionToken(sessionToken);
  if (!user?.id) throw new Error("Unauthorized.");

  const userAgent = String(payload.userAgent || "").trim();
  const ipAddress = String(payload.ipAddress || "").trim();
  const policyAcceptance = createPolicyAcceptanceRecord({ userAgent, ipAddress });
  const updatedUser = await updateUserPolicyAcceptance(user.id, policyAcceptance);
  return { user: await toPublicUser(updatedUser) };
}

function verifyMfaCode(code) {
  if (!MFA_CODE) {
    return false;
  }
  return String(code || "").trim() === MFA_CODE;
}

export async function verifyMfaChallenge(payload = {}) {
  const challengeToken = String(payload.mfa_challenge_token || "").trim();
  const code = String(payload.code || "").trim();
  const previousSessionToken = String(payload.sessionToken || payload.currentSessionToken || "").trim();
  if (!challengeToken || !code) throw new Error("MFA challenge token and code are required.");
  if (!verifyMfaCode(code)) throw new Error("Invalid MFA code.");

  const challenge = await consumeAuthChallenge(challengeToken, "login_mfa");
  if (!challenge) throw new Error("MFA challenge is invalid or expired.");

  const user = await findUserById(challenge.user_id);
  if (!user) throw new Error("User not found for MFA challenge.");

  await touchLastActiveAt(user.id);
  const sessionToken = await createSession(user.id, { replaceToken: previousSessionToken, mfaConfirmed: true });
  return { user: await toPublicUser(user), sessionToken };
}

export async function reauthenticateSession(payload = {}) {
  const sessionToken = String(payload.sessionToken || "").trim();
  const password = String(payload.password || "");
  const code = String(payload.code || "").trim();
  const googleIdToken = String(payload.idToken || payload.credential || "").trim();
  if (!sessionToken) throw new Error("Session token is required.");

  const session = await getSessionWithUser(sessionToken);
  if (!session) throw new Error("Unauthorized.");

  if (session.mfa_enabled === true) {
    if (!verifyMfaCode(code)) throw new Error("Invalid MFA code.");
    await markSessionReauthenticated(sessionToken, { mfaConfirmed: true });
    return { reauthenticated: true, method: "mfa" };
  }

  if (session.password_hash) {
    const isValidPassword = await bcrypt.compare(password, session.password_hash);
    if (!isValidPassword) throw new Error("Invalid credentials.");
    await markSessionReauthenticated(sessionToken, { mfaConfirmed: false });
    return { reauthenticated: true, method: "password" };
  }

  if (!googleIdToken) throw new Error("Google ID token is required.");
  const ticket = await googleOauthClient.verifyIdToken({ idToken: googleIdToken, audience: GOOGLE_CLIENT_ID });
  const verifiedPayload = ticket.getPayload() || {};
  const subject = String(verifiedPayload.sub || "").trim();
  const emailVerified = verifiedPayload.email_verified === true;
  if (!emailVerified || !subject || subject !== String(session.provider_subject || "").trim()) {
    throw new Error("Google re-authentication failed.");
  }

  await markSessionReauthenticated(sessionToken, { mfaConfirmed: false });
  return { reauthenticated: true, method: "google" };
}

export function isRecentAuth(session) {
  const authenticatedAt = new Date(session?.authenticated_at || 0).getTime();
  if (!authenticatedAt || Number.isNaN(authenticatedAt)) return false;
  return (Date.now() - authenticatedAt) <= REAUTH_WINDOW_MS;
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
  const publicUser = await toPublicUser(user);
  return {
    ...publicUser,
    requiresPolicyAcceptance: requiresPolicyReacceptance(publicUser),
  };
}

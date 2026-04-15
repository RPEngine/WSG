export const CURRENT_POLICY_VERSION = "v1.0";

const REQUIRED_POLICY_KEYS = ["codeOfConduct", "contentPolicy", "platformRules"];

export function normalizePolicyAcceptance(policyAcceptance) {
  if (!policyAcceptance || typeof policyAcceptance !== "object") {
    return {};
  }
  return policyAcceptance;
}

export function hasAcceptedCurrentPolicies(userLike) {
  const acceptance = normalizePolicyAcceptance(userLike?.policy_acceptance || userLike?.policyAcceptance);
  return REQUIRED_POLICY_KEYS.every((key) => {
    const record = acceptance?.[key];
    return Boolean(
      record
      && record.accepted === true
      && String(record.policyVersion || "") === CURRENT_POLICY_VERSION
      && record.acceptedAt,
    );
  });
}

export function requiresPolicyReacceptance(userLike) {
  return !hasAcceptedCurrentPolicies(userLike);
}

export function createPolicyAcceptanceRecord({ acceptedAt = new Date().toISOString(), userAgent = "", ipAddress = "" } = {}) {
  const buildEntry = () => ({
    accepted: true,
    acceptedAt,
    policyVersion: CURRENT_POLICY_VERSION,
    ...(ipAddress ? { ipAddress } : {}),
    ...(userAgent ? { userAgent } : {}),
  });

  return {
    codeOfConduct: buildEntry(),
    contentPolicy: buildEntry(),
    platformRules: buildEntry(),
  };
}

export function createVerificationPlaceholder() {
  return {
    identityStatus: "none",
    provider: null,
    verifiedAt: null,
  };
}

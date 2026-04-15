const routes = {
  '/': { key: 'landing' },
  '/app': { key: 'home', requiresAuth: true },
  '/arena': { key: 'arena', requiresAuth: true },
  '/guild-world': { key: 'guild', requiresAuth: true },
  '/members': { key: 'members', requiresAuth: true },
  '/profile': { key: 'profile', requiresAuth: true },
  '/profile/direct-chat': { key: 'directChat', requiresAuth: true },
  '/profile/scenario-chat': { key: 'scenarioChat', requiresAuth: true },
  '/profile/area-chat': { key: 'areaChat', requiresAuth: true },
  '/scenario': { key: 'scenarioDetail', requiresAuth: true },
  '/login': { key: 'login', guestOnly: true },
  '/signup': { key: 'signup', guestOnly: true },
  '/recruiter-console': { key: 'recruiter', requiresAuth: true },
};

const navItems = [
  ['Home', '/app'],
  ['Arena', '/arena'],
  ['Guild', '/guild-world'],
  ['World RP', '/guild-world'],
  ['Members', '/members'],
  ['Discussions', '/profile/scenario-chat'],
  ['Profile Hub', '/profile'],
  ['Recruiter Console', '/recruiter-console'],
];

const STARTER_TRIALS = [
  {
    id: 'find-your-why',
    title: 'The First Step: Find Your Why',
    description: 'Onboarding reflection scenario where you explore four halls and define your core motivation.',
    category: 'Onboarding',
    difficulty: 'Foundational',
    openingPrompt: 'Begin at the Compass Dais, visit each hall, and answer the final question to set your profile motivation.',
    suggestedRole: 'New Guild Member',
  },
  {
    id: 'team-conflict',
    title: 'Team Conflict',
    description: 'Resolve escalating conflict between two high-performing contributors before delivery deadlines slip.',
    category: 'People Management',
    difficulty: 'Intermediate',
    openingPrompt: 'Two senior specialists are publicly disagreeing in channel threads. You are asked to mediate immediately while preserving trust and output.',
    suggestedRole: 'Team Lead',
  },
  {
    id: 'customer-escalation',
    title: 'Customer Escalation',
    description: 'A strategic customer reports repeated failures and demands executive-level action within the hour.',
    category: 'Client Communication',
    difficulty: 'Advanced',
    openingPrompt: 'Your largest customer has issued a formal escalation after a production outage. They want a recovery plan and accountability now.',
    suggestedRole: 'Account Director',
  },
  {
    id: 'leadership-decision',
    title: 'Leadership Decision',
    description: 'Choose between speed and stability while leadership stakeholders push conflicting priorities.',
    category: 'Executive Judgment',
    difficulty: 'Intermediate',
    openingPrompt: 'You must decide whether to ship a risky feature this week or delay for quality, knowing each option carries business consequences.',
    suggestedRole: 'Head of Product',
  },
  {
    id: 'operational-crisis',
    title: 'Operational Crisis',
    description: 'Coordinate cross-functional response to cascading operational failures during peak demand.',
    category: 'Operations',
    difficulty: 'Advanced',
    openingPrompt: 'Logistics, support, and engineering all report blockers at once. You are now running incident command for the next 90 minutes.',
    suggestedRole: 'Operations Lead',
  },
  {
    id: 'ethical-dilemma',
    title: 'Ethical Dilemma',
    description: 'Navigate pressure to hit targets while concerns emerge about fairness and policy compliance.',
    category: 'Integrity & Compliance',
    difficulty: 'Advanced',
    openingPrompt: 'A manager suggests withholding critical context from a partner to close a quarter-end objective. Your decision will set precedent.',
    suggestedRole: 'Program Manager',
  },
];

const ROLEPLAY_ROOMS = [
  {
    id: 'ember-crossing',
    trialId: 'team-conflict',
    title: 'Ember Crossing Council',
    description: 'Open council room where guild officers resolve faction disputes and keep fragile alliances intact.',
    roleFocus: 'Diplomat',
    players: 7,
  },
  {
    id: 'dock-47',
    trialId: 'customer-escalation',
    title: 'Dock 47 Distress Channel',
    description: 'High-pressure response room reacting to incoming merchant convoy failures and sponsor complaints.',
    roleFocus: 'Incident Commander',
    players: 11,
  },
  {
    id: 'shadow-forge',
    trialId: 'leadership-decision',
    title: 'Shadow Forge War Room',
    description: 'Strategy room balancing delivery speed against defense readiness during active threat windows.',
    roleFocus: 'Strategist',
    players: 5,
  },
  {
    id: 'aurora-gate',
    trialId: 'operational-crisis',
    title: 'Aurora Gate Operations',
    description: 'Live operations room coordinating logistics, medical supply routes, and response priorities.',
    roleFocus: 'Operations Lead',
    players: 9,
  },
];

const FIRST_SCENARIO_ID = 'find-your-why';
const SCENARIO_BLUEPRINTS = Object.freeze({
  'find-your-why': {
    id: 'find-your-why',
    slug: 'find-your-why',
    title: 'The First Step: Find Your Why',
    description: 'Move through each hall to explore memory, ambition, burden, and connection before naming your core motivation.',
    objective: 'Visit each hall and gather your reflections, then return to the Compass Dais.',
    startLocation: 'compass_dais',
    locations: {
      compass_dais: {
        id: 'compass_dais',
        name: 'Compass Dais',
        prompt: 'The compass hums at your feet. Choose a hall to begin your reflection journey.',
      },
      hall_memory: {
        id: 'hall_memory',
        name: 'Hall of Memory',
        prompt: 'Recall a defining moment from your past. Which memory still guides you?',
        responses: [
          'A mentor believed in me before I believed in myself.',
          'A difficult failure taught me resilience and humility.',
          'A breakthrough moment showed what I can build with others.',
        ],
      },
      hall_ambition: {
        id: 'hall_ambition',
        name: 'Hall of Ambition',
        prompt: 'When you imagine your best future self, what drives that vision?',
        responses: [
          'Creating work that leaves a lasting impact.',
          'Leading teams that thrive under pressure.',
          'Continuously mastering my craft and passing it on.',
        ],
      },
      hall_burden: {
        id: 'hall_burden',
        name: 'Hall of Burden',
        prompt: 'Every path has weight. Which burden are you willing to carry?',
        responses: [
          'The responsibility of making hard decisions.',
          'The discipline of growth when comfort is easier.',
          'The patience required to build trust over time.',
        ],
      },
      hall_connection: {
        id: 'hall_connection',
        name: 'Hall of Connection',
        prompt: 'Who are you choosing to serve as you grow into leadership?',
        responses: [
          'My team and the people who rely on our work.',
          'My family and community who shaped my values.',
          'Future builders who need a path I can help create.',
        ],
      },
    },
    hallOrder: ['hall_memory', 'hall_ambition', 'hall_burden', 'hall_connection'],
    finalPrompt: 'What is your why?',
    finalResponses: [
      'To build meaningful work that lifts others.',
      'To lead with integrity when pressure rises.',
      'To turn hardship into guidance for my community.',
    ],
    completionMessage: 'Scenario complete. Your why is now anchored in your guild profile journey.',
  },
});

const BRAND_ASSETS = Object.freeze({
  logo: 'assets/branding/wyked-samurai-guild-logo-design.svg',
  hero: 'assets/branding/wyked-samurai-under-the-glowing-moon.svg',
});


function pageBackgroundClass(path, key) {
  if (path === '/arena' || key === 'arena') return 'arena-bg';
  if (path === '/guild-world' || key === 'guild') return 'guild-bg';
  if (path === '/recruiter-console' || key === 'recruiter') return 'recruiter-bg';
  if (['scenarioChat', 'areaChat', 'directChat'].includes(key)) return 'scenario-bg';
  if (path === '/members' || key === 'members' || key === 'profile') return 'guild-bg';
  return 'home-bg';
}

function applyPageBackground(path, key) {
  const pageClass = pageBackgroundClass(path, key);
  document.body.classList.remove('home-bg', 'arena-bg', 'guild-bg', 'scenario-bg', 'recruiter-bg');
  document.body.classList.add(pageClass);
}

function guildBrandMark({ compact = false, className = '' } = {}) {
  return `
    <div class="guild-brand-mark ${compact ? 'is-compact' : ''} ${className}">
      <img src="${BRAND_ASSETS.logo}" alt="Wyked Samurai Guild logo" loading="eager" decoding="async" />
    </div>
  `;
}


const PROFILE_LAYER_META = {
  free: { label: 'Free', hint: 'Basic guild identity' },
  professional: { label: 'Professional', hint: 'Career-facing profile layer' },
  roleplay: { label: 'Roleplay', hint: 'In-world RP persona layer' },
};
const PROFILE_LAYER_ORDER = ['free', 'professional', 'roleplay'];
const arenaLayoutPrefs = loadArenaLayoutPrefs();

const state = {
  mode: localStorage.getItem('wsg-mode') || 'professional',
  authToken: localStorage.getItem('wsg-auth-token') || '',
  currentUser: null,
  members: [],
  activeProfile: null,
  activeLayer: 'free',
  availableLayers: ['free'],
  lockedLayers: ['professional', 'roleplay'],
  layers: {},
  profileHub: {
    saving: false,
    message: '',
    tone: 'info',
  },
  authForms: {
    login: { message: '', tone: 'info', loading: false },
    signup: { message: '', tone: 'info', loading: false },
  },
  network: {
    connections: [],
    searchTerm: '',
    results: [],
    loading: false,
  },
  directChat: {
    activeConnectionId: '',
    messages: [],
    loading: false,
    pending: false,
    error: '',
  },
  scenarioChat: {
    scenarioId: 'starter-scenario',
    messages: [],
    loading: false,
    pending: false,
  },
  areaChat: {
    areaId: 'guild-plaza',
    messages: [],
    loading: false,
    pending: false,
  },
  membersLoaded: false,
  loading: false,
  arena: {
    activeTrialId: '',
    messages: [],
    pending: false,
    error: '',
    leftPanelCollapsed: arenaLayoutPrefs.leftPanelCollapsed,
    rightPanelCollapsed: arenaLayoutPrefs.rightPanelCollapsed,
    rightPanelTab: arenaLayoutPrefs.rightPanelTab,
    mobileLeftOpen: false,
    mobileRightOpen: false,
  },
  homeChat: {
    messages: [],
    pending: false,
    error: '',
  },
  shell: {
    activePaneTab: 'connections',
    selectedConversation: '',
    chatOpen: false,
    chatMinimized: false,
  },
  statusMessage: null,
  onboarding: {
    starterModalOpen: false,
  },
  scenarioDetail: {
    activeScenarioId: FIRST_SCENARIO_ID,
    sessions: {},
  },
};

const CANONICAL_BACKEND_BASE_URL = 'https://wsg-7hmk.onrender.com';
const BACKEND_BASE_URL_CONFIG_KEY = 'wsg-backend-base-url';
const AI_ENDPOINTS = Object.freeze({
  test: '/ai/test',
  chat: '/ai/chat',
  scenario: '/ai/scenario',
});
const ONBOARDING_NEW_USER_KEY = 'wsg-onboarding-new-user';
const STARTER_SCENARIO_SEEN_PREFIX = 'wsg-starter-seen';
const SCENARIO_PROGRESS_STORAGE_PREFIX = 'wsg-scenario-progress';
const PASSWORD_POLICY_MESSAGE = 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const GOOGLE_CLIENT_ID_META_KEY = 'wsg-google-client-id';
const ARENA_LAYOUT_STORAGE_KEY = 'wsg-arena-layout';

let googleInitialized = false;

function loadArenaLayoutPrefs() {
  try {
    const raw = localStorage.getItem(ARENA_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return {
        leftPanelCollapsed: false,
        rightPanelCollapsed: false,
        rightPanelTab: 'connections',
      };
    }
    const parsed = JSON.parse(raw);
    return {
      leftPanelCollapsed: Boolean(parsed.leftPanelCollapsed),
      rightPanelCollapsed: Boolean(parsed.rightPanelCollapsed),
      rightPanelTab: ['connections', 'chat', 'participants', 'status'].includes(parsed.rightPanelTab) ? parsed.rightPanelTab : 'connections',
    };
  } catch {
    return {
      leftPanelCollapsed: false,
      rightPanelCollapsed: false,
      rightPanelTab: 'connections',
    };
  }
}

function persistArenaLayoutPrefs() {
  try {
    localStorage.setItem(
      ARENA_LAYOUT_STORAGE_KEY,
      JSON.stringify({
        leftPanelCollapsed: state.arena.leftPanelCollapsed,
        rightPanelCollapsed: state.arena.rightPanelCollapsed,
        rightPanelTab: state.arena.rightPanelTab,
      })
    );
  } catch {
    // no-op: localStorage might be unavailable
  }
}

function linkFor(path) {
  return `#${path}`;
}

function setStatusMessage(message, tone = 'info') {
  state.statusMessage = message ? { message, tone } : null;
}

function setFormMessage(formName, message, tone = 'info') {
  if (!state.authForms[formName]) return;
  state.authForms[formName].message = message;
  state.authForms[formName].tone = tone;
}

function setProfileHubMessage(message, tone = 'info') {
  state.profileHub.message = message;
  state.profileHub.tone = tone;
}

function normalizeLayeredProfile(profilePayload) {
  const hasNestedUser = Boolean(profilePayload && typeof profilePayload === 'object' && profilePayload.user);
  const user = hasNestedUser ? profilePayload.user : (profilePayload || null);
  const availableLayers = hasNestedUser
    ? (profilePayload.availableLayers || ['free'])
    : (user?.availableLayers || ['free']);
  const lockedLayers = hasNestedUser
    ? (profilePayload.lockedLayers || ['professional', 'roleplay'])
    : (user?.lockedLayers || ['professional', 'roleplay']);
  const layers = hasNestedUser
    ? (profilePayload.layers || {})
    : (user?.layers || {});

  return { user, availableLayers, lockedLayers, layers };
}

function escapeAttr(value) {
  return escapeHtml(String(value || '')).replace(/"/g, '&quot;');
}

function getStarterScenarioSeenKey(userId) {
  return `${STARTER_SCENARIO_SEEN_PREFIX}:${userId}`;
}

function rememberNewUserForOnboarding(userId) {
  sessionStorage.setItem(ONBOARDING_NEW_USER_KEY, String(userId || ''));
}

function isFirstArrivalAfterSignup() {
  const userId = state.currentUser?.id;
  if (!userId) {
    return false;
  }
  const pendingOnboardingForUser = sessionStorage.getItem(ONBOARDING_NEW_USER_KEY);
  const hasSeenStarterScenario = localStorage.getItem(getStarterScenarioSeenKey(userId)) === 'true';
  return pendingOnboardingForUser === userId && !hasSeenStarterScenario;
}

function markStarterScenarioSeen() {
  if (!state.currentUser?.id) {
    return;
  }
  localStorage.setItem(getStarterScenarioSeenKey(state.currentUser.id), 'true');
  sessionStorage.removeItem(ONBOARDING_NEW_USER_KEY);
}

function getScenarioProgressStorageKey(userId = state.currentUser?.id) {
  const safeUserId = userId || 'anonymous';
  return `${SCENARIO_PROGRESS_STORAGE_PREFIX}:${safeUserId}`;
}

function sanitizeScenarioSessionForSave(scenarioId, session) {
  const scenario = findScenarioBlueprint(scenarioId);
  if (!scenario || !session) {
    return null;
  }

  const locationIds = new Set(Object.keys(scenario.locations || {}));
  const hallSet = new Set(scenario.hallOrder || []);
  const sanitizedAnswers = Object.entries(session.answers || {}).reduce((acc, [locationId, answer]) => {
    if (!hallSet.has(locationId)) {
      return acc;
    }
    const normalizedAnswer = String(answer || '').trim();
    if (!normalizedAnswer) {
      return acc;
    }
    acc[locationId] = normalizedAnswer;
    return acc;
  }, {});

  const completedHalls = Array.isArray(session.completedHalls)
    ? session.completedHalls.filter((locationId, index, array) => hallSet.has(locationId) && array.indexOf(locationId) === index)
    : [];
  const visitedLocations = Array.isArray(session.visitedLocations)
    ? session.visitedLocations.filter((locationId, index, array) => locationIds.has(locationId) && array.indexOf(locationId) === index)
    : [];
  const currentLocation = locationIds.has(session.currentLocation) ? session.currentLocation : scenario.startLocation;
  const finalAnswer = String(session.finalAnswer || '').trim();
  const finalSubmitted = Boolean(session.finalSubmitted && finalAnswer);
  const finalUnlocked = Boolean(session.finalUnlocked || completedHalls.length === scenario.hallOrder.length);

  return {
    scenarioId: scenario.id,
    currentLocation,
    answers: sanitizedAnswers,
    visitedLocations: visitedLocations.length ? visitedLocations : [scenario.startLocation],
    completedHalls,
    finalUnlocked,
    finalAnswer,
    finalSubmitted,
    completionMessageVisible: Boolean(finalSubmitted),
    updatedAt: new Date().toISOString(),
  };
}

function readPersistedScenarioProgress() {
  try {
    const raw = localStorage.getItem(getScenarioProgressStorageKey());
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persistScenarioProgress(scenarioId) {
  const session = state.scenarioDetail.sessions[scenarioId];
  const normalized = sanitizeScenarioSessionForSave(scenarioId, session);
  if (!normalized) {
    return;
  }

  const persisted = readPersistedScenarioProgress();
  persisted[scenarioId] = normalized;
  localStorage.setItem(getScenarioProgressStorageKey(), JSON.stringify(persisted));
}

function restoreScenarioProgress(scenarioId) {
  const persisted = readPersistedScenarioProgress();
  const savedSession = persisted?.[scenarioId];
  return sanitizeScenarioSessionForSave(scenarioId, savedSession);
}

function resetScenarioProgress(scenarioId) {
  const scenario = findScenarioBlueprint(scenarioId);
  if (!scenario) {
    return;
  }

  state.scenarioDetail.sessions[scenarioId] = {
    scenarioId,
    currentLocation: scenario.startLocation,
    answers: {},
    visitedLocations: [scenario.startLocation],
    completedHalls: [],
    finalUnlocked: false,
    finalAnswer: '',
    finalSubmitted: false,
    completionMessageVisible: false,
  };

  const persisted = readPersistedScenarioProgress();
  if (persisted[scenarioId]) {
    delete persisted[scenarioId];
    localStorage.setItem(getScenarioProgressStorageKey(), JSON.stringify(persisted));
  }
}

function resolveApiBaseUrl() {
  const { protocol, host } = window.location;
  const isLocalDevHost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const isRenderHost = /onrender\.com$/i.test(host);
  const configuredBackendBase = document
    .querySelector('meta[name="wsg-backend-base-url"]')
    ?.getAttribute('content');
  const configuredMetaBase = document
    .querySelector('meta[name="wsg-api-base-url"]')
    ?.getAttribute('content');
  if (isRenderHost) {
    const renderConfiguredBase = configuredBackendBase
      || window.WSG_BACKEND_BASE_URL
      || window.WSG_API_BASE_URL
      || configuredMetaBase
      || '';
    return (renderConfiguredBase || CANONICAL_BACKEND_BASE_URL).replace(/\/$/, '');
  }

  const configuredBase = configuredBackendBase
    || window.WSG_BACKEND_BASE_URL
    || (isLocalDevHost ? localStorage.getItem(BACKEND_BASE_URL_CONFIG_KEY) : '')
    || window.WSG_API_BASE_URL
    || configuredMetaBase
    || (isLocalDevHost ? localStorage.getItem('wsg-api-base-url') : '')
    || '';
  if (configuredBase) {
    return configuredBase.replace(/\/$/, '');
  }

  if (isLocalDevHost) {
    return CANONICAL_BACKEND_BASE_URL;
  }

  return `${protocol}//${host}`;
}

function apiUrl(path) {
  const baseUrl = resolveApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}${normalizedPath}`;
  }

  return `${baseUrl}/api${normalizedPath}`;
}

async function apiRequest(path, options = {}) {
  const requestUrl = apiUrl(path);
  const isAiRequest = path.includes('/ai') || path.includes('/scenarios');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (state.authToken) {
    headers.Authorization = `Bearer ${state.authToken}`;
  }

  let response;
  try {
    response = await fetch(requestUrl, { ...options, headers });
  } catch (error) {
    if (isAiRequest) {
      console.error('[ai:frontend] API network failure', {
        path,
        requestUrl,
        method: options.method || 'GET',
        status: null,
        responseText: null,
        errorMessage: error instanceof Error ? error.message : String(error),
        error,
      });
    }
    const message = error instanceof Error ? error.message : 'Unknown network error.';
    throw new Error(`Network error calling ${requestUrl}: ${message}`);
  }
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const bodyText = await response.text();
  const looksLikeJson = contentType.includes('application/json');

  let data = null;
  if (bodyText) {
    if (!looksLikeJson) {
      if (isAiRequest) {
        console.error('[ai:frontend] API non-JSON response', {
          path,
          requestUrl,
          method: options.method || 'GET',
          status: response.status,
          responseText: bodyText || null,
          errorMessage: `Expected JSON response but received: ${bodyText.slice(0, 120)}`,
        });
      }
      throw new Error(`Expected JSON response but received: ${bodyText.slice(0, 120)}`);
    }

    try {
      data = JSON.parse(bodyText);
    } catch (error) {
      if (isAiRequest) {
        console.error('[ai:frontend] API malformed JSON response', {
          path,
          requestUrl,
          method: options.method || 'GET',
          status: response.status,
          responseText: bodyText || null,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
      throw new Error(`Received malformed JSON response: ${bodyText.slice(0, 120)}`);
    }
  }

  if (!response.ok) {
    if (isAiRequest) {
      console.error('[ai:frontend] API request failed', {
        path,
        requestUrl,
        method: options.method || 'GET',
        status: response.status,
        responseText: bodyText || null,
        errorMessage: data?.error || response.statusText || 'Unknown error',
        error: data?.error || null,
      });
    }
    throw new Error(data?.error || `Request failed (${response.status}) at ${requestUrl}.`);
  }

  return data;
}

async function checkBackendHealth() {
  const healthUrl = apiUrl('/health');
  const response = await fetch(healthUrl);
  const contentType = response.headers.get('content-type') || '';
  const bodyText = await response.text();
  const isJson = contentType.includes('application/json');
  let data = null;

  if (bodyText && isJson) {
    try {
      data = JSON.parse(bodyText);
    } catch {
      throw new Error(`Backend returned malformed JSON health response: ${bodyText.slice(0, 120)}`);
    }
  }

  if (!response.ok) {
    const errorMessage = data?.error || bodyText || response.statusText || 'Request failed';
    throw new Error(`Health check failed (${response.status}) at ${healthUrl}: ${errorMessage}`);
  }

  if (!isJson) {
    throw new Error(`Backend returned non-JSON health response (${response.status})`);
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Backend returned an empty health payload.');
  }

  const requiredFields = ['status', 'service', 'timestamp'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Backend health payload is missing required field: ${field}`);
    }
  }

  if (Number.isNaN(Date.parse(data.timestamp))) {
    throw new Error(`Backend health payload has invalid timestamp: ${data.timestamp}`);
  }

  return data;
}

async function checkAiConnection() {
  return apiRequest(AI_ENDPOINTS.test, {
    method: 'GET',
  });
}


function isDebugAiMode() {
  if (window.WSG_DEBUG_AI === true) {
    return true;
  }

  try {
    return localStorage.getItem('wsg-debug-ai') === 'true';
  } catch {
    return false;
  }
}

function getArenaFriendlyErrorMessage(error) {
  const rawMessage = error instanceof Error ? error.message : 'AI provider request failed.';

  if (isDebugAiMode()) {
    return rawMessage;
  }

  if (rawMessage.includes('Friendli authentication failed.')) {
    return 'AI authentication failed. Please contact support.';
  }
  if (rawMessage.includes('Friendli endpoint or route not found.')) {
    return 'AI route is currently unavailable. Please try again shortly.';
  }
  if (rawMessage.includes('The AI endpoint is waking up or unavailable.')) {
    return 'AI is waking up. Please retry in a few seconds.';
  }

  return 'AI response unavailable right now. Please try again.';
}
async function requestArenaAssistantReply({ userMessage, activeTrial }) {
  const payload = {
    prompt: [
      `Active trial: ${activeTrial.title}`,
      `Trial opening: ${activeTrial.openingPrompt}`,
      `User response: ${userMessage}`,
      'Continue the simulation and return the next system message.',
    ].join('\n'),
    genre: activeTrial.category,
    tone: activeTrial.difficulty,
    constraints: 'Keep it concise and actionable.',
  };

  let data;
  data = await apiRequest(AI_ENDPOINTS.chat, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const content = parseAiChatResponse(data);
  if (!content) {
    throw new Error('AI scenario response did not include usable message text.');
  }

  return content;
}

const connectionChecks = {
  // Retained for future backend split architecture.
  backend: {
    label: 'Backend Health',
    run: checkBackendHealth,
  },
};

function card(title, body) {
  return `<section class="card"><h3>${title}</h3>${body}</section>`;
}

function GlowCard({ title, body, className = '' }) {
  return `<section class="card glow-card ${className}"><h3>${escapeHtml(title)}</h3>${body}</section>`;
}

function ScenarioCard({ title, summary, status, timeRemaining, tone = 'harbor' }) {
  return `
    <article class="scenario-spotlight-card">
      <div class="scenario-spotlight-visual is-${tone}">
        <span>${escapeHtml(status)}</span>
      </div>
      <div class="scenario-spotlight-content">
        <p class="scenario-spotlight-status">${escapeHtml(status)}</p>
        <h4>${escapeHtml(title)}</h4>
        <p class="muted">${escapeHtml(summary)}</p>
        <div class="scenario-spotlight-meta">
          <span class="muted">${escapeHtml(timeRemaining)}</span>
          <button class="pill-btn cta-primary" type="button">Enter</button>
        </div>
      </div>
    </article>
  `;
}

function MemberCard(member) {
  return `
    <article class="card member-row">
      <div>${avatarMarkup(member)}</div>
      <div>
        <h3 style="margin:0;">${escapeHtml(member.displayName)}</h3>
        <p class="muted" style="margin:4px 0;">@${escapeHtml(member.username)}</p>
        <p>${member.bio ? escapeHtml(member.bio) : '<span class="muted">No bio yet.</span>'}</p>
      </div>
      <div class="member-meta">
        <span>Trials completed: <strong>${escapeHtml(member.trialCount || 0)}</strong></span>
        <a class="pill-btn" href="#/members/${escapeAttr(member.id)}">View profile</a>
      </div>
    </article>
  `;
}

function list(items) {
  return `<ul class="list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
}

function avatarMarkup(profile, size = 'md') {
  const initials = (profile.displayName || profile.username || '?')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  if (profile.avatarUrl) {
    return `<img src="${profile.avatarUrl}" alt="${profile.displayName}" class="avatar-${size}"/>`;
  }

  return `<div class="avatar-${size} avatar-fallback">${initials || '?'}</div>`;
}

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  return new Date(value).toLocaleString();
}

function pageTitle(key) {
  return {
    landing: ['Wyked Samurai Guild', 'Professional simulation and roleplay training for modern teams.'],
    home: ['Welcome to Wyked Samurai Guild', 'Your command center for tactical collaboration and growth.'],
    arena: ['Trial Arena', 'Run starter leadership Trials and prepare for live simulation loops.'],
    guild: ['Guild World', 'Story streams, locations, and social immersion in one space.'],
    members: ['Guild Members', 'Discover member profiles and current contribution footprint.'],
    profile: ['Profile Hub', 'Identity-focused profile details, activity snapshot, and quick connection actions.'],
    directChat: ['Direct Chat', 'Messaging now lives in dedicated collaboration rails outside Profile Hub.'],
    scenarioChat: ['Scenario Chat', 'Scenario messaging for active Arena sessions.'],
    areaChat: ['Area Chat', 'Shared location-based roleplay chat stream.'],
    login: ['Log In', 'Access your guild account.'],
    signup: ['Create Account', 'Join Wyked Samurai Guild.'],
    recruiter: ['Recruiter Console', 'Talent intelligence for strategic hiring conversations.'],
    fallback: ['Page Placeholder', 'This section is not built yet, but routing remains intact.'],
  }[key] || ['Wyked Samurai Guild', ''];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getActiveTrial() {
  return STARTER_TRIALS.find((trial) => trial.id === state.arena.activeTrialId) || null;
}

function slugifyScenario(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function findScenarioBlueprint(identifier) {
  const normalized = slugifyScenario(identifier || FIRST_SCENARIO_ID);
  if (SCENARIO_BLUEPRINTS[normalized]) {
    return SCENARIO_BLUEPRINTS[normalized];
  }

  const fromStarterTrials = STARTER_TRIALS.find((trial) => {
    const candidateSlug = slugifyScenario(trial.slug || trial.id || trial.title);
    return normalized === slugifyScenario(trial.id) || normalized === candidateSlug || normalized === slugifyScenario(trial.title);
  });

  if (!fromStarterTrials) {
    return null;
  }

  return SCENARIO_BLUEPRINTS[slugifyScenario(fromStarterTrials.id)] || null;
}

function getScenarioRouteIdentifier(path) {
  if (path.startsWith('/scenario/')) {
    const rawValue = path.slice('/scenario/'.length).split('?')[0];
    return decodeURIComponent(rawValue || FIRST_SCENARIO_ID);
  }

  if (path.startsWith('/scenario')) {
    const [, queryString = ''] = path.split('?');
    const params = new URLSearchParams(queryString);
    return params.get('id') || params.get('slug') || FIRST_SCENARIO_ID;
  }

  return null;
}

function ensureScenarioSession(scenarioId) {
  if (!state.scenarioDetail.sessions[scenarioId]) {
    const scenario = findScenarioBlueprint(scenarioId);
    if (!scenario) {
      return null;
    }
    const defaultSession = {
      scenarioId,
      currentLocation: scenario.startLocation,
      answers: {},
      visitedLocations: [scenario.startLocation],
      completedHalls: [],
      finalUnlocked: false,
      finalAnswer: '',
      finalSubmitted: false,
      completionMessageVisible: false,
    };
    state.scenarioDetail.sessions[scenarioId] = restoreScenarioProgress(scenarioId) || defaultSession;
  }

  return state.scenarioDetail.sessions[scenarioId];
}

function splitSkills(skills) {
  if (Array.isArray(skills)) {
    return skills.filter(Boolean);
  }
  if (typeof skills === 'string') {
    return skills.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function layoutColumns({ className = '', left = '', center = '', right = '' }) {
  return `
    <section class="workspace-layout ${className}">
      <aside class="workspace-col card">${left}</aside>
      <section class="workspace-col card">${center}</section>
      <aside class="workspace-col card">${right}</aside>
    </section>
  `;
}

function messagingRail({ title = 'Messaging Rail', description = '', includeAreaChat = false }) {
  const connectionRows = state.network.connections.length
    ? state.network.connections.slice(0, 8).map((connection) => `
      <li>
        <div>
          <strong>${escapeHtml(connection.displayName || connection.username)}</strong>
          <p class="muted" style="margin:4px 0 0;">${escapeHtml(connection.role || 'member')}</p>
        </div>
        <button class="pill-btn open-direct-chat-btn" data-connection-id="${escapeAttr(connection.id)}">Message</button>
      </li>
    `).join('')
    : '<li><span class="muted">No connections yet.</span></li>';

  const directChatMessages = state.directChat.messages
    .map((message) => `
      <article class="message ${message.senderId === state.currentUser?.id ? 'user' : 'system'}">
        <div class="message-label">${message.senderId === state.currentUser?.id ? 'You' : 'Connection'}</div>
        <p>${escapeHtml(message.content)}</p>
      </article>
    `).join('');

  return `
    <h3>${title}</h3>
    ${description ? `<p class="muted">${escapeHtml(description)}</p>` : ''}
    <h4>Connections</h4>
    <ul class="list compact-list">${connectionRows}</ul>
    <h4 style="margin-top:12px;">Direct Messaging</h4>
    <div id="direct-chat-log" class="conversation-log home-chat-log">
      ${state.directChat.activeConnectionId
    ? (directChatMessages || '<p class="muted">No messages yet.</p>')
    : '<p class="muted">Select a connection to start messaging.</p>'}
    </div>
    <form id="direct-chat-form" class="arena-input" style="margin-top:10px;">
      <input id="direct-chat-input" placeholder="Type a direct message..." ${state.directChat.activeConnectionId ? '' : 'disabled'} />
      <button class="pill-btn" type="submit" ${state.directChat.activeConnectionId ? '' : 'disabled'}>Send</button>
    </form>
    ${includeAreaChat ? '<a class="pill-btn" href="#/profile/area-chat" style="margin-top:10px;display:inline-flex;">Open Area Chat Route</a>' : ''}
  `;
}


function parseAiChatResponse(data) {
  const scenario = data?.scenario;
  if (!scenario || typeof scenario !== 'object') {
    throw new Error('AI response is missing scenario content.');
  }

  return scenario.openingSituation || scenario.premise || scenario.title || '';
}

async function requestHomeAssistantReply(userMessage) {
  const payload = {
    prompt: userMessage,
    genre: 'General Coaching',
    tone: state.mode === 'roleplay' ? 'Roleplay' : 'Professional',
    constraints: 'Reply with concise, practical guidance.',
  };

  const data = await apiRequest(AI_ENDPOINTS.chat, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const content = parseAiChatResponse(data);
  if (!content) {
    throw new Error('AI response did not include usable message text.');
  }

  return content;
}

function getConnectionDisplayName(connection) {
  return connection?.displayName || connection?.username || 'Guild Member';
}

function selectedConnection() {
  return state.network.connections.find((connection) => connection.id === state.shell.selectedConversation)
    || state.network.connections.find((connection) => connection.id === state.directChat.activeConnectionId)
    || null;
}

function SocialSidebar() {
  const connections = state.network.connections || [];
  const selectedConversation = state.shell.selectedConversation || state.directChat.activeConnectionId || '';
  const friendsOnline = connections.filter((connection) => connection.status === 'online').length || Math.min(connections.length, 4);
  const filteredConnections = connections
    .filter((connection) => getConnectionDisplayName(connection).toLowerCase().includes((state.network.searchTerm || '').toLowerCase()));

  const connectionItems = filteredConnections.length
    ? filteredConnections.map((connection) => `
      <li>
        <div class="rail-identity">
          ${avatarMarkup(connection, 'md')}
          <div>
            <strong>${escapeHtml(getConnectionDisplayName(connection))}</strong>
            <p class="muted">${escapeHtml(connection.role || 'Guild Member')}</p>
          </div>
        </div>
        <div class="rail-actions">
          <button class="pill-btn open-global-chat-btn" data-connection-id="${escapeAttr(connection.id)}">Message</button>
          <a class="pill-btn" href="${linkFor(`/members/${connection.id}`)}">View Profile</a>
        </div>
      </li>
    `).join('')
    : '<li><p class="muted">No matching connections.</p></li>';

  const conversationItems = connections.length
    ? connections.map((connection) => {
      const preview = connection.id === state.directChat.activeConnectionId && state.directChat.messages.length
        ? state.directChat.messages[state.directChat.messages.length - 1].content
        : 'Ready for your next briefing.';
      const unreadCount = Number(connection.unreadCount || 0);
      return `
        <li class="global-conversation-item ${selectedConversation === connection.id ? 'is-active' : ''}" data-connection-id="${escapeAttr(connection.id)}">
          <div>
            <strong>${escapeHtml(getConnectionDisplayName(connection))}</strong>
            <p class="muted">${escapeHtml(preview.slice(0, 64))}</p>
          </div>
          ${unreadCount ? `<span class="unread-dot">${unreadCount}</span>` : ''}
        </li>
      `;
    }).join('')
    : '<li><p class="muted">No active conversations yet.</p></li>';

  return `
    <section class="global-utility-pane">
      <div class="utility-tab-switcher">
        <button type="button" class="utility-tab-btn ${state.shell.activePaneTab === 'connections' ? 'active' : ''}" data-pane-tab="connections">Connections</button>
        <button type="button" class="utility-tab-btn ${state.shell.activePaneTab === 'chat' ? 'active' : ''}" data-pane-tab="chat">Chat</button>
      </div>
      ${state.shell.activePaneTab === 'connections' ? `
        <div class="social-rail-block">
          <h3>Connections</h3>
          <p class="muted">Friends online: <strong>${friendsOnline}</strong></p>
          <form id="global-connections-search-form" class="rail-search">
            <input id="global-connections-search-input" type="search" value="${escapeAttr(state.network.searchTerm || '')}" placeholder="Search connections" />
          </form>
          <ul class="social-list">${connectionItems}</ul>
        </div>
      ` : `
        <div class="social-rail-block">
          <h3>Conversations</h3>
          <ul class="conversation-compact-list">${conversationItems}</ul>
        </div>
      `}
    </section>
  `;
}

function ChatDock() {
  if (!state.currentUser || !state.shell.chatOpen) {
    return '';
  }
  const activeConnection = selectedConnection();
  if (!activeConnection) {
    return '';
  }
  const isMinimized = state.shell.chatMinimized;
  const messagesMarkup = (state.directChat.messages || [])
    .map((message) => `
      <article class="message ${message.senderId === state.currentUser?.id ? 'user' : 'system'}">
        <div class="message-label">${message.senderId === state.currentUser?.id ? 'You' : escapeHtml(getConnectionDisplayName(activeConnection))}</div>
        <p>${escapeHtml(message.content)}</p>
      </article>
    `).join('');

  return `
    <section class="global-chat-dock panel ${isMinimized ? 'is-minimized' : ''}">
      <header class="global-chat-head">
        <div class="rail-identity">
          ${avatarMarkup(activeConnection, 'md')}
          <strong>${escapeHtml(getConnectionDisplayName(activeConnection))}</strong>
        </div>
        <div class="chat-window-actions">
          <button class="icon-btn" type="button" id="toggle-chat-pane-btn">${isMinimized ? '▢' : '—'}</button>
          <button class="icon-btn" type="button" id="close-chat-pane-btn">×</button>
        </div>
      </header>
      ${isMinimized ? '' : `
        <div class="conversation-log global-chat-log">${messagesMarkup || '<p class="muted">No messages yet.</p>'}</div>
        <form id="global-chat-form" class="active-chat-form">
          <input id="global-chat-input" type="text" placeholder="Send a quick reply..." />
          <button class="pill-btn cta-primary" type="submit">Send</button>
        </form>
      `}
    </section>
  `;
}

function Sidebar(path, key) {
  return `
    <aside class="left-sidebar panel ${key === 'home' ? 'home-left-sidebar' : ''}">
      <div class="left-pane-brand">
        <div class="guild-lockup">
          ${guildBrandMark({ compact: true, className: 'sidebar-brand-mark' })}
          <div>
            <p class="lockup-title">Wyked Samurai</p>
            <p class="muted">Command Menu</p>
          </div>
        </div>
      </div>
      <ul class="nav-list">
        ${navItems.map(([label, target]) => `<li><a href="${linkFor(target)}" class="${path === target ? 'active' : ''}">${label}</a></li>`).join('')}
      </ul>
    </aside>
  `;
}

function PageHero({ title, subtitle, kicker = 'Nexus Command' }) {
  return `
    <section class="page-hero panel">
      <div class="moon-orb"></div>
      <p class="hero-kicker">${escapeHtml(kicker)}</p>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(subtitle)}</p>
    </section>
  `;
}

function MainContent(key, title, subtitle, statusMarkup, pageHtml) {
  const hideDefaultHeader = key === 'home';
  return `
    <main class="main-content panel">
      ${hideDefaultHeader ? '' : `
        ${PageHero({ title, subtitle, kicker: key === 'recruiter' ? 'Recruiter Intelligence' : 'Guild Nexus' })}
      `}
      ${statusMarkup}
      <section style="margin-top:${hideDefaultHeader ? '0' : '14px'};">${pageHtml}</section>
    </main>
  `;
}

function SiteFooter() {
  return `
    <footer class="site-footer" role="contentinfo">
      © 2022 Wyked Samurai Guild (WSG). All rights reserved.
    </footer>
  `;
}

function Header() {
  return `
    <header class="header panel">
      <div class="brand">
        ${guildBrandMark({ className: 'header-brand-mark' })}
        <div>
          <div class="title">Wyked Samurai Guild</div>
          <div class="subtitle">Strategic Guild Network • Nebula Nexus</div>
        </div>
      </div>
      <div class="header-actions">
        <div class="toggle">
          <button id="professional-mode" class="${state.mode === 'professional' ? 'active' : ''}">Professional</button>
          <button id="roleplay-mode" class="${state.mode === 'roleplay' ? 'active' : ''}">Roleplay</button>
        </div>
        <button class="icon-btn" title="Notifications" aria-label="notifications">◉</button>
        ${state.currentUser ? `<span class="muted">${state.currentUser.displayName}</span>${avatarMarkup(state.currentUser, 'md')}<button class="pill-btn" id="logout-btn">Log out</button>` : '<a class="pill-btn" href="#/login">Log in</a>'}
      </div>
    </header>
  `;
}

function AppShell(path, key, pageHtml, statusMarkup) {
  const [title, subtitle] = pageTitle(key);
  return `
    <div class="app-shell">
      ${Header()}
      ${Sidebar(path, key)}
      ${MainContent(key, title, subtitle, statusMarkup, pageHtml)}
      <aside class="right-sidebar panel ${key === 'home' ? 'home-right-sidebar' : ''}">${SocialSidebar()}</aside>
      ${ChatDock()}
    </div>
  `;
}

function homePage() {
  const displayName = state.currentUser?.displayName || 'Guild Member';
  const scenarioCards = [
    {
      title: 'Moon Harbor Intercept',
      summary: 'Negotiate a ceasefire between rival fleets before the moonlane trade corridor collapses.',
      timeRemaining: '42m remaining',
      status: 'Priority Window',
      visual: 'Harbor Mistfront',
      tone: 'harbor',
    },
    {
      title: 'Citadel Breach Council',
      summary: 'Lead a cross-cell strategy council while resources are constrained and command pressure escalates.',
      timeRemaining: '1h 12m remaining',
      status: 'Command Review',
      visual: 'Glass Citadel',
      tone: 'citadel',
    },
    {
      title: 'Nightwatch Supply Run',
      summary: 'Stabilize logistics and morale after a surprise disruption during the midnight convoy run.',
      timeRemaining: '23m remaining',
      status: 'Rapid Response',
      visual: 'Iron Route',
      tone: 'convoy',
    },
  ];

  const activitySeed = state.network.connections.slice(0, 4);
  const activityFeed = activitySeed.length
    ? activitySeed.map((connection, index) => `
      <li>
        <div class="activity-avatar">${avatarMarkup(connection, 'md')}</div>
        <div>
          <strong>${escapeHtml(connection.displayName || connection.username)}</strong>
          <p class="activity-role">${escapeHtml(connection.role || 'Guild Member')}</p>
          <p class="muted">Shared a mission recap from the Night Forum and tagged the squad for follow-up.</p>
        </div>
        <span class="muted">${index === 0 ? '8m' : `${(index + 1) * 11}m`}</span>
      </li>
    `).join('')
    : `
      <li>
        <div class="activity-avatar"><div class="avatar-md avatar-fallback">WS</div></div>
        <div>
          <strong>Guild Chronicle</strong>
          <p class="activity-role">Archivist Node</p>
          <p class="muted">No recent roleplay updates yet. Enter a scenario to ignite the chronicle.</p>
        </div>
        <span class="muted">Now</span>
      </li>
    `;

  const contributors = (state.network.connections.length ? state.network.connections : [{ displayName: 'Penny Carter', role: 'Strategist' }, { displayName: 'Kai Ren', role: 'Scout Lead' }, { displayName: 'Mira Sol', role: 'Mediator' }])
    .slice(0, 4)
    .map((connection) => `
      <li>
        ${avatarMarkup(connection, 'md')}
        <div>
          <strong>${escapeHtml(connection.displayName || connection.username)}</strong>
          <p class="muted">${escapeHtml(connection.role || 'Specialist')}</p>
        </div>
      </li>
    `).join('');

  return `
    <section class="home-hero tier-1">
      <p class="home-kicker">Moonlit Command</p>
      <h1>Welcome, ${escapeHtml(displayName)}</h1>
      <p>Your watch begins under the silver moon. Track active operations, gather guild intel, and deploy where your presence shifts the story.</p>
      <div class="home-hero-actions">
        <button class="pill-btn cta-primary" type="button">Enter Mission Queue</button>
        <a class="pill-btn home-secondary-action" href="${linkFor('/guild-world')}">Review Guild World</a>
      </div>
    </section>

    <section class="home-body-grid">
      <div class="home-main-column">
        <section class="card home-section tier-2">
          <div class="section-heading-row home-section-heading">
            <h3>Recommended Scenarios</h3>
          </div>
          <div class="scenario-card-stack">
            ${scenarioCards.map((scenario) => ScenarioCard(scenario)).join('')}
          </div>
        </section>

        <section class="card home-section home-subsection tier-3">
          <div class="section-heading-row home-section-heading">
            <h3>Recent Roleplay</h3>
          </div>
          <ul class="guild-activity-list">${activityFeed}</ul>
        </section>
      </div>

      <aside class="home-support-column">
        ${GlowCard({
    title: 'Guild Updates',
    className: 'home-support-card tier-3',
    body: `
          <ul class="support-list">
            <li><strong>Moon Council Briefing</strong><p class="muted">Council alignment begins at 21:00 UTC.</p></li>
            <li><strong>Ops Signal</strong><p class="muted">Harbor patrol shifted toward the east perimeter.</p></li>
            <li><strong>Lore Dispatch</strong><p class="muted">Glass Frontier archive was expanded tonight.</p></li>
          </ul>
    `,
  })}
        ${GlowCard({
    title: 'Top Contributors',
    className: 'home-support-card tier-3',
    body: `<ul class="contributors-list">${contributors}</ul>`,
  })}
        ${GlowCard({
    title: 'Recruiter HQ',
    className: 'home-support-card recruiter-teaser tier-3',
    body: `
      <p class="muted">Audit candidate signal quality and elevate high-potential operatives to shortlist.</p>
      <a class="pill-btn" href="${linkFor('/recruiter-console')}">Open Recruiter Console</a>
    `,
  })}
      </aside>
    </section>
  `;
}

function landingPage() {
  return `
    <section class="landing-hero feature">
      <p class="landing-kicker">Professional + Roleplay Simulation</p>
      <h1>Train your team through high-stakes scenarios before they happen.</h1>
      <p class="muted">Wyked Samurai Guild helps professionals rehearse difficult leadership moments, customer escalations, and operational crises in a guided simulation environment.</p>
      <div class="actions">
        <a class="pill-btn cta-primary" href="#/signup">Sign Up</a>
        <a class="pill-btn" href="#/login">Log In</a>
      </div>
    </section>
    <div class="grid two landing-highlights">
      ${card('Professional Readiness', '<p class="muted">Practice communication, judgment, and execution with structured trial flows built for real-world team performance.</p>')}
      ${card('Roleplay Immersion', '<p class="muted">Switch into roleplay mode for story-rich scenarios that sharpen decision-making under pressure.</p>')}
      ${card('Scenario Library', '<p class="muted">Launch from starter Trials covering people management, customer escalation, and executive tradeoff decisions.</p>')}
      ${card('Actionable Coaching', '<p class="muted">Use AI-guided prompts and feedback loops to improve responses, not just complete checklists.</p>')}
    </div>
    <section class="card landing-footer-cta">
      <h3>Start with a free guild account.</h3>
      <p class="muted">Create your profile, enter the app, and run your first scenario in minutes.</p>
      <div class="actions">
        <a class="pill-btn cta-primary" href="#/signup">Create Account</a>
        <a class="pill-btn" href="#/login">I already have an account</a>
      </div>
    </section>
  `;
}

function arenaPage() {
  const activeTrial = getActiveTrial();
  const hasActiveTrial = Boolean(activeTrial);
  const participantCount = Math.max((state.network.connections || []).slice(0, 6).length, 1);
  const isRoleplayMode = state.mode === 'roleplay';
  const isCompactViewport = window.matchMedia('(max-width: 1180px)').matches;
  const leftCollapsed = isCompactViewport ? !state.arena.mobileLeftOpen : state.arena.leftPanelCollapsed;
  const rightCollapsed = isCompactViewport ? !state.arena.mobileRightOpen : state.arena.rightPanelCollapsed;
  const trialCards = (isRoleplayMode ? ROLEPLAY_ROOMS : STARTER_TRIALS)
    .map((trialOrRoom) => {
      const trialId = isRoleplayMode ? trialOrRoom.trialId : trialOrRoom.id;
      const isActive = trialId === state.arena.activeTrialId;
      return `
        <article class="trial-card arena-carousel-card ${isActive ? 'active' : ''}">
          <div class="trial-card-head">
            <h4>${trialOrRoom.title}</h4>
            ${isActive ? `<span class="trial-state-chip">${isRoleplayMode ? 'Active Room' : 'Active Trial'}</span>` : ''}
          </div>
          <p class="muted">${trialOrRoom.description}</p>
          <div class="trial-meta">
            ${isRoleplayMode
    ? `<span>Players: ${trialOrRoom.players}</span><span>${trialOrRoom.roleFocus}</span>`
    : `<span>${trialOrRoom.difficulty}</span><span>${trialOrRoom.suggestedRole || 'Open role'}</span>`}
          </div>
          <button class="pill-btn start-trial-btn" data-trial-id="${trialId}">
            ${isRoleplayMode
    ? (isActive ? 'Resume Room' : 'Start Room')
    : (isActive ? 'Restart Trial' : 'Start Trial')}
          </button>
          ${isActive ? `<button class="pill-btn start-trial-btn" data-trial-id="${trialId}" data-restart="true">${isRoleplayMode ? 'Restart Room' : 'Resume Trial'}</button>` : ''}
        </article>
      `;
    })
    .join('');

  const chatMessages = state.arena.messages
    .map(
      (message) => `
        <article class="message arena-chat-message ${message.type === 'user' ? 'user' : message.type === 'system' ? 'system' : 'assistant'}">
          <div class="message-label">${message.type === 'user' ? 'You' : message.type === 'system' ? 'Arena System' : 'Arena Guide'}</div>
          <p>${escapeHtml(message.content)}</p>
        </article>
      `
    )
    .join('');

  const rightTab = state.arena.rightPanelTab;
  const rightPanelBody = (() => {
    if (rightTab === 'participants') {
      return `
        <section class="participant-grid">
          ${(state.network.connections || []).slice(0, 8).map((connection) => `
            <article class="participant-card">
              <div class="participant-avatar">${avatarMarkup(connection, 'md')}</div>
              <div>
                <strong>${escapeHtml(connection.displayName || connection.username)}</strong>
                <p class="muted">${escapeHtml(connection.role || 'member')}</p>
              </div>
              <span class="participant-status">${escapeHtml(connection.status || 'live')}</span>
            </article>
          `).join('') || '<p class="muted">No participants connected yet.</p>'}
        </section>
      `;
    }
    if (rightTab === 'status') {
      return hasActiveTrial
        ? `
          <ul class="status-list">
            <li><span class="muted">Title</span><strong>${activeTrial.title}</strong></li>
            <li><span class="muted">Mode</span><strong>${state.mode === 'roleplay' ? 'Roleplay Room' : 'Arena Scenario'}</strong></li>
            <li><span class="muted">Difficulty</span><strong>${activeTrial.difficulty}</strong></li>
            <li><span class="muted">Role Focus</span><strong>${activeTrial.suggestedRole || 'Unspecified'}</strong></li>
            <li><span class="muted">Participants</span><strong>${participantCount}</strong></li>
          </ul>
        `
        : '<p class="muted">No active session yet. Start a scenario to show status details.</p>';
    }
    if (rightTab === 'chat') {
      return `
        <ul class="compact-list">
          ${state.arena.messages.slice(-8).map((message) => `
            <li>
              <div>
                <strong>${escapeHtml(message.type === 'user' ? 'You' : (message.type === 'system' ? 'System' : 'Guide'))}</strong>
                <p class="muted" style="margin:4px 0 0;">${escapeHtml(message.content).slice(0, 96)}${message.content.length > 96 ? '…' : ''}</p>
              </div>
            </li>
          `).join('') || '<li><span class="muted">No chat messages yet.</span></li>'}
        </ul>
      `;
    }
    return `
      <ul class="compact-list">
        ${(state.network.connections || []).slice(0, 8).map((connection) => `
          <li>
            <div>
              <strong>${escapeHtml(connection.displayName || connection.username)}</strong>
              <p class="muted" style="margin:4px 0 0;">${escapeHtml(connection.status || 'offline')}</p>
            </div>
            <button class="pill-btn open-direct-chat-btn" data-connection-id="${escapeAttr(connection.id)}">Message</button>
          </li>
        `).join('') || '<li><span class="muted">No connections available.</span></li>'}
      </ul>
    `;
  })();

  return `
    <section class="workspace-layout arena-layout ${leftCollapsed ? 'is-left-collapsed' : ''} ${rightCollapsed ? 'is-right-collapsed' : ''} ${isCompactViewport ? 'is-mobile' : ''} ${state.arena.mobileLeftOpen ? 'is-mobile-left-open' : ''} ${state.arena.mobileRightOpen ? 'is-mobile-right-open' : ''}">
      <aside class="workspace-col card arena-left-panel">
        <div class="arena-panel-head">
          <h3>${leftCollapsed ? 'Arena' : 'Navigation'}</h3>
          <button type="button" class="panel-toggle-btn" id="arena-left-panel-toggle" aria-label="${leftCollapsed ? 'Expand left panel' : 'Collapse left panel'}">${leftCollapsed ? '⟩' : '⟨'}</button>
        </div>
        <nav class="arena-side-nav">
          <a class="${location.hash === linkFor('/app') ? 'active' : ''}" href="${linkFor('/app')}">🏠 ${leftCollapsed ? '' : 'Home'}</a>
          <a class="active" href="${linkFor('/arena')}">⚔️ ${leftCollapsed ? '' : 'Arena'}</a>
          <a class="${location.hash === linkFor('/guild-world') ? 'active' : ''}" href="${linkFor('/guild-world')}">🌌 ${leftCollapsed ? '' : 'Guild'}</a>
          <a class="${location.hash === linkFor('/profile') ? 'active' : ''}" href="${linkFor('/profile')}">👤 ${leftCollapsed ? '' : 'Profile'}</a>
        </nav>
        <section class="arena-side-block">
          <h4>${leftCollapsed ? '⚡' : 'Mode'}</h4>
          ${leftCollapsed ? '' : `<p class="muted">${isRoleplayMode ? 'Roleplay rooms active.' : 'Professional scenario mode active.'}</p>`}
        </section>
        <section class="arena-side-block">
          <h4>${leftCollapsed ? '📌' : 'Active'}</h4>
          ${leftCollapsed ? '' : `<p class="muted">${hasActiveTrial ? activeTrial.title : 'No active scenario selected.'}</p>`}
        </section>
      </aside>
      <section class="workspace-col card arena-main-column">
        <section class="arena-selection-tier arena-scenario-strip">
          <div class="arena-selection-head">
            <h3>${isRoleplayMode ? 'Roleplay Room Strip' : 'Scenario Strip'}</h3>
            <p class="muted">${isRoleplayMode ? 'Open, resume, or restart shared room sessions.' : 'Launch, resume, or restart your guided trial flow.'}</p>
          </div>
          <div class="arena-card-carousel">
            ${trialCards}
          </div>
        </section>
        <section class="scenario-experience-panel arena-chat-panel">
          <div class="scenario-panel-head arena-chat-head">
            <div>
              <p class="hero-kicker">${isRoleplayMode ? 'Room Chat' : 'Arena Chat'}</p>
              <h4>${hasActiveTrial ? activeTrial.title : `No ${isRoleplayMode ? 'room' : 'scenario'} active`}</h4>
            </div>
            <p class="muted">${state.mode === 'roleplay' ? 'Immersive roleplay lane' : 'Structured decision lane'} · ${state.arena.messages.length} messages</p>
          </div>
          ${
  hasActiveTrial
    ? `<div id="arena-conversation-log" class="conversation-log arena-chat-log">${chatMessages}</div>`
    : `<div class="arena-empty"><h4>No ${isRoleplayMode ? 'Room' : 'Trial'} active</h4><p class="muted">Select a ${isRoleplayMode ? 'room' : 'scenario card'} from the strip above to begin chatting.</p></div>`
}
          <form id="arena-input-form" class="arena-input">
            <input id="arena-input" name="message" placeholder="${hasActiveTrial ? `Type your ${isRoleplayMode ? 'roleplay' : 'response'} message...` : `Start a ${isRoleplayMode ? 'room' : 'trial'} to enable chat`}" ${hasActiveTrial ? '' : 'disabled'} />
            <button id="arena-send-btn" class="pill-btn" type="submit" ${(hasActiveTrial && !state.arena.pending) ? '' : 'disabled'}>${state.arena.pending ? 'Sending...' : 'Send'}</button>
          </form>
          ${state.arena.error ? `<p class="muted" style="color:#ff7b7b;margin-top:8px;" role="alert">${escapeHtml(state.arena.error)}</p>` : ''}
        </section>
      </section>
      <aside class="workspace-col card arena-right-panel">
        <div class="arena-panel-head">
          <h3>${rightCollapsed ? 'Tools' : 'Control Hub'}</h3>
          <button type="button" class="panel-toggle-btn" id="arena-right-panel-toggle" aria-label="${rightCollapsed ? 'Expand right panel' : 'Collapse right panel'}">${rightCollapsed ? '⟨' : '⟩'}</button>
        </div>
        <div class="arena-right-tabs">
          <button type="button" class="utility-tab-btn ${rightTab === 'connections' ? 'active' : ''}" data-arena-tab="connections" title="Connections">🔌 ${rightCollapsed ? '' : 'Connections'}</button>
          <button type="button" class="utility-tab-btn ${rightTab === 'chat' ? 'active' : ''}" data-arena-tab="chat" title="Chat">💬 ${rightCollapsed ? '' : 'Chat'}</button>
          <button type="button" class="utility-tab-btn ${rightTab === 'participants' ? 'active' : ''}" data-arena-tab="participants" title="Participants">🧑‍🤝‍🧑 ${rightCollapsed ? '' : 'Participants'}</button>
          <button type="button" class="utility-tab-btn ${rightTab === 'status' ? 'active' : ''}" data-arena-tab="status" title="Status">📊 ${rightCollapsed ? '' : 'Status'}</button>
        </div>
        <section class="arena-right-content">
          ${rightCollapsed ? '' : rightPanelBody}
        </section>
      </aside>
    </section>
  `;
}

function scenarioDetailPage(path) {
  const scenarioIdentifier = getScenarioRouteIdentifier(path) || FIRST_SCENARIO_ID;
  const scenario = findScenarioBlueprint(scenarioIdentifier);
  if (!scenario) {
    return card('Scenario not found', '<p class="muted">We could not find that scenario. Try /scenario/find-your-why.</p>');
  }

  const session = ensureScenarioSession(scenario.id);
  if (!session) {
    return card('Scenario unavailable', '<p class="muted">Unable to initialize scenario state.</p>');
  }
  state.scenarioDetail.activeScenarioId = scenario.id;

  const completedCount = session.completedHalls.length;
  const totalHalls = scenario.hallOrder.length;
  const progressLabel = session.finalSubmitted ? 'Scenario Complete' : `${completedCount}/${totalHalls} halls completed`;
  const isDais = session.currentLocation === scenario.startLocation;
  const isFinalPromptVisible = isDais && session.finalUnlocked;
  const activeLocation = scenario.locations[session.currentLocation] || scenario.locations[scenario.startLocation];
  const activePrompt = isFinalPromptVisible ? scenario.finalPrompt : (activeLocation.prompt || '');
  const responseOptions = isFinalPromptVisible ? scenario.finalResponses : (activeLocation.responses || []);
  const answersList = Object.entries(session.answers).map(([locationId, answer]) => `
    <li><span>${escapeHtml(scenario.locations[locationId]?.name || locationId)}</span><strong>${escapeHtml(answer)}</strong></li>
  `).join('');

  return `
    <section class="scenario-detail-layout">
      <aside class="scenario-detail-card card">
        <p class="hero-kicker">Scenario Card</p>
        <h3>${escapeHtml(scenario.title)}</h3>
        <p class="muted">${escapeHtml(scenario.description)}</p>
        <div class="scenario-stat-block">
          <span>Current Objective</span>
          <strong>${escapeHtml(session.finalUnlocked ? 'Return to the Compass Dais and answer the final question.' : scenario.objective)}</strong>
        </div>
        <div class="scenario-stat-block">
          <span>Current Location</span>
          <strong>${escapeHtml(activeLocation.name)}</strong>
        </div>
        <div class="scenario-stat-block">
          <span>Progress Status</span>
          <strong>${escapeHtml(progressLabel)}</strong>
        </div>
        <div class="scenario-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${totalHalls}" aria-valuenow="${completedCount}" aria-label="Hall progress">
          <span style="width:${Math.min((completedCount / totalHalls) * 100, 100)}%;"></span>
        </div>
        <p class="muted scenario-progress-label">${completedCount}/${totalHalls} halls complete</p>
        ${session.finalSubmitted
    ? `
          <div class="scenario-stat-block">
            <span>Saved Motivation</span>
            <strong>${escapeHtml(session.finalAnswer)}</strong>
          </div>
        `
    : ''}
        ${answersList ? `<ul class="scenario-answer-log">${answersList}</ul>` : '<p class="muted">Your reflections will be recorded here as you explore.</p>'}
      </aside>
      <section class="scenario-detail-map-area card">
        <div class="scenario-map-head">
          <div>
            <p class="hero-kicker">Scenario Map</p>
            <h3>Path of Reflection</h3>
          </div>
          <p class="muted">Choose a location to continue.</p>
        </div>
        <div class="scenario-location-grid">
          ${['compass_dais', ...scenario.hallOrder].map((locationId) => {
    const location = scenario.locations[locationId];
    const isCurrent = session.currentLocation === locationId;
    const isCompleted = session.completedHalls.includes(locationId);
    const isHall = locationId !== scenario.startLocation;
    const isLockedDais = locationId === scenario.startLocation && !session.finalUnlocked && completedCount < totalHalls;
    return `
              <button
                type="button"
                class="scenario-location-btn ${isCurrent ? 'is-current' : ''} ${isCompleted ? 'is-completed' : ''}"
                data-location-id="${locationId}"
                ${isLockedDais ? 'disabled' : ''}
              >
                <span>${escapeHtml(location.name)}</span>
                <small>${isCompleted ? 'Visited' : (isHall ? 'Unvisited' : 'Central node')}</small>
              </button>
            `;
  }).join('')}
        </div>
        <section class="scenario-prompt-panel">
          <p class="hero-kicker">Current Prompt</p>
          <h4>${escapeHtml(activeLocation.name)}</h4>
          <p class="scenario-prompt">${escapeHtml(activePrompt)}</p>
          <div class="scenario-response-stack">
            ${responseOptions.map((choice, index) => `
              <button type="button" class="pill-btn scenario-response-btn" data-response-value="${escapeAttr(choice)}">${index + 1}. ${escapeHtml(choice)}</button>
            `).join('')}
          </div>
          ${isFinalPromptVisible && !session.finalSubmitted ? `
            <form id="scenario-final-form" class="scenario-final-form">
              <input id="scenario-final-input" name="finalAnswer" placeholder="Or write your why in your own words..." value="${escapeAttr(session.finalAnswer || '')}" />
              <button class="pill-btn cta-primary" type="submit">Submit Final Answer</button>
            </form>
          ` : ''}
          ${session.completionMessageVisible ? `<p class="scenario-completion-message">${escapeHtml(scenario.completionMessage)}</p>` : ''}
          <button type="button" id="scenario-reset-btn" class="pill-btn">Reset Scenario Progress</button>
        </section>
      </section>
    </section>
  `;
}

function guildPage() {
  return `
    <section class="scenario-hero guild-hero">
      <p class="hero-kicker">World RP</p>
      <h3>Living World Nexus</h3>
      <p class="hero-description">Follow roleplay dispatches, jump into featured locations, and track recent story beats across the guild world.</p>
    </section>
    <div class="grid two">
      ${GlowCard({
    title: 'Roleplay Feed',
    body: list(['"Mist over Kagemori as scouts return."', '"Alliance envoy arrives at moon gate."', '"Campfire confessions in the cedar court."'].map((s) => `<span>${s}</span><span class="muted">Story</span>`)),
  })}
      ${GlowCard({
    title: 'Featured Locations',
    body: list(['Moonfall Harbor', 'Cinder Dojo', 'Glass Pine Ridge'].map((s) => `<span>${s}</span><span class="muted">Live scene</span>`)),
  })}
      ${GlowCard({
    title: 'Recent Stories',
    body: list(['The Ridge Oath renewed at dusk.', 'Sentinel lanterns relit across the harbor.', 'An envoy requested aid from the Iron Route.'].map((s) => `<span>${s}</span><span class="muted">Chronicle</span>`)),
  })}
      ${GlowCard({
    title: 'Social Presence',
    body: '<p class="muted">Use the right sidebar to see friends online, launch chats, and coordinate ongoing world scenes.</p>',
  })}
    </div>
  `;
}

function membersPage() {
  if (state.loading && !state.membersLoaded) {
    return card('Members', '<p class="muted">Loading members...</p>');
  }

  if (!state.members.length) {
    return card('Members', '<p class="muted">No members yet. Invite the first samurai.</p>');
  }

  return `
    <div class="member-list">
      ${state.members
        .map((member) => MemberCard(member))
        .join('')}
    </div>
  `;
}

function profilePage() {
  const profile = state.currentUser;
  if (!profile) {
    return card('Profile Hub', '<p class="muted">Please log in first.</p>');
  }

  const activeLayer = state.activeLayer || 'free';
  const activeData = state.layers?.[activeLayer] || {};
  const tabMarkup = PROFILE_LAYER_ORDER.map((layerKey) => {
    const meta = PROFILE_LAYER_META[layerKey];
    const isLocked = state.lockedLayers.includes(layerKey);
    const isActive = activeLayer === layerKey;
    return `<button type="button" class="pill-btn ${isActive ? 'active' : ''}" data-layer-tab="${layerKey}" ${isLocked ? 'disabled title="Upgrade to unlock"' : ''}>${meta.label}${isLocked ? ' 🔒' : ''}</button>`;
  }).join('');

  const isLayerLocked = state.lockedLayers.includes(activeLayer);
  const skillsList = Array.isArray(activeData.skills) ? activeData.skills : [];
  const layerBioLabel = activeLayer === 'professional' ? 'Professional Bio' : activeLayer === 'roleplay' ? 'Roleplay Bio' : 'Short Bio';
  const layerSkillsLabel = activeLayer === 'free' ? 'Basic Tags' : 'Tags / Skills';

  return `
    <section class="feature profile-display-hero guild-identity-hero">
      <img class="profile-hero-image" src="${BRAND_ASSETS.hero}" alt="Moonlit samurai hero art" loading="eager" decoding="async" />
      <div class="nebula-halo"></div>
      <div class="profile-summary-row">
        ${avatarMarkup(profile, 'lg')}
        <div>
          <p class="hero-kicker">Guild Identity Page</p>
          <h3 style="margin:0;">${escapeHtml(activeData.displayName || profile.displayName || profile.username)}</h3>
          <p class="muted" style="margin:4px 0;">@${escapeHtml(profile.username)}</p>
          <p class="muted" style="margin:0;">Tier: ${escapeHtml(profile.accessTier || 'free')} · Subscription: ${escapeHtml(profile.subscriptionStatus || 'inactive')}</p>
        </div>
      </div>
      <p class="profile-display-bio">${escapeHtml(activeData.bio || 'No profile story published yet for this layer.')}</p>
      <div class="tag-list profile-tag-list">
        ${skillsList.length ? skillsList.map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('') : '<span class="muted">No skills listed yet.</span>'}
      </div>
      <div class="profile-progress-grid">
        <article class="profile-progression-card"><span>Current Layer</span><strong>${escapeHtml(PROFILE_LAYER_META[activeLayer]?.label || activeLayer)}</strong></article>
        <article class="profile-progression-card"><span>Unlocked Layers</span><strong>${state.availableLayers.length}</strong></article>
        <article class="profile-progression-card"><span>Connections</span><strong>${state.network.connections.length}</strong></article>
      </div>
    </section>

    <section class="card profile-tabs-card" style="margin-top:12px;">
      <div class="tabs profile-tabs">
        <button class="active" type="button">Overview</button>
        <button type="button">Arena Contributions</button>
        <button type="button">Guild Activity</button>
        <button type="button">Connections</button>
      </div>
      <p class="muted" style="margin-top:10px;">Profile insights and contribution history panels are currently placeholder content backed by live account data above.</p>
    </section>

    <section class="card profile-edit-section">
      <h3>Profile Layers</h3>
      <p class="muted">Edit each unlocked layer independently. Locked layers show upgrade messaging only for now.</p>
      <div id="profile-layer-tabs" class="actions profile-layer-actions" style="margin-bottom:10px;">${tabMarkup}</div>
      ${isLayerLocked ? `
        <div class="status-banner status-info">
          <strong>${escapeHtml(PROFILE_LAYER_META[activeLayer]?.label || activeLayer)} layer is locked.</strong>
          <p style="margin:6px 0 0;">Upgrade your access tier to unlock this layer. Payment flow is not implemented yet.</p>
        </div>
      ` : `
      <form id="profile-layer-form" class="form-stack">
        <input type="hidden" name="layerKey" value="${escapeAttr(activeLayer)}" />
        <label>Display Name<input name="displayName" value="${escapeAttr(activeData.displayName || '')}" required maxlength="60" /></label>
        ${(activeLayer === 'professional' || activeLayer === 'roleplay') ? `<label>Headline<input name="headline" value="${escapeAttr(activeData.headline || '')}" maxlength="120" /></label>` : ''}
        <label>${layerBioLabel}<textarea name="bio" rows="4" maxlength="800">${escapeHtml(activeData.bio || '')}</textarea></label>
        <label>${layerSkillsLabel} (comma-separated)<input name="skills" value="${escapeAttr((skillsList || []).join(', '))}" /></label>
        <button class="pill-btn" id="save-profile-layer-btn" type="submit" ${state.profileHub.saving ? 'disabled' : ''}>${state.profileHub.saving ? 'Saving Layer...' : 'Save Active Layer'}</button>
      </form>
      `}
    </section>

    <section class="card profile-edit-section" style="margin-top:12px;">
      <h3>Account Settings</h3>
      <p class="muted">Account settings stay global to your user account (not per layer).</p>
      <form id="profile-hub-form" class="form-stack">
        <p id="profile-hub-feedback" class="status-banner ${state.profileHub.message ? `status-${state.profileHub.tone}` : 'status-info'}" role="alert" aria-live="assertive">${escapeHtml(state.profileHub.message || 'Make updates and save when ready.')}</p>
        <label>Legal Name<input name="legalName" value="${escapeAttr(profile.legalName || '')}" required /></label>
        <label>Email<input name="email" value="${escapeAttr(profile.email || '')}" required /></label>
        <label>Role / Title
          <select name="role">
            <option value="employee_member" ${profile.role === 'employee_member' ? 'selected' : ''}>Employee / Member</option>
            <option value="employer" ${profile.role === 'employer' ? 'selected' : ''}>Employer</option>
            <option value="recruiter" ${profile.role === 'recruiter' ? 'selected' : ''}>Recruiter</option>
          </select>
        </label>
        <label>Organization<input name="organizationName" value="${escapeAttr(profile.organizationName || '')}" /></label>
        <button class="pill-btn" id="save-profile-hub-btn" type="submit" ${state.profileHub.saving ? 'disabled' : ''}>${state.profileHub.saving ? 'Saving Account...' : 'Save Account Settings'}</button>
      </form>
    </section>
  `;
}

function roleplayChannelPage(type) {
  const isScenario = type === 'scenario';
  const stateSlice = isScenario ? state.scenarioChat : state.areaChat;
  const routeLabel = isScenario ? 'Scenario Chat' : 'Area Chat';
  const inputId = isScenario ? 'scenario-chat-input' : 'area-chat-input';
  const formId = isScenario ? 'scenario-chat-form' : 'area-chat-form';
  const messagesMarkup = (stateSlice.messages || [])
    .map((message) => `
      <article class="message ${message.senderId === state.currentUser?.id ? 'user' : 'system'}">
        <div class="message-label">${message.senderId === state.currentUser?.id ? 'You' : 'Guild'}</div>
        <p>${escapeHtml(message.content)}</p>
      </article>
    `).join('');

  return `
    <section class="card">
      <h3>${routeLabel}</h3>
      <p class="muted">${isScenario ? 'Guided roleplay scenario stream.' : 'Shared roleplay area room stream.'}</p>
      <div class="conversation-log home-chat-log">${messagesMarkup || '<p class="muted">No messages yet.</p>'}</div>
      <form id="${formId}" class="arena-input" style="margin-top:10px;">
        <input id="${inputId}" placeholder="Type a message..." />
        <button class="pill-btn" type="submit">Send</button>
      </form>
      <div class="actions" style="margin-top:10px;">
        <a class="pill-btn" href="#/arena">Back to Arena Workspace</a>
      </div>
    </section>
  `;
}

function directChatPage() {
  return layoutColumns({
    className: 'recruiter-layout',
    left: `<h3>Messaging Entry</h3><p class="muted">Direct messaging has moved out of Profile Hub.</p>`,
    center: `<h3>Conversation Context</h3><p class="muted">Select a connection from the right messaging rail.</p>`,
    right: messagingRail({ title: 'Right-side Messaging Rail', description: 'Direct chat and network actions.' }),
  });
}

function scenarioChatPage() {
  return roleplayChannelPage('scenario');
}

function areaChatPage() {
  return roleplayChannelPage('area');
}

function profileEditPage() {
  return `
    <section class="card">
      <h3>Profile Edit moved</h3>
      <p class="muted">Profile setup now lives directly in the Profile Hub.</p>
      <a href="#/profile" class="pill-btn">Open Profile Hub</a>
    </section>
  `;
}

function loginPage() {
  const loginHasError = state.authForms.login.tone === 'error' && Boolean(state.authForms.login.message);
  const loginFeedbackMessage = loginHasError
    ? `ERROR: ${state.authForms.login.message}`
    : (state.authForms.login.message || 'Enter your account email and password to sign in.');
  return `
    <section class="card form-card">
      <h3>Log in</h3>
      <p class="muted">Note: accounts are currently stored in volatile in-memory server storage and may reset when the backend restarts.</p>
      <form id="login-form" class="form-stack">
        <p id="login-feedback" class="status-banner ${state.authForms.login.message ? `status-${state.authForms.login.tone}` : 'status-info'}${loginHasError ? ' auth-error-banner' : ''}" role="alert" aria-live="assertive">${escapeHtml(loginFeedbackMessage)}</p>
        <label>Email
          <input name="email" type="email" autocomplete="email" required />
        </label>
        <label>Password
          <input name="password" type="password" autocomplete="current-password" required />
        </label>
        <button class="pill-btn" type="submit" id="login-submit-btn" ${state.authForms.login.loading ? 'disabled' : ''}>${state.authForms.login.loading ? 'Signing in...' : 'Log In'}</button>
        <p class="muted" style="margin:8px 0 4px;">or</p>
        <div id="google-login-button" aria-label="Continue with Google"></div>
      </form>
      <p class="muted">New here? <a href="#/signup">Create an account.</a></p>
    </section>
  `;
}

function signupPage() {
  const signupHasError = state.authForms.signup.tone === 'error' && Boolean(state.authForms.signup.message);
  const signupFeedbackMessage = signupHasError
    ? `ERROR: ${state.authForms.signup.message}`
    : (state.authForms.signup.message || 'Complete all required fields to create your account.');
  return `
    <section class="card form-card">
      <h3>Create account</h3>
      <p class="muted">Use your legal identity details so employers and recruiters can verify your profile.</p>
      <p class="muted">Storage note: account records currently use in-memory backend storage for this environment.</p>
      <form id="signup-form" class="form-stack">
        <p id="signup-feedback" class="status-banner ${state.authForms.signup.message ? `status-${state.authForms.signup.tone}` : 'status-info'}${signupHasError ? ' auth-error-banner' : ''}" role="alert" aria-live="assertive">${escapeHtml(signupFeedbackMessage)}</p>
        <section class="form-section">
          <h4>Account Identity</h4>
          <label>Legal Name
            <input name="legalName" minlength="2" required />
          </label>
          <label>Primary Email
            <input name="email" type="email" required />
          </label>
          <p class="muted">Primary email secures daily account access and login verification.</p>
          <label>Password
            <input name="password" type="password" minlength="8" required />
          </label>
          <p class="muted">${PASSWORD_POLICY_MESSAGE}</p>
          <label>Confirm Password
            <input name="confirmPassword" type="password" minlength="8" required />
          </label>
        </section>
        <section class="form-section">
          <h4>Role</h4>
          <p class="muted">Select the role that best fits your guild access.</p>
          <div class="radio-group">
            <label class="radio-option">
              <input type="radio" name="role" value="employee_member" required />
              <span>Employee / Member</span>
            </label>
            <label class="radio-option">
              <input type="radio" name="role" value="employer" />
              <span>Employer</span>
            </label>
            <label class="radio-option">
              <input type="radio" name="role" value="recruiter" />
              <span>Recruiter</span>
            </label>
          </div>
        </section>
        <section class="form-section">
          <h4>Organization</h4>
          <label>Organization / Guild Name (optional)
            <input name="organizationName" />
          </label>
        </section>
        <section class="form-section">
          <h4>Account Recovery</h4>
          <label>Backup Email Address
            <input name="backupEmail" type="email" />
          </label>
          <p class="muted">Backup email receives recovery and verification codes if you lose access to your primary email.</p>
        </section>
        <div class="actions">
          <button class="pill-btn cta-primary" type="submit" id="signup-submit-btn" ${state.authForms.signup.loading ? 'disabled' : ''}>${state.authForms.signup.loading ? 'Creating Account...' : 'Create Account'}</button>
        </div>
        <p class="muted" style="margin:8px 0 4px;">or</p>
        <div id="google-signup-button" aria-label="Continue with Google"></div>
      </form>
      <p class="muted">Already have an account? <a href="#/login">Log In</a></p>
    </section>
  `;
}

function recruiterPage() {
  const profile = state.currentUser || {};
  const participants = (state.network.connections || []).slice(0, 4);

  return layoutColumns({
    className: 'recruiter-layout',
    left: `
      <section class="recruiter-hero recruiter-command-hero">
        <p class="hero-kicker">Wyked Samurai Guild</p>
        <h3>Recruiter Console</h3>
        <p>Talent intelligence command center for scenario-based hiring decisions.</p>
      </section>
      <div class="candidate-card-stack">
        ${(participants.map((candidate, index) => `
          <article class="candidate-insight-card candidate-insight-spotlight">
            <div class="profile-summary-row">
              ${avatarMarkup(candidate, 'md')}
              <div>
                <strong>${escapeHtml(candidate.displayName || candidate.username)}</strong>
                <p class="muted">${escapeHtml(candidate.role || 'member')}</p>
              </div>
              <span class="candidate-rank">P${index + 1}</span>
            </div>
            <p class="muted">Connection active · Available for scenario review.</p>
          </article>
        `).join('')) || '<p class="muted">Add guild connections to unlock candidate insights.</p>'}
      </div>
    `,
    center: `
      <h3>Recruiter Intelligence Core</h3>
      <div class="grid two recruiter-insights-grid" style="margin-top:10px;">
        <section class="card candidate-insight-card insight-emphasis">
          <h4>Candidate Insights</h4>
          <p class="muted">Primary role fit: ${escapeHtml(profile.role || 'member')}</p>
          <p class="muted">Organization: ${escapeHtml(profile.organizationName || 'Independent')}</p>
          <p class="muted">Active connections: ${state.network.connections.length}</p>
        </section>
        <section class="card activity-records records-table">
          <h4>Recent Performance</h4>
          <ul class="list compact-list">
            ${['Trial execution consistency', 'Communication clarity trend', 'Stakeholder response quality'].map((item) => `<li><span>${item}</span><span class="muted">Logged · 7d</span></li>`).join('')}
          </ul>
        </section>
        <section class="card metric-card-grid recruiter-metric-section">
          <h4>Participation Analytics</h4>
          <div class="metric-grid recruiter-metric-grid">
            <article class="metric-card recruiter-metric-card"><span>Participation Depth</span><strong>84%</strong></article>
            <article class="metric-card recruiter-metric-card"><span>Team Contribution</span><strong>71%</strong></article>
            <article class="metric-card recruiter-metric-card"><span>Response Latency</span><strong>42s</strong></article>
          </div>
        </section>
        <section class="card candidate-insight-card">
          <h4>Scenario Intelligence</h4>
          <p class="muted">Top pressure scenarios, risk behavior patterns, and coaching prompts are prioritized for shortlist decisions.</p>
        </section>
      </div>
      <section class="card network-feature-panel">
        <div class="network-panel-head">
          <h4>Guild Network Map</h4>
          <span class="muted">Static strategic layer</span>
        </div>
        <p class="muted">Cluster map of guild influence, trust bridges, and high-collaboration nodes.</p>
        <div class="network-map-placeholder">Strategic Network View</div>
      </section>
    `,
    right: messagingRail({ title: 'Messaging + Network Panel', description: 'Recruiter communications and relationship activity.', includeAreaChat: true }),
  });
}

function fallbackPage() {
  return card('Coming Soon', '<p class="muted">This route currently uses a placeholder shell to preserve navigation continuity.</p>');
}

function resolveGoogleClientId() {
  const configuredMeta = document
    .querySelector(`meta[name="${GOOGLE_CLIENT_ID_META_KEY}"]`)
    ?.getAttribute('content');
  return (configuredMeta || window.WSG_GOOGLE_CLIENT_ID || '').trim();
}

function renderGoogleButton(containerId) {
  const google = window.google;
  const container = document.getElementById(containerId);
  if (!google?.accounts?.id || !container) {
    return;
  }
  container.innerHTML = '';
  google.accounts.id.renderButton(container, {
    theme: 'outline',
    size: 'large',
    width: 320,
    text: 'continue_with',
    shape: 'pill',
  });
}

async function handleGoogleCredentialResponse(response, formName) {
  const credential = String(response?.credential || '').trim();
  if (!credential) {
    const message = 'Google sign-in did not return a valid credential.';
    setFormMessage(formName, message, 'error');
    setStatusMessage(message, 'error');
    render();
    return;
  }

  state.authForms[formName].loading = true;
  setFormMessage(formName, 'Signing in with Google...', 'info');
  setStatusMessage('Signing in with Google...', 'info');
  render();
  try {
    const result = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken: credential }),
    });
    await finalizeSignInResult(result, formName);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to sign in with Google right now.';
    setFormMessage(formName, message, 'error');
    setStatusMessage(message, 'error');
  } finally {
    state.authForms[formName].loading = false;
    render();
  }
}

async function finalizeSignInResult(result, formName) {
  if (result?.mfa_required) {
    const code = window.prompt('Enter your MFA code to finish sign-in:') || '';
    const mfaResult = await apiRequest('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({
        mfa_challenge_token: result?.mfa_challenge_token,
        code,
      }),
    });
    setAuthSession(mfaResult);
    setFormMessage(formName, 'MFA verified. Login successful.', 'success');
    setStatusMessage('MFA verified. Login successful.', 'success');
  } else {
    setAuthSession(result);
    setFormMessage(formName, 'Login successful.', 'success');
    setStatusMessage('Login successful.', 'success');
  }

  state.membersLoaded = false;
  setTimeout(() => {
    location.hash = '/profile';
  }, 200);
}

function initializeGoogleAuth(routeKey) {
  if (routeKey !== 'login' && routeKey !== 'signup') {
    return;
  }

  const google = window.google;
  if (!google?.accounts?.id) {
    return;
  }

  const clientId = resolveGoogleClientId();
  if (!clientId) {
    return;
  }

  if (!googleInitialized) {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        const formName = location.hash === '#/signup' ? 'signup' : 'login';
        handleGoogleCredentialResponse(response, formName);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    googleInitialized = true;
  }

  renderGoogleButton('google-login-button');
  renderGoogleButton('google-signup-button');
}

function setAuthSession({ sessionToken, user }) {
  const normalized = normalizeLayeredProfile(user);
  state.authToken = sessionToken;
  state.currentUser = normalized.user;
  state.scenarioDetail.sessions = {};
  state.layers = normalized.layers;
  state.availableLayers = normalized.availableLayers;
  state.lockedLayers = normalized.lockedLayers;
  state.activeLayer = state.availableLayers.includes(state.activeLayer) ? state.activeLayer : (state.availableLayers[0] || 'free');
  localStorage.setItem('wsg-auth-token', sessionToken);
  console.log('[auth:frontend] session token saved', {
    hasSessionToken: Boolean(sessionToken),
    userId: normalized.user?.id || null,
    email: normalized.user?.email || null,
  });
}

function clearAuthSession() {
  state.authToken = '';
  state.currentUser = null;
  state.scenarioDetail.sessions = {};
  state.layers = {};
  state.availableLayers = ['free'];
  state.lockedLayers = ['professional', 'roleplay'];
  state.activeLayer = 'free';
  localStorage.removeItem('wsg-auth-token');
}

async function bootstrapAuth() {
  if (!state.authToken) {
    return;
  }

  try {
    const data = await apiRequest('/auth/me');
    const normalized = normalizeLayeredProfile(data.user);
    state.currentUser = normalized.user;
    state.layers = normalized.layers;
    state.availableLayers = normalized.availableLayers;
    state.lockedLayers = normalized.lockedLayers;
    state.activeLayer = state.availableLayers.includes(state.activeLayer) ? state.activeLayer : (state.availableLayers[0] || 'free');
    console.log('[auth:frontend] bootstrap /auth/me success', { userId: normalized.user?.id, email: normalized.user?.email });
  } catch {
    console.warn('[auth:frontend] bootstrap /auth/me failed, clearing local auth session');
    clearAuthSession();
  }
}

async function ensureMembersLoaded() {
  if (state.membersLoaded) {
    return;
  }

  state.loading = true;
  try {
    const data = await apiRequest('/members', { method: 'GET' });
    state.members = data.items;
    state.membersLoaded = true;
  } finally {
    state.loading = false;
  }
}

async function loadConnections() {
  if (!state.currentUser) {
    return;
  }
  const data = await apiRequest('/connections');
  state.network.connections = data.items || [];
}

async function searchConnectionCandidates(query = '') {
  if (!state.currentUser) {
    return;
  }
  const encoded = encodeURIComponent(query);
  const data = await apiRequest(`/connections/search?q=${encoded}`);
  state.network.results = data.items || [];
}

async function loadDirectChat(connectionId) {
  if (!connectionId) {
    state.directChat.messages = [];
    state.directChat.activeConnectionId = '';
    state.shell.selectedConversation = '';
    state.shell.chatOpen = false;
    state.shell.chatMinimized = false;
    return;
  }
  state.directChat.loading = true;
  state.directChat.error = '';
  try {
    const data = await apiRequest(`/chats/direct/${connectionId}`);
    state.directChat.activeConnectionId = connectionId;
    state.shell.selectedConversation = connectionId;
    state.shell.chatOpen = true;
    state.shell.chatMinimized = false;
    state.directChat.messages = data.thread?.messages || [];
    setStatusMessage('Direct chat opened.', 'success');
  } catch (error) {
    state.directChat.error = error instanceof Error ? error.message : 'Chat unavailable.';
    setStatusMessage('Chat unavailable.', 'error');
  } finally {
    state.directChat.loading = false;
  }
}

async function loadScenarioChat() {
  const data = await apiRequest(`/chats/scenario?scenarioId=${encodeURIComponent(state.scenarioChat.scenarioId)}`);
  state.scenarioChat.messages = data.thread?.messages || [];
}

async function loadAreaChat() {
  const data = await apiRequest(`/chats/area?areaId=${encodeURIComponent(state.areaChat.areaId)}`);
  state.areaChat.messages = data.thread?.messages || [];
}

async function loadProfileForRoute(path) {
  if (path === '/profile') {
    const result = await apiRequest('/profile/me');
    const normalized = normalizeLayeredProfile(result.profile);
    state.activeProfile = normalized.user;
    state.currentUser = normalized.user;
    state.layers = normalized.layers;
    state.availableLayers = normalized.availableLayers;
    state.lockedLayers = normalized.lockedLayers;
    if (!state.availableLayers.includes(state.activeLayer)) {
      state.activeLayer = state.availableLayers[0] || 'free';
    }
    console.log('[profile:frontend] profile route load success', {
      path,
      hasCurrentUser: Boolean(state.currentUser),
      userId: state.currentUser?.id || null,
      activeLayer: state.activeLayer,
    });
    return;
  }

  const match = path.match(/^\/members\/([a-fA-F0-9-]+)$/);
  if (!match) {
    return;
  }

  try {
    const data = await apiRequest(`/members/${match[1]}`);
    state.activeProfile = data.profile;
    console.log('[profile:frontend] member profile fetch success', { memberId: match[1] });
  } catch {
    console.warn('[profile:frontend] member profile fetch failure', { memberId: match[1] });
    state.activeProfile = null;
  }
}

function applyRouteGuards(path) {
  const isScenarioRoute = path === '/scenario' || path.startsWith('/scenario/');
  const known = routes[path]
    || (path.startsWith('/members/') ? { key: 'profile', requiresAuth: true } : null)
    || (isScenarioRoute ? { key: 'scenarioDetail', requiresAuth: true } : null);
  if (!known) {
    return path;
  }

  if (known.requiresAuth && !state.currentUser) {
    return '/login';
  }

  if (known.guestOnly && state.currentUser) {
    return '/profile';
  }

  return path;
}

function attachScenarioDetailHandlers() {
  const scenarioId = state.scenarioDetail.activeScenarioId;
  if (!scenarioId) {
    return;
  }
  const scenario = findScenarioBlueprint(scenarioId);
  const session = ensureScenarioSession(scenarioId);
  if (!scenario || !session) {
    return;
  }

  document.querySelectorAll('.scenario-location-btn').forEach((button) => {
    button.onclick = () => {
      const locationId = String(button.getAttribute('data-location-id') || '');
      if (!scenario.locations[locationId]) {
        return;
      }
      if (!session.visitedLocations.includes(locationId)) {
        session.visitedLocations.push(locationId);
      }
      session.currentLocation = locationId;
      persistScenarioProgress(scenarioId);
      render();
    };
  });

  document.querySelectorAll('.scenario-response-btn').forEach((button) => {
    button.onclick = () => {
      const selectedResponse = String(button.getAttribute('data-response-value') || '').trim();
      const locationId = session.currentLocation;
      if (!selectedResponse) {
        return;
      }

      if (locationId === scenario.startLocation && session.finalUnlocked) {
        session.finalAnswer = selectedResponse;
      } else if (scenario.hallOrder.includes(locationId)) {
        session.answers[locationId] = selectedResponse;
        if (!session.completedHalls.includes(locationId)) {
          session.completedHalls.push(locationId);
        }
      }

      if (scenario.hallOrder.every((hallId) => session.completedHalls.includes(hallId))) {
        session.finalUnlocked = true;
      }
      if (session.finalUnlocked && locationId !== scenario.startLocation) {
        session.currentLocation = scenario.startLocation;
      }
      persistScenarioProgress(scenarioId);
      render();
    };
  });

  const finalAnswerForm = document.getElementById('scenario-final-form');
  if (finalAnswerForm) {
    finalAnswerForm.onsubmit = (event) => {
      event.preventDefault();
      const input = document.getElementById('scenario-final-input');
      const value = String(input?.value || session.finalAnswer || '').trim();
      if (!value) {
        return;
      }

      session.finalAnswer = value;
      session.finalSubmitted = true;
      session.completionMessageVisible = true;
      persistScenarioProgress(scenarioId);
      render();
    };
  }

  const resetButton = document.getElementById('scenario-reset-btn');
  if (resetButton) {
    resetButton.onclick = () => {
      resetScenarioProgress(scenarioId);
      render();
    };
  }
}

function getLoginErrorMessage(error) {
  const fallback = 'Unable to sign in right now. Please try again.';
  const message = error instanceof Error ? error.message : '';
  return message || fallback;
}

async function handleAuthSubmit(formId, endpoint, feedbackId, mapPayload, validatePayload = null) {
  const form = document.getElementById(formId);
  if (!form) {
    return;
  }

  form.onsubmit = async (event) => {
    event.preventDefault();
    const feedback = document.getElementById(feedbackId);
    const formData = new FormData(form);
    const payload = mapPayload(formData);

    if (typeof validatePayload === 'function') {
      const validationError = validatePayload(payload);
      if (validationError) {
        feedback.textContent = validationError;
        return;
      }
    }

    feedback.textContent = 'Submitting...';
    try {
      const requestPayload = { ...payload };
      delete requestPayload.confirmPassword;
      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestPayload),
      });

      setAuthSession(result);
      feedback.textContent = 'Success.';
      setStatusMessage('Login successful.', 'success');
      state.membersLoaded = false;
      location.hash = '/app';
    } catch (error) {
      feedback.textContent = error.message;
    }
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
  return PASSWORD_POLICY_REGEX.test(String(password || ''));
}

function attachProfileEditHandler() {
  const layerTabs = document.getElementById('profile-layer-tabs');
  if (layerTabs) {
    layerTabs.querySelectorAll('[data-layer-tab]').forEach((button) => {
      button.onclick = async () => {
        const nextLayer = String(button.getAttribute('data-layer-tab') || 'free');
        if (state.lockedLayers.includes(nextLayer)) return;
        state.activeLayer = nextLayer;
        try {
          await apiRequest(`/profile/layers/${nextLayer}/activate`, { method: 'POST' });
        } catch {
          // no-op placeholder until server-side active-layer persistence is introduced
        }
        render();
      };
    });
  }

  const layerForm = document.getElementById('profile-layer-form');
  if (layerForm) {
    layerForm.onsubmit = async (event) => {
      event.preventDefault();
      if (state.profileHub.saving) return;
      const formData = new FormData(layerForm);
      const layerKey = String(formData.get('layerKey') || state.activeLayer || 'free');
      const payload = {
        displayName: String(formData.get('displayName') || ''),
        headline: String(formData.get('headline') || ''),
        bio: String(formData.get('bio') || ''),
        skills: String(formData.get('skills') || ''),
      };

      state.profileHub.saving = true;
      setProfileHubMessage('Saving profile layer...', 'info');
      render();
      try {
        const result = await apiRequest(`/profile/layers/${layerKey}`, { method: 'PATCH', body: JSON.stringify(payload) });
        const normalized = normalizeLayeredProfile(result.profile);
        state.currentUser = normalized.user;
        state.activeProfile = normalized.user;
        state.layers = normalized.layers;
        state.availableLayers = normalized.availableLayers;
        state.lockedLayers = normalized.lockedLayers;
        setProfileHubMessage('Profile layer saved successfully.', 'success');
      } catch (error) {
        setProfileHubMessage(error instanceof Error ? error.message : 'Unable to save profile layer right now.', 'error');
      } finally {
        state.profileHub.saving = false;
        render();
      }
    };
  }

  const saveButton = document.getElementById('save-profile-hub-btn');
  const profileHubForm = document.getElementById('profile-hub-form');
  if (saveButton && profileHubForm) {
    profileHubForm.onsubmit = async (event) => {
      event.preventDefault();
      if (state.profileHub.saving) return;
      const formData = new FormData(profileHubForm);
      const payload = {
        legalName: String(formData.get('legalName') || state.currentUser?.legalName || ''),
        email: String(formData.get('email') || state.currentUser?.email || ''),
        role: String(formData.get('role') || state.currentUser?.role || ''),
        organizationName: String(formData.get('organizationName') || state.currentUser?.organizationName || ''),
      };
      state.profileHub.saving = true;
      setProfileHubMessage('Saving account settings...', 'info');
      render();
      try {
        const result = await apiRequest('/profile/hub', { method: 'PATCH', body: JSON.stringify(payload) });
        const normalized = normalizeLayeredProfile(result.profile);
        state.currentUser = normalized.user;
        state.activeProfile = normalized.user;
        state.layers = normalized.layers;
        state.availableLayers = normalized.availableLayers;
        state.lockedLayers = normalized.lockedLayers;
        setProfileHubMessage('Account settings saved successfully.', 'success');
        setStatusMessage('Account settings saved successfully.', 'success');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to save account settings right now.';
        setProfileHubMessage(message, 'error');
        setStatusMessage(message, 'error');
      } finally {
        state.profileHub.saving = false;
        render();
      }
    };
  }

  const searchForm = document.getElementById('connection-search-form');
  if (searchForm) {
    searchForm.onsubmit = async (event) => {
      event.preventDefault();
      const searchInput = document.getElementById('connection-search-input');
      state.network.searchTerm = String(searchInput?.value || '').trim();
      await searchConnectionCandidates(state.network.searchTerm);
      render();
    };
  }
}

function attachArenaHandlers() {
  const leftPanelToggle = document.getElementById('arena-left-panel-toggle');
  if (leftPanelToggle) {
    leftPanelToggle.onclick = () => {
      if (window.matchMedia('(max-width: 1180px)').matches) {
        state.arena.mobileLeftOpen = !state.arena.mobileLeftOpen;
        if (state.arena.mobileLeftOpen) {
          state.arena.mobileRightOpen = false;
        }
      } else {
        state.arena.leftPanelCollapsed = !state.arena.leftPanelCollapsed;
        persistArenaLayoutPrefs();
      }
      render();
    };
  }

  const rightPanelToggle = document.getElementById('arena-right-panel-toggle');
  if (rightPanelToggle) {
    rightPanelToggle.onclick = () => {
      if (window.matchMedia('(max-width: 1180px)').matches) {
        state.arena.mobileRightOpen = !state.arena.mobileRightOpen;
        if (state.arena.mobileRightOpen) {
          state.arena.mobileLeftOpen = false;
        }
      } else {
        state.arena.rightPanelCollapsed = !state.arena.rightPanelCollapsed;
        persistArenaLayoutPrefs();
      }
      render();
    };
  }

  document.querySelectorAll('[data-arena-tab]').forEach((button) => {
    button.onclick = () => {
      state.arena.rightPanelTab = String(button.getAttribute('data-arena-tab') || 'connections');
      persistArenaLayoutPrefs();
      render();
    };
  });

  const startButtons = document.querySelectorAll('.start-trial-btn');
  startButtons.forEach((button) => {
    button.onclick = () => {
      const trialId = button.getAttribute('data-trial-id');
      const selectedTrial = STARTER_TRIALS.find((trial) => trial.id === trialId);
      if (!selectedTrial) {
        return;
      }

      state.arena.activeTrialId = selectedTrial.id;
      state.arena.messages = [{ id: crypto.randomUUID(), type: 'system', content: selectedTrial.openingPrompt }];
      render();
    };
  });

  const inputForm = document.getElementById('arena-input-form');
  if (inputForm) {
    inputForm.onsubmit = async (event) => {
      event.preventDefault();
      const input = document.getElementById('arena-input');
      const value = String(input?.value || '').trim();
      if (!value) {
        return;
      }

      state.arena.error = '';
      state.arena.messages.push({ id: crypto.randomUUID(), type: 'user', content: value });
      input.value = '';
      state.arena.pending = true;
      render();

      const activeTrial = getActiveTrial();
      if (!activeTrial) {
        state.arena.messages.push({
          id: crypto.randomUUID(),
          type: 'system',
          content: 'No active trial found.',
        });
        state.arena.pending = false;
        render();
        return;
      }

      try {
        const aiReply = await requestArenaAssistantReply({ userMessage: value, activeTrial });
        state.arena.messages.push({
          id: crypto.randomUUID(),
          type: 'system',
          content: aiReply,
        });
      } catch (error) {
        console.error('[ai:frontend] Arena response failed', {
          trialId: activeTrial.id,
          message: value,
          error,
        });
        state.arena.error = getArenaFriendlyErrorMessage(error);
        state.arena.messages.push({
          id: crypto.randomUUID(),
          type: 'system',
          content: 'AI response unavailable right now.',
        });
      }
      state.arena.pending = false;
      render();
    };
  }

  const chatLog = document.getElementById('arena-conversation-log');
  if (chatLog) {
    chatLog.scrollTop = chatLog.scrollHeight;
  }
}


function attachHomeChatHandlers() {
  const chatForm = document.getElementById('home-chat-form');
  if (!chatForm) {
    return;
  }

  chatForm.onsubmit = async (event) => {
    event.preventDefault();
    const input = document.getElementById('home-chat-input');
    const value = String(input?.value || '').trim();
    if (!value || state.homeChat.pending) {
      return;
    }

    state.homeChat.error = '';
    state.homeChat.messages.push({ id: crypto.randomUUID(), type: 'user', content: value });
    input.value = '';
    state.homeChat.pending = true;
    render();

    try {
      const aiReply = await requestHomeAssistantReply(value);
      state.homeChat.messages.push({
        id: crypto.randomUUID(),
        type: 'system',
        content: aiReply,
      });
    } catch (error) {
      state.homeChat.error = error instanceof Error ? error.message : 'AI chat request failed.';
      state.homeChat.messages.push({
        id: crypto.randomUUID(),
        type: 'system',
        content: 'AI response unavailable right now.',
      });
    }

    state.homeChat.pending = false;
    render();
  };

  const chatLog = document.getElementById('home-chat-log');
  if (chatLog) {
    chatLog.scrollTop = chatLog.scrollHeight;
  }
}


function attachChatPaneHandlers() {
  document.querySelectorAll('[data-pane-tab]').forEach((button) => {
    button.onclick = () => {
      const nextTab = String(button.getAttribute('data-pane-tab') || 'connections');
      if (nextTab !== 'connections' && nextTab !== 'chat') {
        return;
      }
      state.shell.activePaneTab = nextTab;
      render();
    };
  });

  const searchForm = document.getElementById('global-connections-search-form');
  if (searchForm) {
    searchForm.onsubmit = async (event) => {
      event.preventDefault();
      const searchInput = document.getElementById('global-connections-search-input');
      const query = String(searchInput?.value || '').trim();
      state.network.searchTerm = query;
      await searchConnectionCandidates(query);
      state.network.connections = state.network.results.length ? state.network.results : [];
      render();
    };
  }

  const openDirectChat = async (connectionId) => {
    if (!connectionId || state.directChat.pending) {
      return;
    }
    await loadDirectChat(connectionId);
    state.shell.activePaneTab = 'chat';
    render();
  };

  document.querySelectorAll('.open-direct-chat-btn, .open-global-chat-btn, .global-conversation-item').forEach((button) => {
    button.onclick = async () => {
      const connectionId = button.getAttribute('data-connection-id');
      await openDirectChat(connectionId);
    };
  });

  const sendDirectMessage = async (inputId) => {
    const input = document.getElementById(inputId);
    const content = String(input?.value || '').trim();
    if (!content || !state.directChat.activeConnectionId || state.directChat.pending) {
      return;
    }

    state.directChat.pending = true;
    state.directChat.error = '';
    render();
    try {
      const data = await apiRequest(`/chats/direct/${state.directChat.activeConnectionId}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      state.directChat.messages = data.thread?.messages || [];
      if (input) {
        input.value = '';
      }
    } catch (error) {
      state.directChat.error = error instanceof Error ? error.message : 'Unable to send message.';
      setStatusMessage(state.directChat.error, 'error');
    } finally {
      state.directChat.pending = false;
      render();
    }
  };

  const directChatForm = document.getElementById('direct-chat-form');
  if (directChatForm) {
    directChatForm.onsubmit = async (event) => {
      event.preventDefault();
      await sendDirectMessage('direct-chat-input');
    };
  }

  const globalChatForm = document.getElementById('global-chat-form');
  if (globalChatForm) {
    globalChatForm.onsubmit = async (event) => {
      event.preventDefault();
      await sendDirectMessage('global-chat-input');
    };
  }

  const toggleChatPaneButton = document.getElementById('toggle-chat-pane-btn');
  if (toggleChatPaneButton) {
    toggleChatPaneButton.onclick = () => {
      state.shell.chatMinimized = !state.shell.chatMinimized;
      render();
    };
  }

  const closeChatPaneButton = document.getElementById('close-chat-pane-btn');
  if (closeChatPaneButton) {
    closeChatPaneButton.onclick = () => {
      state.shell.chatOpen = false;
      state.shell.chatMinimized = false;
      render();
    };
  }

  const scenarioChatForm = document.getElementById('scenario-chat-form');
  if (scenarioChatForm) {
    scenarioChatForm.onsubmit = async (event) => {
      event.preventDefault();
      const input = document.getElementById('scenario-chat-input');
      const content = String(input?.value || '').trim();
      if (!content || state.scenarioChat.pending) {
        return;
      }
      state.scenarioChat.pending = true;
      render();
      try {
        const data = await apiRequest('/chats/scenario', {
          method: 'POST',
          body: JSON.stringify({ scenarioId: state.scenarioChat.scenarioId, content }),
        });
        state.scenarioChat.messages = data.thread?.messages || [];
        if (input) {
          input.value = '';
        }
      } finally {
        state.scenarioChat.pending = false;
        render();
      }
    };
  }

  const areaChatForm = document.getElementById('area-chat-form');
  if (areaChatForm) {
    areaChatForm.onsubmit = async (event) => {
      event.preventDefault();
      const input = document.getElementById('area-chat-input');
      const content = String(input?.value || '').trim();
      if (!content || state.areaChat.pending) {
        return;
      }
      state.areaChat.pending = true;
      render();
      try {
        const data = await apiRequest('/chats/area', {
          method: 'POST',
          body: JSON.stringify({ areaId: state.areaChat.areaId, content }),
        });
        state.areaChat.messages = data.thread?.messages || [];
        if (input) {
          input.value = '';
        }
      } finally {
        state.areaChat.pending = false;
        render();
      }
    };
  }
}

function attachHeaderActions() {
  const professionalModeButton = document.getElementById('professional-mode');
  if (professionalModeButton) {
    professionalModeButton.onclick = () => setMode('professional');
  }

  const roleplayModeButton = document.getElementById('roleplay-mode');
  if (roleplayModeButton) {
    roleplayModeButton.onclick = () => setMode('roleplay');
  }

  const logoutButton = document.getElementById('logout-btn');
  if (logoutButton) {
    logoutButton.onclick = () => {
      clearAuthSession();
      setStatusMessage('Signed out successfully.', 'success');
      location.hash = '/login';
    };
  }
}

// Backward-compatible alias for older render code that still references the previous symbol name.
const attachedHeaderActions = attachHeaderActions;

function starterScenarioModalMarkup() {
  if (!state.onboarding.starterModalOpen) {
    return '';
  }

  return `
    <div class="modal-backdrop" id="starter-scenario-modal" role="dialog" aria-modal="true" aria-labelledby="starter-scenario-title">
      <section class="panel" style="max-width:560px;margin:8vh auto;padding:20px;">
        <h3 id="starter-scenario-title">Starter Scenario Ready</h3>
        <p class="muted">Your onboarding scenario is loaded. Start in the Trial Arena to complete your first guided challenge.</p>
        <div class="header-actions" style="justify-content:flex-end;">
          <button class="pill-btn" type="button" id="dismiss-starter-scenario-btn">Later</button>
          <button class="pill-btn cta-primary" type="button" id="open-starter-scenario-btn">Open Trial Arena</button>
        </div>
      </section>
    </div>
  `;
}

function attachOnboardingHandlers() {
  const dismissButton = document.getElementById('dismiss-starter-scenario-btn');
  if (dismissButton) {
    dismissButton.onclick = () => {
      markStarterScenarioSeen();
      state.onboarding.starterModalOpen = false;
      render();
    };
  }

  const openButton = document.getElementById('open-starter-scenario-btn');
  if (openButton) {
    openButton.onclick = () => {
      markStarterScenarioSeen();
      state.onboarding.starterModalOpen = false;
      location.hash = '/arena';
    };
  }
}

function setMode(nextMode) {
  state.mode = nextMode;
  localStorage.setItem('wsg-mode', state.mode);
  applyModeClass();
  render();
}

function applyModeClass() {
  document.body.classList.remove('mode-professional', 'mode-roleplay');
  document.body.classList.add(state.mode === 'roleplay' ? 'mode-roleplay' : 'mode-professional');
}

function renderLayout(path, key, pageHtml) {
  applyModeClass();
  applyPageBackground(path, key);

  const statusMarkup = state.statusMessage
    ? `<p class="status-banner status-${state.statusMessage.tone}" role="status">${escapeHtml(state.statusMessage.message)}</p>`
    : '';

  document.getElementById('app').innerHTML = `
    ${AppShell(path, key, pageHtml, statusMarkup)}
    ${starterScenarioModalMarkup()}
    ${SiteFooter()}
  `;

  attachHeaderActions();
  attachOnboardingHandlers();
}

function renderPublicLayout(path, key, pageHtml) {
  const [title, subtitle] = pageTitle(key);
  applyModeClass();
  applyPageBackground(path, key);
  const showPageHeader = key !== 'landing';

  const statusMarkup = state.statusMessage
    ? `<p class="status-banner status-${state.statusMessage.tone}" role="status">${escapeHtml(state.statusMessage.message)}</p>`
    : '';

  document.getElementById('app').innerHTML = `
    <div class="public-shell">
      <header class="public-header panel">
        <div class="public-container public-header-inner">
          <div class="brand">
            ${guildBrandMark({ className: 'header-brand-mark' })}
            <div>
              <div class="title">Wyked Samurai Guild</div>
              <div class="subtitle">Strategic Guild Network • Nebula Nexus</div>
            </div>
          </div>
          <div class="header-actions">
            <a class="pill-btn" href="#/login">Log In</a>
            <a class="pill-btn" href="#/signup">Sign Up</a>
          </div>
        </div>
      </header>

      <main class="public-container public-content panel">
        ${showPageHeader ? `<section class="main-header"><h2>${title}</h2><p>${subtitle}</p></section>` : ''}
        ${statusMarkup}
        <section style="margin-top:${showPageHeader ? '14px' : '0'};">${pageHtml}</section>
      </main>
      ${SiteFooter()}
    </div>
  `;

  attachHeaderActions();
}

async function render() {
  let path = location.hash.replace('#', '') || '/';
  path = applyRouteGuards(path);

  if (location.hash.replace('#', '') !== path) {
    location.hash = path;
    return;
  }

  if (path === '/members') {
    await ensureMembersLoaded();
  }
  if (path === '/profile' || path.startsWith('/members/')) {
    await loadProfileForRoute(path);
  }
  const isPublicRoute = ['/', '/login', '/signup'].includes(path);
  if (state.currentUser && !isPublicRoute) {
    await loadConnections();
  }
  if (path === '/recruiter-console' || path === '/members') {
    await ensureMembersLoaded();
  }
  if (path === '/arena' || path === '/profile/scenario-chat') {
    await loadScenarioChat();
  }
  if (path === '/profile/area-chat') {
    await loadAreaChat();
  }
  if (path !== '/profile') {
    state.onboarding.starterModalOpen = false;
  } else {
    state.onboarding.starterModalOpen = isFirstArrivalAfterSignup();
    if (state.onboarding.starterModalOpen) {
      setStatusMessage('Starter scenario loaded. Begin onboarding to continue.', 'info');
    }
  }

  const route = routes[path] || (path.startsWith('/members/') ? { key: 'profile', requiresAuth: true } : { key: 'fallback' });
  const isScenarioRoute = path === '/scenario' || path.startsWith('/scenario/');
  const resolvedRoute = isScenarioRoute ? { key: 'scenarioDetail', requiresAuth: true } : route;
  const pageHtml = {
    landing: landingPage,
    home: homePage,
    arena: arenaPage,
    guild: guildPage,
    members: membersPage,
    profile: profilePage,
    directChat: directChatPage,
    scenarioChat: scenarioChatPage,
    areaChat: areaChatPage,
    scenarioDetail: () => scenarioDetailPage(path),
    profileEdit: profileEditPage,
    login: loginPage,
    signup: signupPage,
    recruiter: recruiterPage,
    fallback: fallbackPage,
  }[resolvedRoute.key]();

  if (resolvedRoute.key === 'landing' || resolvedRoute.key === 'login' || resolvedRoute.key === 'signup') {
    renderPublicLayout(path, resolvedRoute.key, pageHtml);
  } else {
    renderLayout(path, resolvedRoute.key, pageHtml);
  }
  initializeGoogleAuth(resolvedRoute.key);

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.onsubmit = async (event) => {
      event.preventDefault();
      if (state.authForms.login.loading) return;
      const formData = new FormData(loginForm);
      const email = String(formData.get('email') || '').trim();
      const password = String(formData.get('password') || '');
      if (!email || !password) {
        setFormMessage('login', 'Invalid email or password.', 'error');
        render();
        return;
      }
      const payload = {
        identifier: email,
        password,
      };
      console.log('[auth:frontend] login request payload prepared', {
        identifier: payload.identifier,
        fields: Object.keys(payload),
      });
      setFormMessage('login', 'Signing in...', 'info');
      setStatusMessage('Signing in...', 'info');
      state.authForms.login.loading = true;
      render();
      try {
        const result = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
        console.log('[auth:frontend] login server response', result);
        await finalizeSignInResult(result, 'login');
        console.log('[auth:frontend] login success', { userId: result?.user?.id, email: result?.user?.email });
      } catch (error) {
        console.warn('[auth:frontend] login server response error', error);
        console.warn('[auth:frontend] login failure', { identifier: payload.identifier, message: error instanceof Error ? error.message : String(error) });
        const message = getLoginErrorMessage(error);
        setFormMessage('login', message, 'error');
        setStatusMessage(message, 'error');
      } finally {
        state.authForms.login.loading = false;
        render();
      }
    };
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.onsubmit = async (event) => {
      event.preventDefault();
      if (state.authForms.signup.loading) return;
      const formData = new FormData(signupForm);
      const payload = {
        legalName: String(formData.get('legalName') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        password: String(formData.get('password') || ''),
        confirmPassword: String(formData.get('confirmPassword') || ''),
        role: String(formData.get('role') || ''),
        organizationName: String(formData.get('organizationName') || '').trim(),
        backupEmail: String(formData.get('backupEmail') || '').trim(),
      };

      const validationError = (() => {
        if (!payload.legalName) return 'Legal Name is required.';
        if (!payload.email || !isValidEmail(payload.email)) return 'Enter a valid Primary Email address.';
        if (!isStrongPassword(payload.password)) return PASSWORD_POLICY_MESSAGE;
        if (payload.password !== payload.confirmPassword) return 'Password and Confirm Password must match.';
        if (!payload.role) return 'Please select a role.';
        if (payload.backupEmail && !isValidEmail(payload.backupEmail)) return 'Enter a valid Backup Email Address.';
        return '';
      })();
      if (validationError) {
        console.warn('[auth:frontend] signup validation failed', { validationError });
        setFormMessage('signup', validationError, 'error');
        render();
        return;
      }

      setFormMessage('signup', 'Creating account...', 'info');
      state.authForms.signup.loading = true;
      render();
      try {
        const requestPayload = { ...payload };
        delete requestPayload.confirmPassword;
        console.log('[auth:frontend] signup request payload prepared', {
          email: requestPayload.email,
          role: requestPayload.role,
          fields: Object.keys(requestPayload),
        });
        const result = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify(requestPayload),
        });
        console.log('[auth:frontend] signup server response', result);
        console.log('[auth:frontend] signup success', { userId: result?.user?.id, email: result?.user?.email });
        setFormMessage('signup', 'Account created successfully. You can now sign in.', 'success');
        setStatusMessage('Account created successfully. You can now sign in.', 'success');
        setTimeout(() => {
          location.hash = '/login';
        }, 200);
      } catch (error) {
        console.warn('[auth:frontend] signup server response error', error);
        const message = error instanceof Error ? error.message : 'Unable to create account. Please check the form and try again.';
        console.warn('[auth:frontend] signup failure', { email: payload.email, message });
        setFormMessage('signup', message, 'error');
        setStatusMessage(message, 'error');
      } finally {
        state.authForms.signup.loading = false;
        render();
      }
    };
  }

  attachProfileEditHandler();
  document.querySelectorAll('.mode-nav-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const nextMode = button.getAttribute('data-mode');
      if (nextMode === 'professional' || nextMode === 'roleplay') {
        setMode(nextMode);
      }
    });
  });
  attachArenaHandlers();
  attachScenarioDetailHandlers();
  attachHomeChatHandlers();
  attachChatPaneHandlers();
  console.log('[wsg] render complete');
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', async () => {
  applyModeClass();
  const resolvedApiBaseUrl = resolveApiBaseUrl();
  console.log('[wsg] Resolved API base URL:', resolvedApiBaseUrl || '(same-origin)');
  await bootstrapAuth();
  render();
});

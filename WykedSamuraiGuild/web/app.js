import { supabase, supabaseConfig, toAppUser } from './supabaseClient.js';

const routes = {
  '/': { key: 'landing' },
  '/home': { key: 'home', requiresAuth: true },
  '/nexus': { key: 'nexus', requiresAuth: true },
  '/nexus/professional': { key: 'nexusProfessional', requiresAuth: true },
  '/nexus/roleplay': { key: 'nexusRoleplay', requiresAuth: true },
  '/hub': { key: 'hub', requiresAuth: true },
  '/app': { key: 'home', requiresAuth: true },
  '/arena': { key: 'nexusProfessional', requiresAuth: true },
  '/roleplay': { key: 'nexusRoleplay', requiresAuth: true },
  '/guild': { key: 'nexus', requiresAuth: true },
  '/world': { key: 'nexusRoleplay', requiresAuth: true },
  '/guild-world': { key: 'nexusRoleplay', requiresAuth: true },
  '/members': { key: 'hub', requiresAuth: true },
  '/discussions': { key: 'scenarioChat', requiresAuth: true },
  '/profile': { key: 'profile', requiresAuth: true },
  '/resume': { key: 'resume', requiresAuth: true },
  '/characters': { key: 'characters', requiresAuth: true },
  '/settings': { key: 'settings', requiresAuth: true },
  '/profile/direct-chat': { key: 'directChat', requiresAuth: true },
  '/profile/scenario-chat': { key: 'scenarioChat', requiresAuth: true },
  '/profile/area-chat': { key: 'areaChat', requiresAuth: true },
  '/scenario': { key: 'scenarioDetail', requiresAuth: true },
  '/login': { key: 'login', guestOnly: true },
  '/signup': { key: 'signup', guestOnly: true },
  '/policy/accept': { key: 'policyAccept', requiresAuth: true, bypassPolicyGuard: true },
  '/code-of-conduct': { key: 'codeOfConduct' },
  '/content-policy': { key: 'contentPolicy' },
  '/platform-rules': { key: 'platformRules' },
  '/privacy': { key: 'privacy' },
  '/recruiter-console': { key: 'recruiter', requiresAuth: true },
};

const topLevelNavItems = [
  {
    label: 'Home',
    path: '/home',
    items: [
      { label: 'Profile', path: '/profile' },
      { label: 'Resume', path: '/resume' },
      { label: 'Character 1', path: '/characters/character-1' },
      { label: 'Character 2', path: '/characters/character-2' },
      { label: 'Character 3', path: '/characters/character-3' },
      { label: 'Character 4', path: '/characters/character-4' },
      { label: 'Character 5', path: '/characters/character-5' },
      { label: 'Settings', path: '/settings' },
    ],
  },
  {
    label: 'Nexus',
    path: '/nexus',
    items: [
      { label: 'Professional', path: '/nexus/professional' },
      { label: 'Roleplay', path: '/nexus/roleplay' },
    ],
  },
  {
    label: 'Hub',
    path: '/hub',
    items: [
      { label: 'Social Landing Page', path: '/hub' },
    ],
  },
];

function visibleNavItems() {
  return topLevelNavItems;
}

function isNavItemActive(pathname, itemPath) {
  if (itemPath === '/nexus') {
    return pathname === '/nexus' || pathname.startsWith('/nexus/');
  }
  if (itemPath === '/home') {
    return pathname === '/home'
      || pathname === '/profile'
      || pathname === '/resume'
      || pathname === '/settings'
      || pathname.startsWith('/characters');
  }
  if (itemPath === '/hub') {
    return pathname === '/hub' || pathname === '/members';
  }
  return pathname === itemPath;
}

const STARTER_TRIALS = [
  {
    id: 'find-your-why',
    title: 'The First Step: Forge Your Purpose',
    description: 'Guild initiation rite where you traverse four halls, shape your hidden archetype profile, and declare your purpose.',
    category: 'Onboarding',
    difficulty: 'Foundational',
    openingPrompt: 'Begin at the Compass Dais, complete each hall in any order, return to the hub, and complete your initiation vow.',
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

const PROFESSIONAL_ROOMS = [
  {
    id: 'interview-circle',
    scenarioId: 'team-conflict',
    name: 'Interview Circle • Team Conflict',
    description: 'Temporary AI-run scenario focused on conflict mediation and hiring-panel communication.',
    visibility: 'private',
    roomType: 'interview',
    roomKind: 'scenario',
    category: 'Interviewing',
    allowedUsers: ['user-self', 'npc-hiring-manager', 'observer-mentor'],
    hostUserId: 'user-self',
    users: [
      { id: 'user-self', displayName: 'You', role: 'participant', isOnline: true },
      { id: 'npc-hiring-manager', displayName: 'Hiring Manager NPC', role: 'participant', isOnline: true },
      { id: 'observer-mentor', displayName: 'Mentor Observer', role: 'observer', isOnline: true },
    ],
    moderator: 'Aegis Moderator',
    sfwPolicy: 'Professional SFW moderation active',
    temporary: true,
    status: 'Open • In Progress',
  },
  {
    id: 'ops-debrief',
    name: 'Ops Debrief Lounge',
    description: 'Ongoing professional chat room for workplace operations, postmortems, and execution tradeoffs.',
    visibility: 'public',
    roomType: 'scenario',
    roomKind: 'chat',
    category: 'Workplace Practice',
    allowedUsers: [],
    hostUserId: 'user-self',
    users: [
      { id: 'user-self', displayName: 'You', role: 'member', isOnline: true },
      { id: 'npc-facilitator', displayName: 'Facilitator NPC', role: 'moderator', isOnline: true },
    ],
    moderator: 'Aegis Moderator',
    sfwPolicy: 'Professional SFW moderation active',
    temporary: false,
    status: 'Open',
  },
];

const ROLEPLAY_ROOMS = [
  {
    id: 'ember-crossing',
    trialId: 'team-conflict',
    name: 'Ember Crossing Council',
    description: 'Open council room where guild officers resolve faction disputes and keep fragile alliances intact.',
    tag: 'Diplomat',
    visibility: 'public',
    roomType: 'roleplay',
    roomKind: 'chat',
    category: 'Social Roleplay',
    moderator: 'Warden Echo',
    sfwPolicy: 'NPC moderator enforces SFW room safety',
    allowedUsers: [],
    hostUserId: 'user-self',
    temporary: false,
    status: 'Open',
    players: 7,
  },
  {
    id: 'dock-47',
    trialId: 'customer-escalation',
    name: 'Dock 47 Distress Channel',
    description: 'High-pressure response room reacting to incoming merchant convoy failures and sponsor complaints.',
    tag: 'Incident Commander',
    visibility: 'public',
    roomType: 'roleplay',
    roomKind: 'chat',
    category: 'Adventure Roleplay',
    moderator: 'Warden Echo',
    sfwPolicy: 'NPC moderator enforces SFW room safety',
    allowedUsers: [],
    hostUserId: 'user-self',
    temporary: false,
    status: 'Open',
    players: 11,
  },
  {
    id: 'shadow-forge',
    trialId: 'leadership-decision',
    name: 'Shadow Forge War Room',
    description: 'Strategy room balancing delivery speed against defense readiness during active threat windows.',
    tag: 'Strategist',
    visibility: 'private',
    roomType: 'roleplay',
    roomKind: 'chat',
    category: 'Faction Roleplay',
    moderator: 'Warden Echo',
    sfwPolicy: 'NPC moderator enforces SFW room safety',
    allowedUsers: ['user-self', 'npc-warden'],
    hostUserId: 'user-self',
    temporary: false,
    status: 'Open',
    players: 5,
  },
  {
    id: 'aurora-gate',
    trialId: 'operational-crisis',
    name: 'Aurora Gate Operations',
    description: 'Live operations room coordinating logistics, medical supply routes, and response priorities.',
    tag: 'Operations Lead',
    visibility: 'public',
    roomType: 'roleplay',
    roomKind: 'chat',
    category: 'World Events',
    moderator: 'Warden Echo',
    sfwPolicy: 'NPC moderator enforces SFW room safety',
    allowedUsers: [],
    hostUserId: 'user-self',
    temporary: false,
    status: 'Open',
    players: 9,
  },
];

const FIRST_SCENARIO_ID = 'find-your-why';
const ONBOARDING_ARCHETYPES = Object.freeze([
  'guardian',
  'builder',
  'seeker',
  'oathbound',
  'steward',
  'survivor',
  'wounded_healer',
  'pathfinder',
  'challenger',
  'legacy_bearer',
]);
const ONBOARDING_REFLECTION_FIELDS = Object.freeze({
  hall_memory: 'origins',
  hall_ambition: 'aspiration',
  hall_burden: 'weight',
  hall_connection: 'bonds',
});
const ONBOARDING_HALL_SCORING_RULES = Object.freeze({
  hall_memory: Object.freeze({
    hardship: Object.freeze({ survivor: 2, wounded_healer: 1, guardian: 1 }),
    love: Object.freeze({ guardian: 2, builder: 1, steward: 1 }),
    failure: Object.freeze({ seeker: 2, wounded_healer: 1, challenger: 1 }),
    duty: Object.freeze({ oathbound: 2, guardian: 1, steward: 1 }),
  }),
  hall_ambition: Object.freeze({
    'build something lasting': Object.freeze({ builder: 2, legacy_bearer: 1, steward: 1 }),
    'prove myself': Object.freeze({ challenger: 2, survivor: 1, seeker: 1 }),
    'protect others': Object.freeze({ guardian: 2, oathbound: 1, steward: 1 }),
    'discover who I can become': Object.freeze({ seeker: 2, pathfinder: 1, challenger: 1 }),
  }),
  hall_burden: Object.freeze({
    'fear of failure': Object.freeze({ survivor: 2, seeker: 1 }),
    responsibility: Object.freeze({ steward: 2, oathbound: 1, guardian: 1 }),
    loss: Object.freeze({ wounded_healer: 2, survivor: 1, legacy_bearer: 1 }),
    'unfinished purpose': Object.freeze({ pathfinder: 1, challenger: 1, legacy_bearer: 2 }),
  }),
  hall_connection: Object.freeze({
    family: Object.freeze({ guardian: 2, steward: 1 }),
    community: Object.freeze({ steward: 2, builder: 1, guardian: 1 }),
    promise: Object.freeze({ oathbound: 2, legacy_bearer: 1 }),
    'future companions': Object.freeze({ pathfinder: 2, guardian: 1, seeker: 1 }),
  }),
});
const ONBOARDING_FINAL_MOTIVATION_WEIGHTS = Object.freeze({
  'To become someone my younger self would trust.': Object.freeze({ seeker: 2, survivor: 1, wounded_healer: 1 }),
  'To build a life that lifts others higher.': Object.freeze({ builder: 2, steward: 2, guardian: 1 }),
  'To turn my pain into purpose.': Object.freeze({ wounded_healer: 2, survivor: 1, challenger: 1 }),
  'To leave something meaningful behind.': Object.freeze({ legacy_bearer: 2, builder: 1, oathbound: 1 }),
});
const SCENARIO_BLUEPRINTS = Object.freeze({
  'find-your-why': {
    id: 'find-your-why',
    slug: 'find-your-why',
    title: 'The First Step: Forge Your Purpose',
    description: 'A guild initiation and self-forging rite. Face each hall, reveal your hidden archetype pattern, then swear your purpose.',
    objective: 'Complete all four halls in any order, then return to the Compass Dais for your final vow.',
    startLocation: 'compass_dais',
    locations: {
      compass_dais: {
        id: 'compass_dais',
        name: 'Compass Dais',
        prompt: 'At the guild’s center stone, four halls await your self-forging rite. Choose any path.',
      },
      hall_memory: {
        id: 'hall_memory',
        name: 'Hall of Origins',
        prompt: 'What forged your beginning?',
        responses: [
          'hardship',
          'love',
          'failure',
          'duty',
        ],
      },
      hall_ambition: {
        id: 'hall_ambition',
        name: 'Hall of Aspiration',
        prompt: 'What future are you willing to pursue with your whole will?',
        responses: [
          'build something lasting',
          'prove myself',
          'protect others',
          'discover who I can become',
        ],
      },
      hall_burden: {
        id: 'hall_burden',
        name: 'Hall of Weight',
        prompt: 'What burden still rides with you?',
        responses: [
          'fear of failure',
          'responsibility',
          'loss',
          'unfinished purpose',
        ],
      },
      hall_connection: {
        id: 'hall_connection',
        name: 'Hall of Bonds',
        prompt: 'Whom do you carry in your purpose?',
        responses: [
          'family',
          'community',
          'promise',
          'future companions',
        ],
      },
    },
    hallOrder: ['hall_memory', 'hall_ambition', 'hall_burden', 'hall_connection'],
    scoring: {
      archetypes: ONBOARDING_ARCHETYPES,
      reflectionFields: ONBOARDING_REFLECTION_FIELDS,
      hallRules: ONBOARDING_HALL_SCORING_RULES,
      finalMotivationRules: ONBOARDING_FINAL_MOTIVATION_WEIGHTS,
    },
    finalPrompt: 'Name the purpose you swear to the guild.',
    finalResponses: [
      'To become someone my younger self would trust.',
      'To build a life that lifts others higher.',
      'To turn my pain into purpose.',
      'To leave something meaningful behind.',
    ],
    completionMessage: 'Initiation complete. Your hidden archetype profile and vow are sealed in your guild record.',
  },
});

const BRAND_ASSETS = Object.freeze({
  logo: '/assets/WGSGuildLogo.png',
  compactLogo: '/assets/WGSGuildLogo.png',
});


function pageSetClass(path, key) {
  if (path === '/arena' || key === 'arena') return 'page-set--arena';
  if (path === '/nexus/professional' || ['nexusProfessional', 'scenarioDetail', 'scenarioChat', 'areaChat'].includes(key) || path === '/scenario' || path.startsWith('/scenario/')) return 'page-set--scenario';
  if (path === '/guild') return 'page-set--guild';
  if (path === '/nexus/roleplay' || path === '/world' || path === '/roleplay' || key === 'nexusRoleplay' || key === 'roleplayHub') return 'page-set--world-rp';
  if (path === '/hub' || path === '/members' || path === '/recruiter-console' || key === 'recruiter' || key === 'hub' || key === 'members') return 'page-set--recruiter';
  if (path === '/profile' || key === 'profile' || ['directChat'].includes(key)) {
    return 'page-set--profile';
  }
  return 'page-set--home';
}

function guildBrandMark({ compact = false, className = '' } = {}) {
  return `
    <div class="guild-brand-mark ${compact ? 'is-compact' : ''} ${className}">
      <img src="${compact ? BRAND_ASSETS.compactLogo : BRAND_ASSETS.logo}" alt="Wyked Samurai Guild logo" loading="eager" decoding="async" />
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
const nexusLayoutPrefs = loadNexusPanelPrefs();

const state = {
  mode: localStorage.getItem('wsg-mode') || 'professional',
  authToken: '',
  currentUser: null,
  auth: {
    user: null,
    session: null,
    loading: true,
  },
  startupError: '',
  supabaseConfigMissing: false,
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
    policyAccept: { message: '', tone: 'info', loading: false, attemptedSubmit: false, agreed: false },
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
  nexus: {
    activeProfessionalRoomId: PROFESSIONAL_ROOMS[0]?.id || '',
    activeRoleplayRoomId: ROLEPLAY_ROOMS[0]?.id || '',
    createRoomOpenByMode: {
      professional: false,
      roleplay: false,
    },
    accessNoticeByMode: {
      professional: '',
      roleplay: '',
    },
    activeCategoryByMode: {
      professional: 'all',
      roleplay: 'all',
    },
    panelCollapsedByMode: {
      professional: {
        left: nexusLayoutPrefs.professional.left,
        right: nexusLayoutPrefs.professional.right,
      },
      roleplay: {
        left: nexusLayoutPrefs.roleplay.left,
        right: nexusLayoutPrefs.roleplay.right,
      },
    },
    roomMessages: {},
  },
  arena: {
    activeTrialId: '',
    activeRoomId: '',
    roleplayRooms: ROLEPLAY_ROOMS.map((room) => ({ ...room })),
    isCreateRoomOpen: false,
    messages: [],
    pending: false,
    error: '',
    mobileLeftOpen: false,
    mobileRightOpen: false,
  },
  roleplay: {
    session: null,
    pending: false,
    error: '',
    toolsCollapsed: loadRoleplayToolsCollapsedPreference(),
    activeToolsTab: 'participants',
  },
  homeChat: {
    messages: [],
    pending: false,
    error: '',
  },
  shell: {
    leftSidebarCollapsed: arenaLayoutPrefs.leftSidebarCollapsed,
    rightSidebarCollapsed: arenaLayoutPrefs.rightSidebarCollapsed,
    isScenarioStripCollapsed: arenaLayoutPrefs.scenarioStripCollapsed,
    headerCollapsed: loadHeaderCollapsedPreference(),
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
    pending: false,
    error: '',
    toolsCollapsed: loadRoleplayToolsCollapsedPreference(),
    activeToolsTab: 'chats',
    sessions: {},
  },
};

const BACKEND_BASE_URL_CONFIG_KEY = 'wsg-backend-base-url';
const AI_ENDPOINTS = Object.freeze({
  test: '/ai/test',
  chat: '/ai/chat',
  scenario: '/ai/scenario',
});
const SCENARIO_ENDPOINTS = Object.freeze({
  complete: (scenarioId) => `/scenarios/${encodeURIComponent(scenarioId)}/complete`,
});
const ONBOARDING_NEW_USER_KEY = 'wsg-onboarding-new-user';
const STARTER_SCENARIO_SEEN_PREFIX = 'wsg-starter-seen';
const SCENARIO_PROGRESS_STORAGE_PREFIX = 'wsg-scenario-progress';
const ONBOARDING_KNOWN_RETURNING_PREFIX = 'wsg-known-returning';
const ONBOARDING_MOTIVATION_PREFIX = 'wsg-onboarding-motivation';
const ONBOARDING_PROFILE_PREFIX = 'wsg-onboarding-profile';
const PASSWORD_POLICY_MESSAGE = 'Password must be at least 12 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/;
const GOOGLE_CLIENT_ID_META_KEY = 'wsg-google-client-id';
const SHELL_LAYOUT_STORAGE_KEY = 'wsg-shell-layout';
const HEADER_COLLAPSED_STORAGE_KEY = 'ui.headerCollapsed';
const ROLEPLAY_TOOLS_COLLAPSED_STORAGE_KEY = 'ui.roleplayToolsCollapsed';
const NEXUS_LAYOUT_STORAGE_KEY = 'ui.nexusRoomLayout';
const HOME_ROUTE = '/home';
const POLICY_ACCEPT_ROUTE = '/policy/accept';
const CURRENT_POLICY_VERSION = 'v1.0';
const REQUIRED_POLICY_KEYS = Object.freeze(['codeOfConduct', 'contentPolicy', 'platformRules', 'privacyPolicy']);

let googleInitialized = false;
let headerOutsideClickHandlerBound = false;

function shouldStartRoleplayToolsCollapsed() {
  return window.matchMedia('(max-width: 900px)').matches;
}

function loadRoleplayToolsCollapsedPreference() {
  try {
    const raw = localStorage.getItem(ROLEPLAY_TOOLS_COLLAPSED_STORAGE_KEY);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
  } catch {
    // no-op: localStorage might be unavailable
  }
  return shouldStartRoleplayToolsCollapsed();
}

function loadArenaLayoutPrefs() {
  try {
    const raw = localStorage.getItem(SHELL_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return {
        leftSidebarCollapsed: false,
        rightSidebarCollapsed: false,
        scenarioStripCollapsed: false,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      leftSidebarCollapsed: Boolean(parsed.leftSidebarCollapsed),
      rightSidebarCollapsed: Boolean(parsed.rightSidebarCollapsed),
      scenarioStripCollapsed: Boolean(parsed.scenarioStripCollapsed),
    };
  } catch {
    return {
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
      scenarioStripCollapsed: false,
    };
  }
}

function loadHeaderCollapsedPreference() {
  const mobileDefault = window.matchMedia('(max-width: 800px)').matches;
  try {
    const stored = localStorage.getItem(HEADER_COLLAPSED_STORAGE_KEY);
    if (stored === null) {
      return mobileDefault;
    }
    return stored === 'true';
  } catch {
    return mobileDefault;
  }
}

function persistHeaderCollapsedPreference() {
  try {
    localStorage.setItem(HEADER_COLLAPSED_STORAGE_KEY, String(state.shell.headerCollapsed));
  } catch {
    // no-op: localStorage might be unavailable
  }
}

function persistArenaLayoutPrefs() {
  try {
    localStorage.setItem(
      SHELL_LAYOUT_STORAGE_KEY,
      JSON.stringify({
        leftSidebarCollapsed: state.shell.leftSidebarCollapsed,
        rightSidebarCollapsed: state.shell.rightSidebarCollapsed,
        scenarioStripCollapsed: state.shell.isScenarioStripCollapsed,
      })
    );
  } catch {
    // no-op: localStorage might be unavailable
  }
}

function persistRoleplayToolsCollapsedPreference() {
  try {
    localStorage.setItem(ROLEPLAY_TOOLS_COLLAPSED_STORAGE_KEY, String(state.roleplay.toolsCollapsed));
  } catch {
    // no-op: localStorage might be unavailable
  }
}

function loadNexusPanelPrefs() {
  const defaults = {
    professional: { left: false, right: false },
    roleplay: { left: false, right: false },
  };
  try {
    const raw = localStorage.getItem(NEXUS_LAYOUT_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      professional: {
        left: Boolean(parsed?.professional?.left),
        right: Boolean(parsed?.professional?.right),
      },
      roleplay: {
        left: Boolean(parsed?.roleplay?.left),
        right: Boolean(parsed?.roleplay?.right),
      },
    };
  } catch {
    return defaults;
  }
}

function persistNexusPanelPrefs() {
  try {
    localStorage.setItem(
      NEXUS_LAYOUT_STORAGE_KEY,
      JSON.stringify({
        professional: {
          left: Boolean(state.nexus.panelCollapsedByMode?.professional?.left),
          right: Boolean(state.nexus.panelCollapsedByMode?.professional?.right),
        },
        roleplay: {
          left: Boolean(state.nexus.panelCollapsedByMode?.roleplay?.left),
          right: Boolean(state.nexus.panelCollapsedByMode?.roleplay?.right),
        },
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

function getPolicyAcceptanceStorageKey(userId) {
  return `wsg-policy-acceptance:${userId || 'anonymous'}`;
}

function readLocalPolicyAcceptance(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(getPolicyAcceptanceStorageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalPolicyAcceptance(userId) {
  if (!userId) return;
  const acceptedAt = new Date().toISOString();
  const acceptance = REQUIRED_POLICY_KEYS.reduce((acc, key) => {
    acc[key] = { accepted: true, acceptedAt, policyVersion: CURRENT_POLICY_VERSION };
    return acc;
  }, {});
  localStorage.setItem(getPolicyAcceptanceStorageKey(userId), JSON.stringify(acceptance));
}

function hasAcceptedCurrentPolicies(user) {
  const policyAcceptance = user?.policyAcceptance || readLocalPolicyAcceptance(user?.id) || {};
  return REQUIRED_POLICY_KEYS.every((key) => {
    const policy = policyAcceptance?.[key];
    return Boolean(policy?.accepted && policy?.acceptedAt && policy?.policyVersion === CURRENT_POLICY_VERSION);
  });
}

function isAuthenticated() {
  return Boolean(state.auth.session && state.auth.user);
}

function requiresEmailVerification(user = state.auth.user) {
  return Boolean(user && !user.email_confirmed_at);
}

function requiresPolicyAcceptance(user) {
  if (!user) return false;
  return !hasAcceptedCurrentPolicies(user);
}

function requiresPolicyReacceptance(user) {
  return requiresPolicyAcceptance(user);
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

function getKnownReturningStorageKey(userId = state.currentUser?.id) {
  return `${ONBOARDING_KNOWN_RETURNING_PREFIX}:${userId || 'anonymous'}`;
}

function getOnboardingMotivationStorageKey(userId = state.currentUser?.id) {
  return `${ONBOARDING_MOTIVATION_PREFIX}:${userId || 'anonymous'}`;
}

function getOnboardingProfileStorageKey(userId = state.currentUser?.id) {
  return `${ONBOARDING_PROFILE_PREFIX}:${userId || 'anonymous'}`;
}

function readOnboardingProfile(userId = state.currentUser?.id) {
  try {
    const raw = localStorage.getItem(getOnboardingProfileStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function saveOnboardingProfile(profilePayload, userId = state.currentUser?.id) {
  if (!userId || !profilePayload || typeof profilePayload !== 'object') {
    return;
  }
  localStorage.setItem(getOnboardingProfileStorageKey(userId), JSON.stringify(profilePayload));
}

function withPersistedOnboardingProfile(user) {
  if (!user?.id) {
    return user;
  }
  const onboardingProfile = readOnboardingProfile(user.id);
  const mergedProfile = onboardingProfile ? { ...user, ...onboardingProfile } : user;
  const roleplayCharacters = Array.isArray(mergedProfile.roleplayCharacters) ? mergedProfile.roleplayCharacters : [];
  const roleplayCharacterLimit = Number.isFinite(Number(mergedProfile.roleplayCharacterLimit))
    ? Math.max(1, Number(mergedProfile.roleplayCharacterLimit))
    : 5;
  return {
    ...mergedProfile,
    roleplayCharacters,
    roleplayCharacterLimit,
  };
}

function readPersistedScenarioProgressForUser(userId = state.currentUser?.id) {
  try {
    const raw = localStorage.getItem(getScenarioProgressStorageKey(userId));
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return null;
  }
}

function hasCompletedOnboarding(userId = state.currentUser?.id) {
  const persisted = readPersistedScenarioProgressForUser(userId);
  if (!persisted || typeof persisted !== 'object') {
    return null;
  }
  return Boolean(persisted?.[FIRST_SCENARIO_ID]?.finalSubmitted);
}

function markKnownReturningUser(userId = state.currentUser?.id) {
  if (!userId) return;
  localStorage.setItem(getKnownReturningStorageKey(userId), 'true');
}

function isKnownReturningUser(userId = state.currentUser?.id) {
  if (!userId) return false;
  return localStorage.getItem(getKnownReturningStorageKey(userId)) === 'true';
}

function saveOnboardingMotivation(answer, userId = state.currentUser?.id) {
  const normalized = String(answer || '').trim();
  if (!userId || !normalized) {
    return;
  }
  const key = getOnboardingMotivationStorageKey(userId);
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, normalized);
  }
}

function resolvePostAuthRoute(user = state.currentUser) {
  const userId = user?.id;
  if (!userId) {
    return HOME_ROUTE;
  }

  const onboardingCompleted = hasCompletedOnboarding(userId);
  if (onboardingCompleted === true || isKnownReturningUser(userId)) {
    markKnownReturningUser(userId);
  }

  return HOME_ROUTE;
}

function sanitizeScenarioSessionForSave(scenarioId, session) {
  const scenario = findScenarioBlueprint(scenarioId);
  const scenarioConfig = getScenarioConfig(scenarioId);
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
  const finalUnlocked = Boolean(session.finalUnlocked && completedHalls.length === scenario.hallOrder.length);
  const participants = Array.isArray(session.participants) ? session.participants : [];
  const taggedParticipantIds = participants
    .filter((participant) => participant.isTaggedParticipant)
    .map((participant) => participant.id);
  const participantCap = Number.isFinite(Number(session.maxParticipants))
    ? Number(session.maxParticipants)
    : Number(scenarioConfig?.maxParticipants || 1);
  const hasCapacity = taggedParticipantIds.length < participantCap;
  const scenarioMessages = Array.isArray(session.messages) ? session.messages.slice(-80) : [];
  const objectives = Array.isArray(session.objectives) ? session.objectives : [];

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
    maxParticipants: participantCap,
    minParticipants: Number.isFinite(Number(session.minParticipants)) ? Number(session.minParticipants) : Number(scenarioConfig?.minParticipants || 1),
    allowObservers: session.allowObservers !== false,
    participants,
    taggedParticipantIds,
    observerIds: participants.filter((participant) => !participant.isTaggedParticipant).map((participant) => participant.id),
    status: session.status || 'pending',
    messages: scenarioMessages,
    objectives,
    senderId: session.senderId || taggedParticipantIds[0] || '',
    updatedAt: new Date().toISOString(),
    fullMessage: hasCapacity ? '' : 'Session full',
  };
}

function readPersistedScenarioProgress() {
  const persisted = readPersistedScenarioProgressForUser();
  return persisted && typeof persisted === 'object' ? persisted : {};
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

  state.scenarioDetail.sessions[scenarioId] = createDefaultScenarioSession(scenarioId);

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
    if (renderConfiguredBase) {
      return renderConfiguredBase.replace(/\/$/, '');
    }
    return `${protocol}//${host}`;
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
    return 'http://localhost:3000';
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
    console.warn('[api:frontend] network error', { path, method: options.method || 'GET', message });
    throw new Error('Something went wrong. Please try again.');
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
      throw new Error('We could not process your request.');
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
      throw new Error('We could not process your request.');
    }
  }

  if (!response.ok) {
    if (data?.policy_reacceptance_required === true && state.currentUser && location.hash.replace('#', '') !== POLICY_ACCEPT_ROUTE) {
      setStatusMessage('Please accept the current Guild policies to continue.', 'info');
      location.hash = POLICY_ACCEPT_ROUTE;
    }
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
    throw new Error(data?.error || 'We could not process your request.');
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
  return `<section class="card panel-surface panel-surface--transparent"><h3>${title}</h3>${body}</section>`;
}

function GlowCard({ title, body, className = '' }) {
  return `<section class="card glow-card panel-surface panel-surface--soft ${className}"><h3>${escapeHtml(title)}</h3>${body}</section>`;
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
    nexus: ['Nexus', 'Choose Professional or Roleplay experiences from one unified gateway.'],
    nexusProfessional: ['Nexus • Professional', 'Scenarios, interviewing, workplace practice, and career development.'],
    nexusRoleplay: ['Nexus • Roleplay', 'Roleplay rooms, social play, and platform reputation building.'],
    hub: ['Hub', 'Search and discover people, companies, and platform activity snapshots.'],
    arena: ['Trial Arena', 'Run starter leadership Trials and prepare for live simulation loops.'],
    guild: ['Guild World', 'Story streams, locations, and social immersion in one space.'],
    members: ['Guild Members', 'Discover member profiles and current contribution footprint.'],
    profile: ['Profile', 'Identity-focused profile details, activity snapshot, and quick connection actions.'],
    resume: ['Resume', 'Your resume workspace and publication controls.'],
    characters: ['Characters', 'Manage your roleplay and persona character roster.'],
    settings: ['Settings', 'Personal account preferences and platform controls.'],
    directChat: ['Direct Chat', 'Messaging now lives in dedicated collaboration rails outside Profile.'],
    scenarioChat: ['Scenario Chat', 'Scenario messaging for active Arena sessions.'],
    areaChat: ['Area Chat', 'Shared location-based roleplay chat stream.'],
    login: ['Log In', 'Access your guild account.'],
    signup: ['Create Account', 'Join Wyked Samurai Guild.'],
    policyAccept: ['Guild Policy Acceptance', 'Accept the Guild standards to continue into WSG.'],
    codeOfConduct: ['Code of Conduct', 'Professional and Safe for Work behavior standards for all members.'],
    contentPolicy: ['Content Policy', 'Safe for Work content requirements across all platform surfaces.'],
    platformRules: ['Platform Rules', 'Core platform integrity and job-board participation standards.'],
    privacy: ['Privacy Policy', 'How WSG currently handles account and moderation data.'],
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

function getCurrentUserRoomId() {
  return state.currentUser?.id ? `user-${state.currentUser.id}` : 'user-self';
}

function normalizeAllowedUsers(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return [...new Set(value.map((entry) => String(entry || '').trim()).filter(Boolean))];
  }
  return [...new Set(String(value).split(',').map((entry) => entry.trim()).filter(Boolean))];
}

function normalizeRoomRecord(room, fallbackRoomType) {
  const fallbackType = fallbackRoomType || 'roleplay';
  const visibility = room?.visibility === 'private' ? 'private' : 'public';
  const roomType = ['interview', 'scenario', 'roleplay'].includes(room?.roomType) ? room.roomType : fallbackType;
  const allowedUsers = normalizeAllowedUsers(room?.allowedUsers);
  const hostUserId = String(room?.hostUserId || '').trim() || 'user-self';
  return {
    ...room,
    visibility,
    roomType,
    allowedUsers,
    hostUserId,
  };
}

function canUserAccessRoom(room, currentUserId) {
  const normalizedRoom = normalizeRoomRecord(room, room?.roomKind === 'scenario' ? 'scenario' : 'roleplay');
  if (normalizedRoom.visibility !== 'private') {
    return true;
  }
  if (!currentUserId) {
    return false;
  }
  const hostUserId = String(normalizedRoom.hostUserId || '').trim();
  const allowedUsers = normalizeAllowedUsers(normalizedRoom.allowedUsers);
  if (!hostUserId || !allowedUsers.length) {
    return false;
  }
  return hostUserId === currentUserId || allowedUsers.includes(currentUserId) || allowedUsers.includes('user-self');
}

function roomVisibilityLabel(room) {
  return room?.visibility === 'private' ? 'Invite Only' : 'Public';
}

function getActiveTrial() {
  return STARTER_TRIALS.find((trial) => trial.id === state.arena.activeTrialId) || null;
}

function getRoleplayRooms() {
  const currentUserId = getCurrentUserRoomId();
  const rooms = Array.isArray(state.arena.roleplayRooms) ? state.arena.roleplayRooms : [];
  return rooms
    .map((room) => normalizeRoomRecord(room, 'roleplay'))
    .filter((room) => canUserAccessRoom(room, currentUserId));
}

function getActiveRoleplayRoom() {
  const rooms = getRoleplayRooms();
  return rooms.find((room) => room.id === state.arena.activeRoomId) || rooms[0] || null;
}

function getRoleplayParticipants() {
  const activeRoom = getActiveRoleplayRoom();
  const currentUser = state.currentUser;
  const currentUserCharacter = Array.isArray(currentUser?.roleplayCharacters) ? currentUser.roleplayCharacters[0] : null;

  const participants = [
    currentUser
      ? {
        id: `user-${currentUser.id}`,
        type: 'user',
        displayName: currentUser.displayName || currentUser.username || 'You',
        avatarUrl: currentUser.avatarUrl || '',
        subtitle: 'You • Room Member',
        profileId: currentUser.id,
        isOnline: true,
        isTaggedParticipant: true,
      }
      : null,
    currentUserCharacter
      ? {
        id: `character-${currentUserCharacter.id}`,
        type: 'character',
        displayName: currentUserCharacter.name || 'Current Character',
        subtitle: currentUserCharacter.title || currentUserCharacter.archetype || 'Character Persona',
        characterId: currentUserCharacter.id,
        isOnline: true,
        isTaggedParticipant: true,
      }
      : null,
    {
      id: `npc-warden-${activeRoom?.id || 'room'}`,
      type: 'npc',
      displayName: 'Warden Echo',
      initials: 'WE',
      subtitle: 'NPC • Scene Guide',
      isOnline: true,
      isTaggedParticipant: true,
    },
  ].filter(Boolean);

  return participants;
}

function buildParticipantListMarkup(participants, { interactive = true, routeResolver = null } = {}) {
  return (Array.isArray(participants) ? participants : []).map((participant) => {
    const participantRoute = typeof routeResolver === 'function' ? routeResolver(participant) : '';
    const isDisabled = interactive ? !participantRoute : false;
    const roleBadge = participant.isTaggedParticipant
      ? '<span class="participant-badge participant-badge--tagged">Participant</span>'
      : '<span class="participant-badge participant-badge--observer">Observer</span>';

    return `
      <button
        type="button"
        class="roleplay-participant-row ${participant.isOnline ? 'is-online' : ''} ${participant.isTaggedParticipant ? 'is-tagged-participant' : 'is-observer-participant'}"
        ${interactive ? `data-roleplay-participant-route="${escapeAttr(participantRoute)}"` : ''}
        ${isDisabled ? 'disabled title="Participant detail route unavailable."' : (interactive ? '' : 'disabled')}
      >
        <span class="roleplay-participant-avatar">
          ${participant.avatarUrl ? `<img src="${escapeAttr(participant.avatarUrl)}" alt="${escapeAttr(participant.displayName)}"/>` : `<span>${escapeHtml(participant.initials || participant.displayName.slice(0, 2).toUpperCase())}</span>`}
        </span>
        <span class="roleplay-participant-copy">
          <strong>${escapeHtml(participant.displayName)} ${roleBadge}</strong>
          <small>${escapeHtml(participant.subtitle || (participant.type === 'character' ? 'Character' : participant.type || 'Participant'))}</small>
        </span>
      </button>
    `;
  }).join('');
}

function roleplayParticipantRoute(participant) {
  if (participant.type === 'user' && participant.profileId) {
    return `/profile/${participant.profileId}`;
  }
  if (participant.type === 'character' && participant.characterId) {
    return `/characters/${participant.characterId}`;
  }
  return '';
}

function scenarioParticipantRoute(participant) {
  if (participant.type === 'user' && participant.profileId) {
    return `/profile/${participant.profileId}`;
  }
  if (participant.type === 'character' && participant.characterId) {
    return `/characters/${participant.characterId}`;
  }
  return '';
}

function getScenarioStatus(session) {
  if (!session) return 'locked';
  if (session.finalSubmitted) return 'completed';
  if (session.status === 'active' || (Array.isArray(session.taggedParticipantIds) && session.taggedParticipantIds.length > 0)) return 'active';
  if (session.status === 'locked') return 'locked';
  return 'available';
}

function scenarioStatusLabel(status) {
  const labelMap = {
    available: 'Available',
    active: 'Active',
    completed: 'Completed',
    locked: 'Locked',
  };
  return labelMap[status] || 'Available';
}

function buildWorkspaceShell({
  layoutClassName = '',
  mainClassName = '',
  sideClassName = '',
  title,
  subtitle,
  headerMeta = '',
  body,
  sideHeadTitle,
  collapseButtonId,
  collapseAriaLabel,
  collapseIcon,
  tabsMarkup,
  contentMarkup,
  isToolsCollapsed = false,
}) {
  return `
    <section class="roleplay-nexus-layout ${layoutClassName} ${isToolsCollapsed ? 'is-tools-collapsed' : ''}">
      <section class="roleplay-nexus-main panel-surface panel-surface--transparent ${mainClassName}">
        <header class="roleplay-nexus-header">
          <h2>${escapeHtml(title)}</h2>
          ${headerMeta || subtitle ? `
            <div class="roleplay-nexus-header-meta-row">
              ${subtitle ? `<p class="muted">${escapeHtml(subtitle)}</p>` : ''}
              ${headerMeta || ''}
            </div>
          ` : ''}
        </header>
        <div class="roleplay-nexus-chat-shell">
          ${body}
        </div>
      </section>
      <aside class="roleplay-nexus-side roleplay-tools-panel panel-surface panel-surface--soft ${sideClassName} ${isToolsCollapsed ? 'is-collapsed' : ''}">
        <div class="roleplay-tools-head">
          <h3>${escapeHtml(sideHeadTitle)}</h3>
          <button type="button" class="panel-toggle-btn roleplay-tools-collapse-btn" id="${escapeAttr(collapseButtonId)}" aria-label="${escapeAttr(collapseAriaLabel)}">${collapseIcon}</button>
        </div>
        <div class="roleplay-tools-tabs ${isToolsCollapsed ? 'is-collapsed' : ''}" role="tablist">
          ${tabsMarkup}
        </div>
        ${isToolsCollapsed ? '' : `<div class="roleplay-tools-content" role="tabpanel">${contentMarkup}</div>`}
      </aside>
    </section>
  `;
}

function getScenarioConfig(scenarioId) {
  const base = findScenarioBlueprint(scenarioId);
  if (!base) {
    return null;
  }
  if (scenarioId === FIRST_SCENARIO_ID) {
    return {
      scenarioId,
      title: base.title,
      minParticipants: 1,
      maxParticipants: 1,
      allowObservers: true,
    };
  }
  return {
    scenarioId,
    title: base.title,
    minParticipants: 1,
    maxParticipants: 3,
    allowObservers: true,
  };
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

function createDefaultScenarioSession(scenarioId) {
  const scenario = findScenarioBlueprint(scenarioId);
  const scenarioConfig = getScenarioConfig(scenarioId);
  const currentUser = state.currentUser;
  if (!scenario || !scenarioConfig) {
    return null;
  }
  const userParticipant = currentUser
    ? {
      id: `user-${currentUser.id}`,
      type: 'user',
      displayName: currentUser.displayName || currentUser.username || 'You',
      avatarUrl: currentUser.avatarUrl || '',
      initials: (currentUser.displayName || currentUser.username || 'You').slice(0, 2).toUpperCase(),
      subtitle: 'You',
      isTaggedParticipant: true,
      canAffectProgress: true,
      joinedAt: new Date().toISOString(),
      isOnline: true,
      profileId: currentUser.id,
    }
    : null;
  const observerParticipant = {
    id: 'observer-guest',
    type: 'user',
    displayName: 'Observer Seat',
    initials: 'OS',
    subtitle: 'Viewer • Not counted',
    isTaggedParticipant: false,
    canAffectProgress: false,
    joinedAt: new Date().toISOString(),
    isOnline: true,
  };
  const participants = [userParticipant, observerParticipant].filter(Boolean);
  const taggedParticipantIds = participants.filter((participant) => participant.isTaggedParticipant).map((participant) => participant.id);

  return {
    scenarioId,
    currentLocation: scenario.startLocation,
    answers: {},
    visitedLocations: [scenario.startLocation],
    completedHalls: [],
    finalUnlocked: false,
    finalAnswer: '',
    finalSubmitted: false,
    completionMessageVisible: false,
    status: taggedParticipantIds.length >= Number(scenarioConfig.minParticipants || 1) ? 'active' : 'pending',
    minParticipants: Number(scenarioConfig.minParticipants || 1),
    maxParticipants: Number(scenarioConfig.maxParticipants || 1),
    allowObservers: scenarioConfig.allowObservers !== false,
    participants,
    taggedParticipantIds,
    observerIds: participants.filter((participant) => !participant.isTaggedParticipant).map((participant) => participant.id),
    senderId: taggedParticipantIds[0] || '',
    messages: [
      {
        id: crypto.randomUUID(),
        type: 'system',
        role: 'ai',
        senderId: 'scenario-ai',
        senderName: 'Scenario Nexus',
        canAffectProgress: false,
        content: scenario.locations[scenario.startLocation]?.prompt || scenario.objective,
        createdAt: new Date().toISOString(),
      },
    ],
    objectives: scenario.hallOrder.map((locationId) => ({
      id: locationId,
      label: `Visit ${scenario.locations[locationId]?.name || locationId}`,
      completed: false,
    })),
    fullMessage: '',
  };
}

function ensureScenarioSession(scenarioId) {
  if (!state.scenarioDetail.sessions[scenarioId]) {
    const defaultSession = createDefaultScenarioSession(scenarioId);
    if (!defaultSession) return null;
    state.scenarioDetail.sessions[scenarioId] = restoreScenarioProgress(scenarioId) || defaultSession;
  }

  const currentSession = state.scenarioDetail.sessions[scenarioId];
  const defaultSession = createDefaultScenarioSession(scenarioId);
  if (defaultSession) {
    state.scenarioDetail.sessions[scenarioId] = {
      ...defaultSession,
      ...currentSession,
      participants: Array.isArray(currentSession?.participants) && currentSession.participants.length
        ? currentSession.participants
        : defaultSession.participants,
      taggedParticipantIds: Array.isArray(currentSession?.taggedParticipantIds) && currentSession.taggedParticipantIds.length
        ? currentSession.taggedParticipantIds
        : defaultSession.taggedParticipantIds,
      observerIds: Array.isArray(currentSession?.observerIds)
        ? currentSession.observerIds
        : defaultSession.observerIds,
      messages: Array.isArray(currentSession?.messages) && currentSession.messages.length
        ? currentSession.messages
        : defaultSession.messages,
      objectives: Array.isArray(currentSession?.objectives) && currentSession.objectives.length
        ? currentSession.objectives
        : defaultSession.objectives,
    };
  }

  return state.scenarioDetail.sessions[scenarioId];
}

function createEmptyArchetypeProfile(archetypes = ONBOARDING_ARCHETYPES) {
  return archetypes.reduce((acc, archetype) => {
    acc[archetype] = 0;
    return acc;
  }, {});
}

function applyArchetypeWeights(archetypeProfile, weights = {}, touchedArchetypes = new Set()) {
  Object.entries(weights || {}).forEach(([archetype, amount]) => {
    if (!Object.hasOwn(archetypeProfile, archetype)) {
      return;
    }
    archetypeProfile[archetype] += Number(amount) || 0;
    touchedArchetypes.add(archetype);
  });
}

function rankArchetypes(archetypeProfile, { preferredArchetypes = new Set() } = {}) {
  return Object.entries(archetypeProfile || {})
    .sort(([aName, aScore], [bName, bScore]) => {
      if (bScore !== aScore) {
        return bScore - aScore;
      }
      const aPreferred = preferredArchetypes.has(aName);
      const bPreferred = preferredArchetypes.has(bName);
      if (aPreferred !== bPreferred) {
        return aPreferred ? -1 : 1;
      }
      return aName.localeCompare(bName);
    })
    .map(([name]) => name);
}

function buildOnboardingProfileFromSession(scenario, session) {
  const scoringConfig = scenario?.scoring || {};
  const archetypes = Array.isArray(scoringConfig.archetypes) && scoringConfig.archetypes.length
    ? scoringConfig.archetypes
    : ONBOARDING_ARCHETYPES;
  const reflectionFields = scoringConfig.reflectionFields || ONBOARDING_REFLECTION_FIELDS;
  const hallRules = scoringConfig.hallRules || ONBOARDING_HALL_SCORING_RULES;
  const finalMotivationRules = scoringConfig.finalMotivationRules || ONBOARDING_FINAL_MOTIVATION_WEIGHTS;
  const reflectionProfile = {
    origins: '',
    aspiration: '',
    weight: '',
    bonds: '',
  };
  const archetypeProfile = createEmptyArchetypeProfile(archetypes);

  scenario.hallOrder.forEach((locationId) => {
    const selectedAnswer = String(session.answers?.[locationId] || '').trim();
    const reflectionKey = reflectionFields[locationId];
    if (reflectionKey) {
      reflectionProfile[reflectionKey] = selectedAnswer;
    }
    applyArchetypeWeights(archetypeProfile, hallRules[locationId]?.[selectedAnswer]);
  });

  const finalMotivation = String(session.finalAnswer || '').trim();
  const finalTouchedArchetypes = new Set();
  const finalWeights = finalMotivationRules[finalMotivation];
  if (finalWeights) {
    applyArchetypeWeights(archetypeProfile, finalWeights, finalTouchedArchetypes);
  }

  const ranked = rankArchetypes(archetypeProfile, { preferredArchetypes: finalTouchedArchetypes });
  const primaryArchetype = ranked[0] || '';
  const secondaryArchetype = ranked[1] || '';

  return {
    motivation: finalMotivation,
    reflectionProfile,
    archetypeProfile,
    primaryArchetype,
    secondaryArchetype,
    onboarding: {
      findYourWhyCompleted: true,
      findYourWhyCompletedAt: new Date().toISOString(),
    },
  };
}

function buildScenarioCompletionPayloadFromSession(scenario, session) {
  const onboardingProfile = buildOnboardingProfileFromSession(scenario, session);
  const answers = {
    hall_memory: String(session.answers?.hall_memory || '').trim(),
    hall_ambition: String(session.answers?.hall_ambition || '').trim(),
    hall_burden: String(session.answers?.hall_burden || '').trim(),
    hall_connection: String(session.answers?.hall_connection || '').trim(),
  };
  answers.origins = answers.hall_memory;
  answers.aspiration = answers.hall_ambition;
  answers.weight = answers.hall_burden;
  answers.bonds = answers.hall_connection;
  const summary = scenario.id === FIRST_SCENARIO_ID
    ? `The user completed the guild initiation rite, Forge Your Purpose. They chose ${answers.hall_memory || 'an unrecorded answer'} in the Hall of Origins, ${answers.hall_ambition || 'an unrecorded answer'} in the Hall of Aspiration, ${answers.hall_burden || 'an unrecorded answer'} in the Hall of Weight, and ${answers.hall_connection || 'an unrecorded answer'} in the Hall of Bonds. Their final motivation was: "${onboardingProfile.motivation || ''}". Their primary archetype resolved as ${onboardingProfile.primaryArchetype || 'unresolved'} and their secondary archetype resolved as ${onboardingProfile.secondaryArchetype || 'unresolved'}.`
    : `The user completed scenario "${scenario.title}" (${scenario.id}).`;

  return {
    scenarioId: scenario.id,
    title: scenario.title,
    mode: state.mode === 'roleplay' ? 'roleplay' : 'professional',
    profileSnapshot: {
      motivation: onboardingProfile.motivation,
      primaryArchetype: onboardingProfile.primaryArchetype,
      secondaryArchetype: onboardingProfile.secondaryArchetype,
      reflectionProfile: onboardingProfile.reflectionProfile,
    },
    scenarioResults: {
      visitedLocations: Array.isArray(session.visitedLocations) ? session.visitedLocations : [],
      answers,
      customFinalAnswer: onboardingProfile.motivation || null,
      completionState: session.finalSubmitted ? 'completed' : 'incomplete',
      derivedArchetypeProfile: onboardingProfile.archetypeProfile,
    },
    summary,
    memoryTags: [
      'scenario',
      'initiation',
      'motivation',
      String(onboardingProfile.primaryArchetype || '').trim(),
      String(onboardingProfile.secondaryArchetype || '').trim(),
    ].filter(Boolean),
  };
}

async function submitScenarioCompletion(scenario, session) {
  if (!scenario?.id || !state.authToken) {
    return null;
  }
  const completionPayload = buildScenarioCompletionPayloadFromSession(scenario, session);
  const result = await apiRequest(SCENARIO_ENDPOINTS.complete(scenario.id), {
    method: 'POST',
    body: JSON.stringify(completionPayload),
  });
  return result?.completion || null;
}

function formatArchetypeLabel(value) {
  return String(value || '')
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function onboardingFlavorLine(primaryArchetype, secondaryArchetype) {
  if (!primaryArchetype) {
    return '';
  }
  if (!secondaryArchetype) {
    return `Your path begins as a ${formatArchetypeLabel(primaryArchetype)}.`;
  }
  return `Your path begins as a ${formatArchetypeLabel(primaryArchetype)}, tempered by the will of a ${formatArchetypeLabel(secondaryArchetype)}.`;
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
  const connections = getSafeConnections();
  const connectionRows = connections.length
    ? connections.slice(0, 8).map((connection) => `
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
  const recentScenarioMemory = Array.isArray(state.currentUser?.scenarioHistory)
    ? state.currentUser.scenarioHistory.slice(0, 3).map((entry) => ({ scenarioId: entry.scenarioId, summary: entry.summary, memoryTags: entry.memoryTags || [] }))
    : [];
  const payload = {
    prompt: userMessage,
    genre: 'General Coaching',
    tone: state.mode === 'roleplay' ? 'Roleplay' : 'Professional',
    constraints: 'Reply with concise, practical guidance.',
    context: {
      profile: {
        motivation: String(state.currentUser?.motivation || '').trim(),
        primaryArchetype: String(state.currentUser?.primaryArchetype || '').trim(),
        secondaryArchetype: String(state.currentUser?.secondaryArchetype || '').trim(),
      },
      recentScenarioMemory,
    },
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

function ensureRoleplaySession({ resetMessages = false } = {}) {
  const previousSession = state.roleplay.session;
  if (!previousSession || previousSession.mode !== 'roleplay' || previousSession.sessionType !== 'ai_roleplay') {
    state.roleplay.session = {
      mode: 'roleplay',
      sessionType: 'ai_roleplay',
      activeRoomId: null,
      activeNpcIds: [],
      messages: [],
    };
  } else if (resetMessages) {
    state.roleplay.session.messages = [];
  }

  return state.roleplay.session;
}

async function requestRoleplayAssistantReply(userMessage, session) {
  const history = (session?.messages || [])
    .slice(-6)
    .map((message) => `${message.type === 'user' ? 'Player' : 'Narrator'}: ${message.content}`)
    .join('\n');
  const payload = {
    prompt: [
      'Roleplay mode is active.',
      'You are the narrator, scene responder, world emulator, and character interaction engine.',
      'Keep continuity with prior turns and move the scene forward with concrete sensory detail.',
      history ? `Recent exchange:\n${history}` : 'Recent exchange: (none yet)',
      `Player action: ${userMessage}`,
    ].join('\n\n'),
    genre: 'Interactive Roleplay',
    tone: 'Immersive World Narration',
    constraints: 'Stay in-world, concise, responsive, and offer clear hooks for the next action.',
    context: {
      profile: {
        motivation: String(state.currentUser?.motivation || '').trim(),
        primaryArchetype: String(state.currentUser?.primaryArchetype || '').trim(),
        secondaryArchetype: String(state.currentUser?.secondaryArchetype || '').trim(),
      },
      recentScenarioMemory: Array.isArray(state.currentUser?.scenarioHistory)
        ? state.currentUser.scenarioHistory.slice(0, 3).map((entry) => ({ scenarioId: entry.scenarioId, summary: entry.summary, memoryTags: entry.memoryTags || [] }))
        : [],
    },
  };

  const data = await apiRequest(AI_ENDPOINTS.chat, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const content = parseAiChatResponse(data);
  if (!content) {
    throw new Error('AI roleplay response did not include usable message text.');
  }

  return content;
}

function getConnectionDisplayName(connection) {
  return connection?.displayName || connection?.username || 'Guild Member';
}

function getSafeConnections() {
  if (!Array.isArray(state.network.connections)) {
    return [];
  }
  return state.network.connections.filter((connection) => connection && typeof connection === 'object');
}

function selectedConnection() {
  const connections = getSafeConnections();
  return connections.find((connection) => connection.id === state.shell.selectedConversation)
    || connections.find((connection) => connection.id === state.directChat.activeConnectionId)
    || null;
}

function ChatDock() {
  if (!state.currentUser) {
    return '';
  }
  const connections = getSafeConnections();
  const selectedConversation = state.shell.selectedConversation || state.directChat.activeConnectionId || '';
  const unreadTotal = connections.reduce((count, connection) => count + Number(connection.unreadCount || 0), 0);
  const searchedConnections = Array.isArray(state.network.results) ? state.network.results : [];
  const sourceConnections = state.network.searchTerm && searchedConnections.length ? searchedConnections : connections;
  const filteredConnections = sourceConnections
    .filter((connection) => getConnectionDisplayName(connection).toLowerCase().includes((state.network.searchTerm || '').toLowerCase()));

  const launcherMarkup = `
    <button class="chat-launcher-btn" type="button" id="chat-launcher-btn" aria-label="Open private chats">
      <span>💬 Private Chat</span>
      ${unreadTotal > 0 ? `<span class="chat-launcher-badge">${unreadTotal}</span>` : ''}
    </button>
  `;

  if (!state.shell.chatOpen) {
    return `<div class="chat-launcher-wrap">${launcherMarkup}</div>`;
  }

  const activeConnection = selectedConnection();
  const isMinimized = state.shell.chatMinimized;
  const conversationItems = filteredConnections.length
    ? filteredConnections.map((connection) => {
      const preview = connection.id === state.directChat.activeConnectionId && state.directChat.messages.length
        ? state.directChat.messages[state.directChat.messages.length - 1].content
        : 'Ready for your next briefing.';
      const unreadCount = Number(connection.unreadCount || 0);
      return `
        <li class="chat-conversation-item ${selectedConversation === connection.id ? 'is-active' : ''}" data-connection-id="${escapeAttr(connection.id)}">
          <div>
            <strong>${escapeHtml(getConnectionDisplayName(connection))}</strong>
            <p class="muted">${escapeHtml(preview.slice(0, 52))}</p>
          </div>
          ${unreadCount ? `<span class="unread-dot">${unreadCount}</span>` : ''}
        </li>
      `;
    }).join('')
    : '<li><p class="muted">No conversations yet.</p></li>';

  const messagesMarkup = (state.directChat.messages || [])
    .map((message) => `
      <article class="message ${message.senderId === state.currentUser?.id ? 'user' : 'system'}">
        <div class="message-label">${message.senderId === state.currentUser?.id ? 'You' : escapeHtml(getConnectionDisplayName(activeConnection))}</div>
        <p>${escapeHtml(message.content)}</p>
      </article>
    `).join('');

  return `
    <section class="global-chat-dock panel ${isMinimized ? 'is-minimized' : ''}">
      <header class="global-chat-head chat-popup-head">
        <strong>Guild Private Chat</strong>
        <div class="chat-window-actions">
          <button class="icon-btn" type="button" id="chat-popup-minimize-btn">${isMinimized ? '▢' : '—'}</button>
          <button class="icon-btn" type="button" id="chat-popup-close-btn">×</button>
        </div>
      </header>
      ${isMinimized ? '' : `
        <div class="chat-popup-layout">
          <aside class="chat-conversation-rail">
            <form id="global-connections-search-form" class="rail-search">
              <input id="global-connections-search-input" type="search" value="${escapeAttr(state.network.searchTerm || '')}" placeholder="Search connections" />
            </form>
            <ul class="chat-conversation-list">${conversationItems}</ul>
          </aside>
          <section class="chat-thread-panel">
            ${activeConnection ? `
              <div class="chat-thread-head rail-identity">
                ${avatarMarkup(activeConnection, 'md')}
                <div>
                  <strong>${escapeHtml(getConnectionDisplayName(activeConnection))}</strong>
                  <p class="muted">${escapeHtml(activeConnection.role || 'Guild Member')}</p>
                </div>
              </div>
              <div class="conversation-log global-chat-log">${messagesMarkup || '<p class="muted">No messages yet.</p>'}</div>
              <form id="global-chat-form" class="active-chat-form">
                <input id="global-chat-input" type="text" placeholder="Send a quick reply..." />
                <button class="pill-btn cta-primary" type="submit">Send</button>
              </form>
            ` : '<p class="muted">Select a connection to start chatting.</p>'}
          </section>
        </div>
      `}
    </section>
    <div class="chat-launcher-wrap">${launcherMarkup}</div>
  `;
}

function MainContent(key, statusMarkup, pageHtml) {
  const isArena = key === 'arena';
  const compactTopSpacing = 10;
  return `
    <main class="main-content ${isArena ? 'arena-main-shell' : ''}">
      ${statusMarkup}
      <section class="main-content-body ${isArena ? 'arena-content-body' : ''}" style="margin-top:${compactTopSpacing}px;">${pageHtml}</section>
    </main>
  `;
}

function SiteFooter() {
  return `
    <footer class="site-footer" role="contentinfo">
      <div>© 2022 Wyked Samurai Guild (WSG). All rights reserved.</div>
      <div class="footer-policy-links">
        <a href="#/code-of-conduct">Code of Conduct</a>
        <a href="#/content-policy">Content Policy</a>
        <a href="#/platform-rules">Platform Rules</a>
        <a href="#/privacy">Privacy</a>
      </div>
    </footer>
  `;
}

function Header(path) {
  const isCollapsed = state.shell.headerCollapsed;
  const accountLabel = state.currentUser ? 'Account' : 'Log in';
  const topNav = visibleNavItems().map((item) => `
    <div class="top-nav-group">
      <a href="${linkFor(item.path)}" class="top-nav-link ${isNavItemActive(path, item.path) ? 'active' : ''}">${escapeHtml(item.label)}</a>
      <div class="top-nav-dropdown">
        ${(item.items || []).map((subItem) => `<a href="${linkFor(subItem.path)}">${escapeHtml(subItem.label)}</a>`).join('')}
      </div>
    </div>
  `).join('');
  return `
    <header class="header panel ${isCollapsed ? 'is-collapsed' : ''}">
      <button type="button" class="header-collapse-btn" id="header-collapse-toggle" aria-label="${isCollapsed ? 'Expand header' : 'Collapse header'}" title="${isCollapsed ? 'Expand header' : 'Collapse header'}">${isCollapsed ? '▼' : '▲'}</button>
      <div class="header-left">
        <div class="brand">
          ${guildBrandMark({ className: 'header-brand-mark' })}
          <div class="header-brand-copy">
            <div class="title">Wyked Samurai Guild</div>
            <div class="subtitle">Strategic Guild Network • Nebula Nexus</div>
          </div>
        </div>
        <nav class="top-nav ${isCollapsed ? 'hide-when-header-collapsed' : ''}" aria-label="Primary">
          ${topNav}
        </nav>
      </div>
      <div class="header-actions">
        <div class="header-menu">
          <button type="button" class="pill-btn header-glass-btn ${isCollapsed ? 'hide-when-header-collapsed' : ''}" id="utilities-menu-btn" aria-haspopup="true" aria-expanded="false">Utilities ▾</button>
          <div class="account-menu-dropdown header-dropdown-menu" id="utilities-menu-dropdown">
            <button type="button" class="menu-item-btn" data-utility-action="notifications">Notifications</button>
            <button type="button" class="menu-item-btn" data-utility-action="invites">Invites</button>
            <button type="button" class="menu-item-btn" data-utility-action="roomUpdates">Room updates</button>
            <button type="button" class="menu-item-btn" data-utility-action="scenarioUpdates">Scenario updates</button>
          </div>
        </div>
        ${state.currentUser ? `
          <div class="account-menu">
            <button type="button" class="pill-btn header-glass-btn account-menu-btn ${isCollapsed ? 'hide-when-header-collapsed' : ''}" id="account-menu-btn" aria-haspopup="true" aria-expanded="false">${escapeHtml(accountLabel)} ▾</button>
            <div class="account-menu-dropdown header-dropdown-menu" id="account-menu-dropdown">
              <a href="${linkFor('/profile')}">Profile</a>
              <a href="${linkFor('/settings')}">Settings</a>
              <a href="${linkFor('/settings')}#account">Account</a>
              <button type="button" class="menu-item-btn" id="logout-btn">Log out</button>
            </div>
          </div>
        ` : `<a class="pill-btn header-glass-btn" href="#/login">${escapeHtml(accountLabel)}</a>`}
      </div>
    </header>
  `;
}

function AppShell(path, key, pageHtml, statusMarkup, pageSet) {
  return `
    <div class="app-shell page-set ${pageSet} ${state.shell.headerCollapsed ? 'is-header-collapsed' : ''}">
      ${Header(path)}
      ${MainContent(key, statusMarkup, pageHtml)}
      ${ChatDock()}
    </div>
  `;
}

function homePage() {
  const displayName = state.currentUser?.displayName || 'Guild Member';
  const onboardingSummary = state.currentUser?.onboarding?.findYourWhyCompleted
    ? {
      motivation: String(state.currentUser?.motivation || '').trim(),
      primary: String(state.currentUser?.primaryArchetype || '').trim(),
      secondary: String(state.currentUser?.secondaryArchetype || '').trim(),
      flavor: onboardingFlavorLine(state.currentUser?.primaryArchetype, state.currentUser?.secondaryArchetype),
    }
    : null;
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
        <a class="pill-btn cta-primary" href="${linkFor('/nexus')}">Open Nexus</a>
        <a class="pill-btn home-secondary-action" href="${linkFor('/hub')}">Explore Hub</a>
      </div>
    </section>

    <section class="home-body-grid">
      <div class="home-main-column">
        ${onboardingSummary ? `
          <section class="card home-section tier-2">
            <div class="section-heading-row home-section-heading">
              <h3>Initiation Summary</h3>
            </div>
            <ul class="support-list">
              <li><strong>Motivation</strong><p class="muted">${escapeHtml(onboardingSummary.motivation || 'Not set')}</p></li>
              <li><strong>Primary Archetype</strong><p class="muted">${escapeHtml(formatArchetypeLabel(onboardingSummary.primary) || 'Unranked')}</p></li>
              <li><strong>Secondary Archetype</strong><p class="muted">${escapeHtml(formatArchetypeLabel(onboardingSummary.secondary) || 'Unranked')}</p></li>
            </ul>
            ${onboardingSummary.flavor ? `<p class="muted" style="margin-top:10px;">${escapeHtml(onboardingSummary.flavor)}</p>` : ''}
          </section>
        ` : ''}
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
      <a class="pill-btn" href="${linkFor('/hub')}">Open Hub Recruiter Tools</a>
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
  const isRoleplayMode = state.mode === 'roleplay';
  const roleplayRooms = getRoleplayRooms();
  const activeRoleplayRoom = getActiveRoleplayRoom();
  const isScenarioStripCollapsed = state.shell.isScenarioStripCollapsed;
  const stripTitle = isRoleplayMode ? 'Roleplay Rooms' : 'Scenario Strip';
  const stripDescription = isRoleplayMode
    ? 'Enter an active room or create a new one for live guild roleplay.'
    : 'Launch, resume, or restart your guided trial flow.';
  const activeSummary = isRoleplayMode
    ? (activeRoleplayRoom ? `${activeRoleplayRoom.name} · Active` : 'No room active')
    : (hasActiveTrial ? `${activeTrial.title} · Active` : 'No scenario active');
  const activeSummaryName = isRoleplayMode
    ? (activeRoleplayRoom ? activeRoleplayRoom.name : 'None active')
    : (hasActiveTrial ? activeTrial.title : 'None active');
  const trialCards = (isRoleplayMode ? roleplayRooms : STARTER_TRIALS)
    .map((trialOrRoom) => {
      const trialId = isRoleplayMode ? trialOrRoom.trialId : trialOrRoom.id;
      const isActive = isRoleplayMode
        ? trialOrRoom.id === state.arena.activeRoomId
        : trialId === state.arena.activeTrialId;
      return `
        <article class="trial-card arena-carousel-card roleplay-room-row ${isActive ? 'active' : ''}" ${isRoleplayMode ? `data-room-id="${escapeAttr(trialOrRoom.id)}"` : ''}>
          <div class="trial-card-head">
            <h4>${isRoleplayMode ? trialOrRoom.name : trialOrRoom.title}</h4>
            ${isActive ? `<span class="trial-state-chip">${isRoleplayMode ? 'Active Room' : 'Active Trial'}</span>` : ''}
          </div>
          <p class="muted">${trialOrRoom.description}</p>
          <div class="trial-meta">
            ${isRoleplayMode
    ? `<span>${escapeHtml((trialOrRoom.visibility || 'public').toUpperCase())}</span><span>${escapeHtml((trialOrRoom.roomType || 'roleplay').toUpperCase())}</span><span>${escapeHtml(trialOrRoom.tag || 'Open RP')}</span><span>Players: ${trialOrRoom.players || 0}</span>`
    : `<span>${trialOrRoom.difficulty}</span><span>${trialOrRoom.suggestedRole || 'Open role'}</span>`}
          </div>
          <button class="pill-btn ${isRoleplayMode ? 'select-room-btn' : 'start-trial-btn'}" ${isRoleplayMode ? `data-room-id="${escapeAttr(trialOrRoom.id)}"` : `data-trial-id="${trialId}"`}>
            ${isRoleplayMode
    ? (isActive ? 'Re-enter Room' : 'Enter Room')
    : (isActive ? 'Restart Trial' : 'Start Trial')}
          </button>
          ${isActive && !isRoleplayMode ? `<button class="pill-btn start-trial-btn" data-trial-id="${trialId}" data-restart="true">Resume Trial</button>` : ''}
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

  return `
    <section class="arena-main-column">
        ${isRoleplayMode ? `
          <section class="arena-page-indicator panel-surface panel-surface--soft">
            <p class="hero-kicker">Roleplay</p>
            <h3>Room Hub</h3>
          </section>
        ` : ''}
        <section class="arena-selection-tier arena-scenario-strip panel-surface panel-surface--soft ${isScenarioStripCollapsed ? 'is-collapsed' : ''}">
          <div class="arena-selection-head">
            <div class="arena-selection-head-copy">
              <h3>${stripTitle}</h3>
              <p class="muted">${isScenarioStripCollapsed ? activeSummary : stripDescription}</p>
            </div>
            <p class="arena-strip-active-summary">Active: ${escapeHtml(activeSummaryName)}</p>
            ${isRoleplayMode ? `
              <button type="button" class="pill-btn cta-primary" id="create-room-toggle-btn">
                ${state.arena.isCreateRoomOpen ? 'Close' : 'Create Room'}
              </button>
            ` : ''}
            <button
              type="button"
              class="pill-btn arena-strip-toggle-btn"
              id="arena-strip-toggle-btn"
              aria-expanded="${isScenarioStripCollapsed ? 'false' : 'true'}"
              aria-controls="arena-scenario-carousel"
            >
              ${isScenarioStripCollapsed ? 'Expand' : 'Collapse'}
            </button>
          </div>
          <div
            class="arena-card-carousel ${isRoleplayMode ? 'roleplay-room-list' : ''} ${isScenarioStripCollapsed ? 'is-collapsed' : ''}"
            id="arena-scenario-carousel"
            ${isScenarioStripCollapsed ? 'hidden' : ''}
          >
            ${trialCards || (isRoleplayMode ? `
              <div class="arena-empty roleplay-room-empty-state">
                <h4>No active rooms yet</h4>
                <p class="muted">Create your first room to start a new roleplay scene.</p>
                <button type="button" class="pill-btn cta-primary" id="create-room-empty-btn">Create Room</button>
              </div>
            ` : '')}
          </div>
          ${isRoleplayMode && state.arena.isCreateRoomOpen ? `
            <form id="create-room-form" class="create-room-form">
              <label>Room Name<input name="roomName" maxlength="60" required placeholder="Moon Harbor Council" /></label>
              <label>Description<input name="roomDescription" maxlength="140" required placeholder="Briefly describe the room scene or objective." /></label>
              <label>Visibility
                <select name="roomVisibility">
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <label>Room Type
                <select name="roomType">
                  <option value="roleplay">Roleplay</option>
                  <option value="scenario">Scenario</option>
                </select>
              </label>
              <label>Theme / Tag (optional)<input name="roomTag" maxlength="40" placeholder="Diplomacy, Strategy, Ops..." /></label>
              <label>Invite User IDs (private only)<input name="allowedUsers" maxlength="260" placeholder="user-123, user-456" /></label>
              <button type="submit" class="pill-btn cta-primary">Create & Enter Room</button>
            </form>
          ` : ''}
        </section>
        <section class="scenario-experience-panel arena-chat-panel panel-surface panel-surface--transparent">
          <div class="scenario-panel-head arena-chat-head">
            <div>
              <p class="hero-kicker">${isRoleplayMode ? 'Room Chat' : 'Arena Chat'}</p>
              <h4>${hasActiveTrial ? (activeRoleplayRoom?.name || activeTrial.title) : `No ${isRoleplayMode ? 'room' : 'scenario'} active`}</h4>
            </div>
            <p class="muted">${state.mode === 'roleplay' ? 'Immersive roleplay lane' : 'Structured decision lane'} · ${state.arena.messages.length} messages</p>
          </div>
          <div class="arena-chat-container">
            <div class="arena-chat-body">
              ${
  hasActiveTrial
    ? `<div id="arena-conversation-log" class="conversation-log arena-chat-log">${chatMessages}</div>`
    : `<div class="arena-empty"><h4>No ${isRoleplayMode ? 'Room' : 'Trial'} active</h4><p class="muted">Select a ${isRoleplayMode ? 'room' : 'scenario card'} from the strip above to begin chatting.</p></div>`
}
            </div>
            <div class="arena-chat-input-row">
              <form id="arena-input-form" class="arena-input">
                <input id="arena-input" name="message" placeholder="${hasActiveTrial ? `Type your ${isRoleplayMode ? 'roleplay' : 'response'} message...` : `Start a ${isRoleplayMode ? 'room' : 'trial'} to enable chat`}" ${hasActiveTrial ? '' : 'disabled'} />
                <button id="arena-send-btn" class="pill-btn" type="submit" ${(hasActiveTrial && !state.arena.pending) ? '' : 'disabled'}>${state.arena.pending ? 'Sending...' : 'Send'}</button>
              </form>
            </div>
          </div>
          ${state.arena.error ? `<p class="muted" style="color:#ff7b7b;margin-top:8px;" role="alert">${escapeHtml(state.arena.error)}</p>` : ''}
        </section>
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
  const isToolsCollapsed = Boolean(state.scenarioDetail.toolsCollapsed);
  const activeToolsTab = state.scenarioDetail.activeToolsTab || 'chats';
  const participantCount = Array.isArray(session.taggedParticipantIds) ? session.taggedParticipantIds.length : 0;
  const maxParticipants = Number(session.maxParticipants || 1);
  const sessionStatus = session.status || 'pending';

  const completedCount = session.completedHalls.length;
  const totalHalls = scenario.hallOrder.length;
  const progressLabel = session.finalSubmitted ? 'Scenario complete' : `${completedCount}/${totalHalls} objectives complete`;
  const isDais = session.currentLocation === scenario.startLocation;
  const isFinalPromptVisible = isDais && session.finalUnlocked;
  const activeLocation = scenario.locations[session.currentLocation] || scenario.locations[scenario.startLocation];
  const activePrompt = isFinalPromptVisible ? scenario.finalPrompt : (activeLocation.prompt || '');
  const messageMarkup = (Array.isArray(session.messages) ? session.messages : []).map((message) => `
    <article class="message arena-chat-message ${message.role === 'observer' ? 'observer' : message.type === 'user' ? 'user' : 'system'}">
      <div class="message-label">${escapeHtml(message.senderName || (message.type === 'user' ? 'Participant' : 'Scenario Nexus'))}${message.canAffectProgress ? ' • Participant' : (message.role === 'observer' ? ' • Observer' : '')}</div>
      <p>${escapeHtml(message.content || '')}</p>
    </article>
  `).join('');
  const participantOptions = (Array.isArray(session.participants) ? session.participants : []).map((participant) => `
    <option value="${escapeAttr(participant.id)}" ${session.senderId === participant.id ? 'selected' : ''}>${escapeHtml(participant.displayName)}${participant.isTaggedParticipant ? ' (Participant)' : ' (Observer)'}</option>
  `).join('');
  const participantStatusLabel = `${participantCount} / ${maxParticipants} participants`;
  const objectives = scenario.hallOrder.map((locationId) => ({
    id: locationId,
    label: `Visit ${scenario.locations[locationId]?.name || locationId}`,
    completed: session.completedHalls.includes(locationId),
  }));
  objectives.push({
    id: 'return-dais',
    label: 'Return to the Compass Dais',
    completed: Boolean(session.finalUnlocked),
  });
  objectives.push({
    id: 'declare-purpose',
    label: 'Declare your purpose',
    completed: Boolean(session.finalSubmitted),
  });
  const objectivesMarkup = objectives.map((objective) => `
    <li class="${objective.completed ? 'is-complete' : ''}">
      <span>${objective.completed ? '✅' : '⬜'}</span>
      <span>${escapeHtml(objective.label)}</span>
    </li>
  `).join('');
  const participantsMarkup = buildParticipantListMarkup(session.participants, { interactive: true, routeResolver: scenarioParticipantRoute });
  const scenarioEntries = STARTER_TRIALS.map((trial) => {
    const trialSession = ensureScenarioSession(trial.id);
    const status = getScenarioStatus(trialSession);
    const taggedCount = Array.isArray(trialSession?.taggedParticipantIds) ? trialSession.taggedParticipantIds.length : 0;
    const participantCap = Number(trialSession?.maxParticipants || getScenarioConfig(trial.id)?.maxParticipants || 1);
    return {
      scenarioId: trial.id,
      title: trial.title,
      subtitle: trial.category || trial.difficulty || '',
      status,
      participantCount: taggedCount,
      maxParticipants: participantCap,
    };
  });
  const scenarioChatsMarkup = scenarioEntries.map((entry) => {
    const isActiveChat = entry.scenarioId === scenario.id;
    return `
      <a class="scenario-chat-entry ${isActiveChat ? 'active' : ''}" href="${linkFor(`/scenario/${entry.scenarioId}`)}">
        <span class="scenario-chat-entry-head">
          <strong>${escapeHtml(entry.title)}</strong>
          <span class="scenario-status-badge is-${escapeAttr(entry.status)}">${escapeHtml(scenarioStatusLabel(entry.status))}</span>
        </span>
        <small>${escapeHtml(entry.subtitle || 'Scenario')}</small>
        <small>${escapeHtml(`${entry.participantCount || 0}${entry.maxParticipants ? ` / ${entry.maxParticipants}` : ''} participants`)}</small>
      </a>
    `;
  }).join('');
  const stateRows = Object.entries({
    currentPhase: session.finalSubmitted ? 'completed' : (session.finalUnlocked ? 'final_vow' : 'hall_traversal'),
    currentLocation: activeLocation.name,
    taggedParticipants: participantCount,
    sessionStatus,
    completionStatus: progressLabel,
    visitedLocations: session.visitedLocations.join(', '),
    answersSaved: Object.keys(session.answers || {}).length,
    finalQuestionUnlocked: session.finalUnlocked ? 'true' : 'false',
    completionReady: session.finalUnlocked && !session.finalSubmitted ? 'true' : 'false',
  }).map(([label, value]) => `
    <li><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></li>
  `).join('');
  const locationButtons = ['compass_dais', ...scenario.hallOrder].map((locationId) => {
    const location = scenario.locations[locationId];
    const isCurrent = session.currentLocation === locationId;
    const isCompleted = session.completedHalls.includes(locationId);
    const isLockedDais = locationId === scenario.startLocation && !session.finalUnlocked && completedCount < totalHalls;
    return `
      <button
        type="button"
        class="scenario-location-btn ${isCurrent ? 'is-current' : ''} ${isCompleted ? 'is-completed' : ''}"
        data-location-id="${locationId}"
        ${isLockedDais ? 'disabled' : ''}
      >
        <span>${escapeHtml(location.name)}</span>
        <small>${isCompleted ? 'Visited' : 'Open'}</small>
      </button>
    `;
  }).join('');
  const responseOptions = isFinalPromptVisible ? scenario.finalResponses : (activeLocation.responses || []);
  const quickResponsesMarkup = responseOptions.map((choice, index) => `
    <button type="button" class="pill-btn scenario-response-btn" data-response-value="${escapeAttr(choice)}">${index + 1}. ${escapeHtml(choice)}</button>
  `).join('');

  return buildWorkspaceShell({
    layoutClassName: 'scenario-nexus-layout',
    mainClassName: 'scenario-nexus-main',
    sideClassName: 'scenario-tools-panel',
    title: scenario.title,
    subtitle: scenario.description,
    headerMeta: `
      <button type="button" class="scenario-compact-meta-btn" id="scenario-open-participants-btn">${escapeHtml(participantStatusLabel)}</button>
      <span class="scenario-status-badge is-${escapeAttr(sessionStatus)}">${escapeHtml(scenarioStatusLabel(getScenarioStatus(session)))}</span>
      <span class="muted">${escapeHtml(progressLabel)}</span>
      ${session.fullMessage ? `<span class="muted" style="color:#ffb36b;">${escapeHtml(session.fullMessage)}</span>` : ''}
    `,
    body: `
      <div id="scenario-conversation-log" class="conversation-log roleplay-chat-log scenario-chat-log">
        ${messageMarkup || '<p class="muted">Scenario awaits your first move.</p>'}
      </div>
      <form id="scenario-input-form" class="arena-input roleplay-input-form">
        <select id="scenario-sender-select" class="scenario-sender-select" ${state.scenarioDetail.pending ? 'disabled' : ''}>
          ${participantOptions}
        </select>
        <input id="scenario-input" name="message" placeholder="Respond in-scenario..." ${state.scenarioDetail.pending ? 'disabled' : ''} />
        <button class="pill-btn cta-primary" type="submit" ${state.scenarioDetail.pending ? 'disabled' : ''}>${state.scenarioDetail.pending ? 'Sending...' : 'Send'}</button>
      </form>
      <div class="scenario-response-stack">
        ${quickResponsesMarkup}
      </div>
      ${session.completionMessageVisible ? `<p class="scenario-completion-message">${escapeHtml(scenario.completionMessage)}</p>` : ''}
      ${state.scenarioDetail.error ? `<p class="muted" style="color:#ff7b7b;margin-top:8px;" role="alert">${escapeHtml(state.scenarioDetail.error)}</p>` : ''}
    `,
    sideHeadTitle: isToolsCollapsed ? 'Scenario' : 'Scenario Panel',
    collapseButtonId: 'scenario-tools-toggle',
    collapseAriaLabel: isToolsCollapsed ? 'Expand scenario panel' : 'Collapse scenario panel',
    collapseIcon: isToolsCollapsed ? '⟨' : '⟩',
    tabsMarkup: `
      <button type="button" class="roleplay-tools-tab ${activeToolsTab === 'chats' ? 'active' : ''}" data-scenario-tools-tab="chats" role="tab" aria-selected="${activeToolsTab === 'chats'}">💬<span>Chats</span></button>
      <button type="button" class="roleplay-tools-tab ${activeToolsTab === 'participants' ? 'active' : ''}" data-scenario-tools-tab="participants" role="tab" aria-selected="${activeToolsTab === 'participants'}">👥<span>Participants</span></button>
      <button type="button" class="roleplay-tools-tab ${activeToolsTab === 'objectives' ? 'active' : ''}" data-scenario-tools-tab="objectives" role="tab" aria-selected="${activeToolsTab === 'objectives'}">🎯<span>Objectives</span></button>
      <button type="button" class="roleplay-tools-tab ${activeToolsTab === 'state' ? 'active' : ''}" data-scenario-tools-tab="state" role="tab" aria-selected="${activeToolsTab === 'state'}">🧠<span>State</span></button>
    `,
    contentMarkup: `
      ${activeToolsTab === 'chats' ? `<div class="scenario-chat-list">${scenarioChatsMarkup}</div>` : ''}
      ${activeToolsTab === 'participants' ? `
        <p class="muted">${escapeHtml(participantStatusLabel)} ${participantCount >= maxParticipants ? '• Session full' : ''}</p>
        <div class="roleplay-participant-list">${participantsMarkup || '<p class="muted">No participants tagged.</p>'}</div>
      ` : ''}
      ${activeToolsTab === 'objectives' ? `<ul class="scenario-objectives-list">${objectivesMarkup}</ul>` : ''}
      ${activeToolsTab === 'state' ? `
        <ul class="scenario-state-list">${stateRows}</ul>
        <div class="scenario-location-grid">${locationButtons}</div>
        <p class="scenario-prompt muted" style="margin-top:10px;"><strong>Prompt:</strong> ${escapeHtml(activePrompt)}</p>
      ` : ''}
      <button type="button" id="scenario-reset-btn" class="pill-btn">Reset Scenario Progress</button>
    `,
    isToolsCollapsed,
  });
}


function nexusPage() {
  return `
    <section class="scenario-hero guild-hero panel-surface panel-surface--soft">
      <p class="hero-kicker">Nexus Gateway</p>
      <h3>Choose Professional or Roleplay</h3>
      <p class="hero-description">One shared gateway, two mirrored modes. Professional uses burnt orange and brass styling while Roleplay uses blue and teal.</p>
    </section>
    <div class="grid two">
      ${GlowCard({
    title: 'Professional Mode',
    body: `
          <p class="muted">AI-run scenarios, interviewing practice, and ongoing professional rooms.</p>
          <div class="actions"><a class="pill-btn cta-primary" href="${linkFor('/nexus/professional')}">Open Professional Rooms</a></div>
        `,
  })}
      ${GlowCard({
    title: 'Roleplay Mode',
    body: `
          <p class="muted">AI-moderated roleplay and social rooms for reputation and community activity.</p>
          <div class="actions"><a class="pill-btn cta-primary" href="${linkFor('/nexus/roleplay')}">Open Roleplay Rooms</a></div>
        `,
  })}
    </div>
  `;
}

function getNexusRooms(mode) {
  const currentUserId = getCurrentUserRoomId();
  const fallbackRoomType = mode === 'professional' ? 'scenario' : 'roleplay';
  const rooms = mode === 'professional'
    ? (Array.isArray(PROFESSIONAL_ROOMS) ? PROFESSIONAL_ROOMS : [])
    : (Array.isArray(state.arena.roleplayRooms) ? state.arena.roleplayRooms : []);

  const currentUserName = state.currentUser?.displayName || state.currentUser?.username || 'You';
  return rooms
    .map((room) => normalizeRoomRecord(room, fallbackRoomType))
    .filter((room) => canUserAccessRoom(room, currentUserId))
    .map((room) => ({
      ...room,
      users: Array.isArray(room.users) && room.users.length
        ? room.users.map((user) => ({ ...user, displayName: user.id === 'user-self' ? currentUserName : user.displayName }))
        : [{ id: currentUserId, displayName: currentUserName, role: 'member', isOnline: true }],
    }));
}

function getActiveNexusRoom(mode) {
  const rooms = getNexusRooms(mode);
  const activeId = mode === 'professional' ? state.nexus.activeProfessionalRoomId : state.nexus.activeRoleplayRoomId;
  return rooms.find((room) => room.id === activeId) || rooms[0] || null;
}

function roomMessageKey(mode, roomId) {
  return `${mode}:${roomId}`;
}

function getRoomMessages(mode, room) {
  if (!room) return [];
  const key = roomMessageKey(mode, room.id);
  const seeded = {
    professional: [
      { sender: room.moderator || 'Aegis Moderator', role: 'system', text: room.roomKind === 'scenario' ? 'Scenario is live. Tagged participants may answer prompts directly; observers may chat.' : 'Professional room is live with SFW safeguards enabled.' },
    ],
    roleplay: [
      { sender: room.moderator || 'Warden Echo', role: 'system', text: 'Welcome to the room. NPC moderation is active for safe-for-work roleplay chat.' },
    ],
  };
  if (!Array.isArray(state.nexus.roomMessages[key])) {
    state.nexus.roomMessages[key] = seeded[mode] || [];
  }
  return state.nexus.roomMessages[key];
}

function renderNexusModePage(mode) {
  const toneClass = mode === 'professional' ? 'nexus-mode--professional' : 'nexus-mode--roleplay';
  const modeLabel = mode === 'professional' ? 'Professional' : 'Roleplay';
  const panelState = state.nexus.panelCollapsedByMode?.[mode] || { left: false, right: false };
  const isLeftCollapsed = Boolean(panelState.left);
  const isRightCollapsed = Boolean(panelState.right);
  const rooms = getNexusRooms(mode);
  const activeRoom = getActiveNexusRoom(mode);
  const selectedCategory = state.nexus.activeCategoryByMode?.[mode] || 'all';
  const accessNotice = state.nexus.accessNoticeByMode?.[mode] || '';
  const isCreateRoomOpen = Boolean(state.nexus.createRoomOpenByMode?.[mode]);
  const categories = ['all', ...new Set(rooms.map((room) => room.category || 'General'))];
  const filteredRooms = selectedCategory === 'all' ? rooms : rooms.filter((room) => (room.category || 'General') === selectedCategory);
  const messages = getRoomMessages(mode, activeRoom);
  const userId = state.currentUser?.id ? `user-${state.currentUser.id}` : 'user-self';
  const userRecord = (activeRoom?.users || []).find((user) => user.id === userId || user.id === 'user-self');
  const userIsScenarioParticipant = activeRoom?.roomKind === 'scenario' && ((userRecord?.role || '').toLowerCase() === 'participant');

  const roomListMarkup = filteredRooms.length
    ? filteredRooms.map((room) => `
      <button type="button" class="nexus-room-row ${activeRoom?.id === room.id ? 'is-active' : ''}" data-open-nexus-room="${escapeAttr(mode)}:${escapeAttr(room.id)}">
        <strong>${escapeHtml(room.name || 'Untitled Room')}</strong>
        <small>${escapeHtml(room.roomKind === 'scenario' ? 'Scenario' : 'Chat Room')} · ${escapeHtml(room.status || 'Open')}</small>
        <small><span class="room-visibility-badge ${room.visibility === 'private' ? 'is-private' : 'is-public'}">${escapeHtml(roomVisibilityLabel(room))}</span> · ${escapeHtml((room.roomType || mode).toUpperCase())}</small>
        <small class="muted">${escapeHtml(room.description || 'No description available.')}</small>
      </button>
    `).join('')
    : '<p class="muted">No rooms are available for this filter yet.</p>';

  const participantMarkup = (activeRoom?.users || []).length
    ? activeRoom.users.map((user) => {
      const normalizedRole = String(user.role || 'member').toLowerCase();
      const badge = normalizedRole === 'participant'
        ? '<span class="participant-badge participant-badge--tagged">Participant</span>'
        : '<span class="participant-badge participant-badge--observer">Observer</span>';
      return `<li><span>${escapeHtml(user.displayName || 'Unknown')}</span>${badge}</li>`;
    }).join('')
    : '<li class="muted">No participants in this room.</li>';

  const messageMarkup = messages.length
    ? messages.map((message) => `<article class="message arena-chat-message ${message.role === 'user' ? 'user' : 'system'}"><div class="message-label">${escapeHtml(message.sender || 'System')}</div><p>${escapeHtml(message.text || '')}</p></article>`).join('')
    : '<p class="muted">No room messages yet.</p>';

  return `
    <section class="nexus-mode-layout ${toneClass} ${isLeftCollapsed ? 'is-left-collapsed' : ''} ${isRightCollapsed ? 'is-right-collapsed' : ''}">
      <aside class="nexus-room-browser panel-surface panel-surface--soft ${isLeftCollapsed ? 'is-collapsed' : ''}">
        <div class="nexus-panel-head">
          <h3 class="nexus-panel-title">${isLeftCollapsed ? 'Rooms' : `${modeLabel} Room Browser`}</h3>
          <button type="button" class="panel-toggle-btn nexus-panel-toggle-btn" data-nexus-panel-toggle="${escapeAttr(mode)}:left" aria-label="${isLeftCollapsed ? 'Expand room browser panel' : 'Collapse room browser panel'}" aria-expanded="${String(!isLeftCollapsed)}">${isLeftCollapsed ? '⟩' : '⟨'}</button>
        </div>
        <div class="nexus-panel-body">
          <p class="muted">Classic room-list scanning inspired by early chat clients.</p>
          <button type="button" class="pill-btn cta-primary" data-toggle-nexus-create-room="${escapeAttr(mode)}">${isCreateRoomOpen ? 'Close Room Builder' : 'Create Room'}</button>
          ${isCreateRoomOpen ? `
            <form class="create-room-form" data-nexus-create-room-form="${escapeAttr(mode)}">
              <label>Room Name<input name="roomName" maxlength="60" required placeholder="Candidate Debrief" /></label>
              <label>Room Type
                <select name="roomType">
                  ${mode === 'professional'
    ? '<option value="interview">Interview</option><option value="scenario">Scenario</option>'
    : '<option value="roleplay">Roleplay</option><option value="scenario">Scenario</option>'}
                </select>
              </label>
              <label>Description<input name="roomDescription" maxlength="140" placeholder="Optional room objective or scene setup." /></label>
              <label>Visibility
                <select name="roomVisibility">
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <label class="allowed-users-field">Invite User IDs (comma separated)<input name="allowedUsers" maxlength="260" placeholder="user-123, user-456" /></label>
              <button type="submit" class="pill-btn cta-primary">Create Room</button>
            </form>
          ` : ''}
          ${accessNotice ? `<p class="muted room-access-alert" role="status">${escapeHtml(accessNotice)}</p>` : ''}
          <div class="nexus-room-categories">
            ${categories.map((category) => `<button type="button" class="pill-btn ${selectedCategory === category ? 'active' : ''}" data-room-category="${escapeAttr(mode)}:${escapeAttr(category)}">${escapeHtml(category === 'all' ? 'All Categories' : category)}</button>`).join('')}
          </div>
          <div class="nexus-room-list">${roomListMarkup}</div>
        </div>
      </aside>

      <section class="nexus-chat-window panel-surface panel-surface--transparent">
        ${!activeRoom ? `<div class="status-banner status-info">You do not have access to this room.</div>` : ''}
        <header class="nexus-chat-head">
          <div>
            <p class="hero-kicker">${escapeHtml(modeLabel)} Nexus Room</p>
            <h3>${escapeHtml(activeRoom?.name || `${modeLabel} Room`)}</h3>
            <p class="muted">${escapeHtml(activeRoom?.description || 'Select a room to begin.')}</p>
          </div>
          <div class="nexus-room-meta">
            <span class="scenario-status-badge is-active">${escapeHtml(activeRoom?.roomKind === 'scenario' ? 'Scenario Room' : 'Chat Room')}</span>
            <span class="room-visibility-badge ${activeRoom?.visibility === 'private' ? 'is-private' : 'is-public'}">${escapeHtml(roomVisibilityLabel(activeRoom))}</span>
            <span class="muted">AI Moderator: ${escapeHtml(activeRoom?.moderator || 'NPC Moderator')}</span>
          </div>
        </header>
        ${activeRoom?.roomKind === 'scenario' ? `<div class="status-banner status-info">Only tagged participants can answer scenario prompts directly. Observers can still chat with everyone.</div>` : ''}
        <div class="conversation-log roleplay-chat-log">${messageMarkup}</div>
        <form class="arena-input roleplay-input-form" data-nexus-chat-form="${escapeAttr(mode)}:${escapeAttr(activeRoom?.id || '')}">
          <input name="message" placeholder="${escapeAttr(activeRoom?.roomKind === 'scenario' ? 'Speak in room chat (everyone can chat)...' : 'Send a room message...')}" ${!activeRoom ? 'disabled' : ''}/>
          <button class="pill-btn cta-primary" type="submit" ${!activeRoom ? 'disabled' : ''}>Send Chat</button>
          ${activeRoom?.roomKind === 'scenario' ? `<button class="pill-btn" type="button" id="scenario-direct-answer-btn" ${userIsScenarioParticipant ? '' : 'disabled title="Only tagged participants can answer prompts directly."'}>Answer Prompt</button>` : ''}
        </form>
      </section>

      <aside class="nexus-user-list panel-surface panel-surface--soft ${isRightCollapsed ? 'is-collapsed' : ''}">
        <div class="nexus-panel-head">
          <h3 class="nexus-panel-title">${isRightCollapsed ? 'Roster' : 'Room Roster'}</h3>
          <button type="button" class="panel-toggle-btn nexus-panel-toggle-btn" data-nexus-panel-toggle="${escapeAttr(mode)}:right" aria-label="${isRightCollapsed ? 'Expand room roster panel' : 'Collapse room roster panel'}" aria-expanded="${String(!isRightCollapsed)}">${isRightCollapsed ? '⟨' : '⟩'}</button>
        </div>
        <div class="nexus-panel-body">
          <p class="muted">NPC safety moderation is active in all rooms.</p>
          <ul class="nexus-roster-list">${participantMarkup}</ul>
          <div class="nexus-moderator-card">
            <strong>${escapeHtml(activeRoom?.moderator || 'NPC Moderator')}</strong>
            <p class="muted">${escapeHtml(activeRoom?.sfwPolicy || 'AI moderation placeholder active for SFW compliance and room safety.')}</p>
            <p class="muted">${activeRoom?.temporary ? 'Temporary scenario session: this room closes when complete.' : 'Ongoing chat room: persists for continuing conversation.'}</p>
          </div>
        </div>
      </aside>
    </section>
  `;
}

function professionalRoomsPage() {
  return renderNexusModePage('professional');
}

function roleplayRoomsPage() {
  return renderNexusModePage('roleplay');
}



function guildPage() {
  return nexusPage();
}

function roleplayHubPage() {
  return roleplayRoomsPage();
}

function hubPage() {
  const searchQuery = String(state.network.searchTerm || '').trim();
  const sourceProfiles = searchQuery ? (state.network.results || []) : (state.members || []);
  const profileSnapshots = Array.isArray(sourceProfiles) ? sourceProfiles.slice(0, 6) : [];
  const companySnapshots = [
    { id: 'moonline-industries', name: 'Moonline Industries', summary: 'Distributed logistics and autonomous operations.', score: 88, badges: ['Hiring', 'Verified'], reputation: 'High Trust', metadata: '212 openings · Hybrid' },
    { id: 'kagemori-systems', name: 'Kagemori Systems', summary: 'Security engineering and reliability consulting.', score: 91, badges: ['Top Rated', 'Enterprise'], reputation: 'Elite', metadata: '74 openings · Remote-first' },
  ];
  const recruiterSnapshots = [
    { id: 'rec-1', name: 'Ari Vale', company: 'Moonline Industries', focus: 'Ops + Product', score: 93, badges: ['Verified Recruiter', 'Fast Response'] },
    { id: 'rec-2', name: 'Niko Sato', company: 'Kagemori Systems', focus: 'Security + Infra', score: 89, badges: ['Specialist', 'Top Match'] },
  ];

  const profileCards = profileSnapshots.length
    ? profileSnapshots.map((profile) => `
      <article class="card panel-surface panel-surface--soft hub-snapshot-card">
        <p class="hero-kicker">Profile Snapshot</p>
        <h4>${escapeHtml(profile.displayName || profile.username || 'Unknown User')}</h4>
        <p class="muted">${escapeHtml(profile.role || profile.headline || 'Community member')}</p>
        <p class="muted">Badges: ${escapeHtml(Array.isArray(profile.badges) && profile.badges.length ? profile.badges.join(', ') : 'Newcomer')}</p>
        <p class="muted">Score: ${escapeHtml(String(profile.score || '—'))} · Reputation: ${escapeHtml(String(profile.reputation || 'Building'))}</p>
        <p class="muted">Metadata: ${escapeHtml(profile.location || 'Location pending')} · ${escapeHtml(profile.availability || 'Status pending')}</p>
        <a class="pill-btn" href="${linkFor(`/members/${profile.id || ''}`)}">Open profile</a>
      </article>
    `).join('')
    : '<article class="card panel-surface panel-surface--soft"><h4>No profile results</h4><p class="muted">Try a broader term. Empty states are safe by design.</p></article>';

  const companyCards = companySnapshots.map((company) => `
    <article class="card panel-surface panel-surface--soft hub-snapshot-card">
      <p class="hero-kicker">Company Snapshot</p>
      <h4>${escapeHtml(company.name)}</h4>
      <p class="muted">${escapeHtml(company.summary)}</p>
      <p class="muted">Badges: ${escapeHtml(company.badges.join(', '))}</p>
      <p class="muted">Score: ${escapeHtml(String(company.score))} · Reputation: ${escapeHtml(company.reputation)}</p>
      <p class="muted">Metadata: ${escapeHtml(company.metadata)}</p>
      <button class="pill-btn" type="button">Open company profile</button>
    </article>
  `).join('');

  const recruiterCards = recruiterSnapshots.map((recruiter) => `
    <article class="card panel-surface panel-surface--soft hub-snapshot-card">
      <p class="hero-kicker">Recruiter Tools Snapshot</p>
      <h4>${escapeHtml(recruiter.name)}</h4>
      <p class="muted">${escapeHtml(recruiter.company)} · ${escapeHtml(recruiter.focus)}</p>
      <p class="muted">Badges: ${escapeHtml(recruiter.badges.join(', '))}</p>
      <p class="muted">Recruiter Signal Score: ${escapeHtml(String(recruiter.score))}</p>
      <button class="pill-btn" type="button">Open recruiter tools</button>
    </article>
  `).join('');

  return `
    <section class="card panel-surface panel-surface--transparent">
      <p class="hero-kicker">Hub Discovery</p>
      <h3>Discover profiles, companies, and recruiters</h3>
      <p class="muted">Hub is the search and discovery area. Recruiter tools stay here as a Hub surface, not a top-level tab.</p>
      <form id="connection-search-form" class="arena-input" style="margin-top:10px;">
        <input id="connection-search-input" type="search" placeholder="Search profiles, companies, or recruiters..." value="${escapeAttr(searchQuery)}" />
        <button class="pill-btn cta-primary" type="submit">Search Hub</button>
      </form>
    </section>
    <section class="hub-result-grid" style="margin-top:12px;">
      <div><h4>Profiles</h4><div class="grid two">${profileCards}</div></div>
      <div><h4>Companies</h4><div class="grid two">${companyCards}</div></div>
      <div><h4>Recruiter Tools</h4><div class="grid two">${recruiterCards}</div></div>
    </section>
  `;
}

function resumePage() {
  return card('Resume', '<p class="muted">Resume builder and publishing tools are stubbed for now. Your place in the IA is ready.</p>');
}

function charactersPage() {
  return card('Characters', '<p class="muted">Character roster management is available in Profile today. Dedicated Characters page is stubbed for next iteration.</p>');
}

function settingsPage() {
  return card('Settings', '<p class="muted">Account and preference controls will be expanded here. Current editable settings remain in Profile.</p>');
}

function characterDetailPage(path) {
  const characterId = path.replace('/characters/', '').split('/')[0];
  const knownCharacters = Array.isArray(state.currentUser?.roleplayCharacters) ? state.currentUser.roleplayCharacters : [];
  const character = knownCharacters.find((entry) => String(entry.id) === String(characterId));
  return `
    <section class="card panel-surface panel-surface--transparent">
      <p class="hero-kicker">Character Profile</p>
      <h3>${escapeHtml(character?.name || 'Character Detail')}</h3>
      <p class="muted">${escapeHtml(character?.bio || 'This character profile page is a placeholder route for upcoming roleplay character details.')}</p>
      <p class="muted">Character ID: ${escapeHtml(characterId)}</p>
      <a class="pill-btn" href="${linkFor('/nexus/roleplay')}">Back to Roleplay Nexus</a>
    </section>
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
    return card('Profile', '<p class="muted">Please log in first.</p>');
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
  const roleplayCharacters = Array.isArray(profile.roleplayCharacters) ? profile.roleplayCharacters : [];
  const roleplayCharacterLimit = Number.isFinite(Number(profile.roleplayCharacterLimit))
    ? Math.max(1, Number(profile.roleplayCharacterLimit))
    : 5;
  const roleplaySlotsUsed = roleplayCharacters.length;
  const isRoleplayLimitReached = roleplaySlotsUsed >= roleplayCharacterLimit;
  const layerBioLabel = activeLayer === 'professional' ? 'Professional Bio' : activeLayer === 'roleplay' ? 'Roleplay Bio' : 'Short Bio';
  const layerSkillsLabel = activeLayer === 'free' ? 'Basic Tags' : 'Tags / Skills';

  return `
    <section class="feature profile-display-hero guild-identity-hero panel-surface panel-surface--transparent">
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

    <section class="card profile-tabs-card panel-surface panel-surface--soft" style="margin-top:12px;">
      <div class="tabs profile-tabs">
        <button class="active" type="button">Overview</button>
        <button type="button">Arena Contributions</button>
        <button type="button">Guild Activity</button>
        <button type="button">Connections</button>
      </div>
      <p class="muted" style="margin-top:10px;">Profile insights and contribution history panels are currently placeholder content backed by live account data above.</p>
    </section>

    <section class="card profile-edit-section panel-surface panel-surface--transparent" style="margin-top:12px;">
      <h3>Roleplay Characters</h3>
      <p class="muted">Manage your saved RP characters used in Arena roleplay sessions.</p>
      <p class="muted roleplay-slot-indicator">${roleplaySlotsUsed} / ${roleplayCharacterLimit} used</p>
      ${roleplayCharacters.length
    ? `<ul class="list roleplay-character-list">
            ${roleplayCharacters.map((character) => `
              <li>
                <span>
                  <strong>${escapeHtml(character.name || 'Unnamed Character')}</strong><br/>
                  <span class="muted">${escapeHtml(character.system || 'WSG RP System')}</span>
                </span>
                <span class="muted">${formatDateTime(character.createdAt)}</span>
              </li>
            `).join('')}
          </ul>`
    : '<p class="muted">No roleplay characters saved yet.</p>'}
      <div class="actions" style="margin-top:10px;">
        <button class="pill-btn cta-primary" id="create-roleplay-character-btn" type="button" ${isRoleplayLimitReached ? 'disabled' : ''}>Create Character</button>
      </div>
      ${isRoleplayLimitReached ? '<p class="muted roleplay-limit-message">Character limit reached. Upgrade to add more slots.</p>' : ''}
    </section>

    <section class="card profile-edit-section panel-surface panel-surface--transparent">
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

    <section class="card profile-edit-section panel-surface panel-surface--transparent" style="margin-top:12px;">
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
        <a class="pill-btn" href="#/nexus/professional">Back to Professional Workspace</a>
      </div>
    </section>
  `;
}

function directChatPage() {
  return layoutColumns({
    className: 'recruiter-layout',
    left: `<h3>Messaging Entry</h3><p class="muted">Direct messaging has moved out of Profile.</p>`,
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
      <p class="muted">Profile setup now lives directly in the Profile page.</p>
      <a href="#/profile" class="pill-btn">Open Profile</a>
    </section>
  `;
}

function loginPage() {
  const loginHasError = state.authForms.login.tone === 'error' && Boolean(state.authForms.login.message);
  const loginFeedbackMessage = loginHasError
    ? `ERROR: ${state.authForms.login.message}`
    : (state.authForms.login.message || 'Enter your account email and password to sign in.');
  return `
    <section class="auth-signin-stage" aria-label="Sign in scene">
      <section class="card form-card auth-signin-card">
      <h3>Sign In</h3>
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
      <p class="muted auth-signin-meta-links"><a href="#/privacy">Privacy</a> · <a href="#/platform-rules">Terms</a> · <a href="#/content-policy">Policy</a></p>
      </section>
    </section>
  `;
}

function signupPage() {
  const signupHasError = state.authForms.signup.tone === 'error' && Boolean(state.authForms.signup.message);
  const signupFeedbackMessage = signupHasError
    ? `ERROR: ${state.authForms.signup.message}`
    : (state.authForms.signup.message || 'Create your account with email and password.');
  return `
    <section class="card form-card auth-signin-card">
      <h3>Create Account</h3>
      <form id="signup-form" class="form-stack">
        <p id="signup-feedback" class="status-banner ${state.authForms.signup.message ? `status-${state.authForms.signup.tone}` : 'status-info'}${signupHasError ? ' auth-error-banner' : ''}" role="alert" aria-live="assertive">${escapeHtml(signupFeedbackMessage)}</p>
        <label>Email
          <input name="email" type="email" autocomplete="email" required />
        </label>
        <label>Password
          <input name="password" type="password" autocomplete="new-password" required />
        </label>
        <label>Confirm Password
          <input name="confirmPassword" type="password" autocomplete="new-password" required />
        </label>
        <button class="pill-btn cta-primary" type="submit" id="signup-submit-btn" ${state.authForms.signup.loading ? 'disabled' : ''}>${state.authForms.signup.loading ? 'Creating Account...' : 'Sign Up'}</button>
        <p class="muted" style="margin:8px 0 4px;">or</p>
        <div id="google-signup-button" aria-label="Continue with Google"></div>
      </form>
      <p class="muted">Already have an account? <a href="#/login">Sign in.</a></p>
    </section>
  `;
}

function authLoadingPage() {
  return `
    <div class="public-shell">
      <main class="public-container public-content">
        <section class="card form-card">
          <h3>Loading Authentication</h3>
          <p class="muted">Checking your session and preparing sign-in…</p>
        </section>
      </main>
    </div>
  `;
}

function configRequiredPage() {
  return `
    <div class="public-shell">
      <main class="public-container public-content">
        <section class="card form-card">
          <h3>Configuration Required</h3>
          <p class="muted">Supabase configuration is missing.</p>
          <p class="muted">Set <code>wsg-supabase-url</code> and <code>wsg-supabase-anon-key</code> in <code>web/index.html</code> (or window.WSG_SUPABASE_*), then redeploy.</p>
        </section>
      </main>
    </div>
  `;
}

function startupErrorPage(errorMessage) {
  return `
    <div class="public-shell">
      <main class="public-container public-content">
        <section class="card form-card">
          <h3>Startup Error</h3>
          <p class="muted">The app could not finish authentication/bootstrap setup.</p>
          <p class="muted" role="alert"><strong>Details:</strong> ${escapeHtml(errorMessage || 'Unknown startup error.')}</p>
          <p class="muted">Try refreshing this page. If this continues, confirm your frontend Supabase configuration and deployment settings.</p>
        </section>
      </main>
    </div>
  `;
}

function policyPageTemplate({ title, intro, lastUpdated = 'April 15, 2026', sections = [] }) {
  const sectionNav = sections
    .map((section) => ({
      heading: section.heading,
      anchor: String(section.heading || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    }))
    .filter((item) => item.heading && item.anchor);

  return `
    <section class="card form-card policy-page-card policy-layout-card">
      <header class="policy-page-header">
        <h3>${escapeHtml(title)}</h3>
        <p class="policy-last-updated"><strong>Last updated:</strong> ${escapeHtml(lastUpdated)}</p>
        <p class="muted">${escapeHtml(intro)}</p>
      </header>
      ${sectionNav.length ? `
        <nav class="policy-section-nav" aria-label="Policy sections">
          <h4>On this page</h4>
          <ul>
            ${sectionNav.map((item) => `<li><a href="#${escapeAttr(item.anchor)}">${escapeHtml(item.heading)}</a></li>`).join('')}
          </ul>
        </nav>
      ` : ''}
      ${sections.map((section) => {
    const sectionAnchor = String(section.heading || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `
          <section class="policy-copy-block" id="${escapeAttr(sectionAnchor)}">
            <h4>${escapeHtml(section.heading)}</h4>
            ${section.body ? `<p>${escapeHtml(section.body)}</p>` : ''}
            ${Array.isArray(section.points) && section.points.length ? `<ul>${section.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul>` : ''}
          </section>
        `;
  }).join('')}
    </section>
  `;
}

function codeOfConductPage() {
  return policyPageTemplate({
    title: 'Wyked Samurai Guild Code of Conduct',
    intro: 'This Code of Conduct sets behavioral expectations for a Safe for Work professional network, job board, scenario platform, and community space.',
    sections: [
      {
        heading: 'Professional Environment',
        body: 'WSG is a professional-first platform. Members, recruiters, employers, moderators, and guests are expected to communicate in a workplace-appropriate and respectful manner across all platform features.',
      },
      {
        heading: 'Respectful Conduct',
        points: [
          'Treat all members with respect, including in disagreements, feedback, and collaboration.',
          'Communicate clearly and professionally in profiles, chats, scenarios, roleplay spaces, and recruiter interactions.',
          'Do not intimidate, demean, or attempt to exclude users based on personal characteristics or professional status.',
        ],
      },
      {
        heading: 'Harassment and Hate Prohibited',
        points: [
          'Harassment, abuse, stalking, threats, hate speech, and targeted hostility are prohibited.',
          'Content or conduct that attacks protected groups is prohibited.',
          'Coordinated harassment, dogpiling, and repeated unwanted contact are prohibited.',
        ],
      },
      {
        heading: 'Fraud, Impersonation, and Deception Prohibited',
        points: [
          'Users may not impersonate another person, employer, organization, or Guild representative.',
          'Users may not submit falsified credentials, forged work history, or deceptive claims.',
          'Scam attempts, phishing attempts, or deceptive recruiting conduct are prohibited.',
        ],
      },
      {
        heading: 'Roleplay and Scenario Conduct',
        points: [
          'Roleplay and scenario participation must remain Safe for Work and within professional boundaries.',
          'Scenario systems are designed for skill-building and professional growth inside the broader platform environment.',
          'Participants must respect explicit boundaries, tags, and participation rules set for each scenario.',
        ],
      },
      {
        heading: 'Moderator Authority and Enforcement',
        points: [
          'Guild moderators may review and remove unsafe, disruptive, or fraudulent behavior and content.',
          'Enforcement may include warnings, content removal, temporary restrictions, suspension, or account removal.',
          'Repeated or severe violations may result in immediate removal from platform services.',
        ],
      },
    ],
  });
}

function contentPolicyPage() {
  return policyPageTemplate({
    title: 'Wyked Samurai Guild Content Policy',
    intro: 'WSG content standards are Safe for Work and apply across chats, profiles, usernames, avatars, roleplay, scenarios, recruiter messages, job listings, and uploaded content.',
    sections: [
      {
        heading: 'Safe for Work Requirement',
        body: 'All content on WSG must be workplace-appropriate. If content is not suitable for a professional networking and job-board context, it is not allowed on the platform.',
      },
      {
        heading: 'Prohibited Sexual Content',
        points: [
          'Sexual or erotic content, explicit sexual language, and pornographic material are prohibited.',
          'Sexual solicitation, sexualized roleplay, and non-consensual sexual content are prohibited.',
          'Any sexual content involving minors is strictly prohibited and subject to immediate enforcement action.',
        ],
      },
      {
        heading: 'Prohibited Violent or Graphic Content',
        points: [
          'Graphic gore, extreme violence, and content celebrating harm are prohibited.',
          'Threats of violence and instructions for violent wrongdoing are prohibited.',
        ],
      },
      {
        heading: 'Harassment and Hate Content',
        points: [
          'Harassing, hateful, discriminatory, or degrading content is prohibited.',
          'Usernames, profile text, avatars, and uploaded media may not contain hate symbols or abusive slurs.',
        ],
      },
      {
        heading: 'Fraud, Scam, and Illegal Content',
        points: [
          'Scam postings, fraudulent recruiter outreach, phishing attempts, and illegal content are prohibited.',
          'Users may not post fake job listings or misleading compensation and credential requirements.',
          'Users may not use WSG to facilitate unlawful activity.',
        ],
      },
      {
        heading: 'Profile, Chat, Roleplay, Scenario, and Job Listing Standards',
        points: [
          'This policy applies to profile fields, chat messages, usernames, avatars, roleplay sessions, scenario prompts, recruiter messages, and job listings.',
          'All submissions must be accurate, professional, and safe for community use.',
          'The Guild may remove or restrict content that violates these standards.',
        ],
      },
      {
        heading: 'AI Interaction Safety',
        points: [
          'Users may not use AI features to generate prohibited, unsafe, fraudulent, or abusive content.',
          'Prompts and outputs may be moderated for policy compliance and platform safety.',
        ],
      },
    ],
  });
}

function platformRulesPage() {
  return policyPageTemplate({
    title: 'Wyked Samurai Guild Platform Rules',
    intro: 'These platform rules explain how WSG operates and what is expected of users in professional, recruiter, scenario, and community workflows.',
    sections: [
      {
        heading: 'Professional Platform First',
        points: [
          'WSG is a job board and professional development platform first.',
          'Roleplay and scenario systems exist within that professional environment and must remain Safe for Work.',
        ],
      },
      {
        heading: 'Account Integrity',
        points: [
          'Users may not misrepresent identities, employers, organizations, licenses, or credentials.',
          'Each account must represent real ownership and must not be shared for deceptive activity.',
        ],
      },
      {
        heading: 'Recruiter and Employer Rules',
        points: [
          'Recruiter and employer outreach must be truthful, relevant, and non-deceptive.',
          'Job listings must not include scam patterns, false pay claims, or fabricated employer details.',
        ],
      },
      {
        heading: 'Scenario Participation Rules',
        points: [
          'Scenario activity is governed by room and participation controls defined for each session.',
          'Scenario hosts and moderators may remove disruptive behavior to keep sessions productive and safe.',
        ],
      },
      {
        heading: 'Tagged Participant Rules',
        points: [
          'Only tagged participants count toward scenario progression and completion.',
          'Observers may view or contribute only where allowed by scenario settings.',
        ],
      },
      {
        heading: 'Roleplay Boundaries',
        points: [
          'Roleplay must stay within professional, Safe for Work boundaries and cannot be used to bypass policy rules.',
          'Boundary violations, targeted harassment, or coercive behavior are prohibited.',
        ],
      },
      {
        heading: 'Community Use Rules',
        points: [
          'Use chats and community channels for constructive professional engagement.',
          'Spam, flooding, manipulation, and repeated disruption are prohibited.',
        ],
      },
      {
        heading: 'Enforcement, Suspension, and Removal',
        points: [
          'The Guild may remove unsafe, disruptive, or fraudulent content.',
          'Violations may result in warnings, restricted access, suspension, or permanent account removal.',
        ],
      },
    ],
  });
}

function privacyPage() {
  return policyPageTemplate({
    title: 'Wyked Samurai Guild Privacy Policy',
    intro: 'This policy describes the current data practices used to run WSG safely and reliably today. It may be updated as platform features evolve.',
    sections: [
      {
        heading: 'What Information We Collect',
        body: 'WSG collects information needed to provide account access, platform safety, communication features, and scenario participation features.',
      },
      {
        heading: 'Account and Profile Information',
        points: [
          'Account records may include legal name, display name, email, role, and organization details.',
          'Profile data may include bio text, skills, profile-layer fields, and account settings updates.',
        ],
      },
      {
        heading: 'Policy Acceptance Records',
        points: [
          'Policy acceptance status, timestamps, and policy version identifiers may be stored.',
          'Associated metadata such as IP and user-agent may be logged for safety and compliance operations.',
        ],
      },
      {
        heading: 'Scenario and Chat Activity',
        points: [
          'Scenario participation history, chat messages, and related context may be stored to deliver platform functions.',
          'Moderation-relevant activity may be retained to investigate abuse, fraud, or policy violations.',
        ],
      },
      {
        heading: 'Connections and Participation Data',
        points: [
          'Connection links between users and scenario participant status may be stored for collaboration features.',
          'Participation metadata can be used for progression, completion tracking, and safety review.',
        ],
      },
      {
        heading: 'How Information Is Used',
        points: [
          'To operate accounts, maintain sign-in sessions, and deliver requested platform features.',
          'To personalize professional and scenario workflows based on account settings and activity.',
        ],
      },
      {
        heading: 'Safety, Moderation, and Fraud Prevention',
        points: [
          'Activity and content may be reviewed by automated checks and moderation tools for policy enforcement.',
          'Signals from content and account behavior may be used to detect abuse, scams, or unsafe conduct.',
        ],
      },
      {
        heading: 'Third-Party Services and Hosting',
        points: [
          'WSG uses third-party infrastructure and service providers for hosting, identity integrations, and platform operations.',
          'Operational data may be processed by those providers according to their service terms and controls.',
        ],
      },
      {
        heading: 'Data Retention and Future Updates',
        points: [
          'Data retention periods may vary by feature and safety requirements.',
          'This policy may be updated as WSG evolves. Material changes will be reflected in updated policy text and timestamps.',
          'Account data, policy acceptance, scenario participation history, moderation-relevant activity, and profile information may be stored to operate the platform safely.',
        ],
      },
    ],
  });
}

function policyAcceptPage() {
  const policyForm = state.authForms.policyAccept || {
    agreed: false,
    attemptedSubmit: false,
    loading: false,
    message: '',
    tone: 'info',
  };
  const inlineError = policyForm.attemptedSubmit && !policyForm.agreed
    ? 'You must agree before continuing.'
    : '';
  const isSubmitting = Boolean(policyForm.loading);
  const hasAuthSession = Boolean(state.currentUser);
  const submitDisabled = !policyForm.agreed || isSubmitting || !hasAuthSession;
  const statusMarkup = policyForm.message
    ? `<p id="policy-accept-feedback" class="status-banner status-${policyForm.tone}" role="status" aria-live="polite">${escapeHtml(policyForm.message)}</p>`
    : '';

  if (!hasAuthSession) {
    return `
      <section class="card form-card policy-accept-card policy-accept-card--standalone">
        <h3>Guild Policy Acceptance</h3>
        <p>We’re preparing your account session. Please wait a moment and refresh this page if needed.</p>
        <p class="muted">If you were signed out, return to <a href="#/login">Log In</a> and come back to continue.</p>
      </section>
    `;
  }

  return `
    <section class="card form-card policy-accept-card policy-accept-card--standalone">
      <h3>Guild Policy Acceptance</h3>
      <p class="muted">Wyked Samurai Guild is a Safe for Work professional network, scenario platform, and job board. Access requires agreement with the Guild’s conduct, content, and platform standards.</p>
      <form id="policy-accept-form" class="form-stack" novalidate>
        ${statusMarkup}
        <section class="form-section policy-link-section">
          <h4>Review Required Policies</h4>
          <ul class="policy-link-list">
            <li><a href="#/code-of-conduct">Code of Conduct</a></li>
            <li><a href="#/content-policy">Content Policy</a></li>
            <li><a href="#/platform-rules">Platform Rules</a></li>
            <li><a href="#/privacy">Privacy Policy</a></li>
          </ul>
        </section>
        <label class="checkbox-option">
          <input type="checkbox" name="policyAgreement" value="yes" ${policyForm.agreed ? 'checked' : ''} />
          <span>I have read and agree to the Wyked Samurai Guild Code of Conduct, Content Policy, Platform Rules, and Privacy Policy.</span>
        </label>
        ${inlineError ? `<p class="status-banner status-error auth-error-banner" id="policy-accept-inline-error" role="alert">${escapeHtml(inlineError)}</p>` : ''}
        <div class="actions">
          <button class="pill-btn cta-primary" type="submit" id="policy-accept-submit-btn" ${submitDisabled ? 'disabled' : ''}>${isSubmitting ? 'Saving...' : 'Accept and Continue'}</button>
        </div>
      </form>
    </section>
  `;
}


function recruiterPage() {
  const profile = state.currentUser || {};
  const participants = (state.network.connections || []).slice(0, 4);

  return layoutColumns({
    className: 'recruiter-layout',
    left: `
      <section class="recruiter-hero recruiter-command-hero panel-surface panel-surface--soft">
        <p class="hero-kicker">Wyked Samurai Guild</p>
        <h3>Recruiter Console</h3>
        <p>Talent intelligence command center for scenario-based hiring decisions.</p>
      </section>
      <div class="candidate-card-stack">
        ${(participants.map((candidate, index) => `
          <article class="candidate-insight-card candidate-insight-spotlight panel-surface panel-surface--soft">
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
        <section class="card candidate-insight-card insight-emphasis panel-surface panel-surface--soft">
          <h4>Candidate Insights</h4>
          <p class="muted">Primary role fit: ${escapeHtml(profile.role || 'member')}</p>
          <p class="muted">Organization: ${escapeHtml(profile.organizationName || 'Independent')}</p>
          <p class="muted">Active connections: ${state.network.connections.length}</p>
        </section>
        <section class="card activity-records records-table panel-surface panel-surface--transparent">
          <h4>Recent Performance</h4>
          <ul class="list compact-list">
            ${['Trial execution consistency', 'Communication clarity trend', 'Stakeholder response quality'].map((item) => `<li><span>${item}</span><span class="muted">Logged · 7d</span></li>`).join('')}
          </ul>
        </section>
        <section class="card metric-card-grid recruiter-metric-section panel-surface panel-surface--transparent">
          <h4>Participation Analytics</h4>
          <div class="metric-grid recruiter-metric-grid">
            <article class="metric-card recruiter-metric-card"><span>Participation Depth</span><strong>84%</strong></article>
            <article class="metric-card recruiter-metric-card"><span>Team Contribution</span><strong>71%</strong></article>
            <article class="metric-card recruiter-metric-card"><span>Response Latency</span><strong>42s</strong></article>
          </div>
        </section>
        <section class="card candidate-insight-card panel-surface panel-surface--transparent">
          <h4>Scenario Intelligence</h4>
          <p class="muted">Top pressure scenarios, risk behavior patterns, and coaching prompts are prioritized for shortlist decisions.</p>
        </section>
      </div>
      <section class="card network-feature-panel panel-surface panel-surface--transparent">
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
    const isSignupRoute = location.hash === '#/signup';
    const signupAgreementChecked = isSignupRoute
      ? Boolean(document.querySelector('#signup-form input[name="policyAgreement"]')?.checked)
      : false;
    const result = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        idToken: credential,
        policyAgreement: isSignupRoute ? signupAgreementChecked : undefined,
      }),
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

function initializeGoogleAuth(routeKey) {
  const googleClientId = resolveGoogleClientId();
  if (!googleClientId) {
    return;
  }

  const google = window.google;
  if (!google?.accounts?.id) {
    return;
  }

  if (!googleInitialized) {
    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => {
        const activeFormName = location.hash === '#/signup' ? 'signup' : 'login';
        handleGoogleCredentialResponse(response, activeFormName);
      },
    });
    googleInitialized = true;
  }

  if (routeKey === 'login') {
    renderGoogleButton('google-login-button');
    return;
  }
  if (routeKey === 'signup') {
    renderGoogleButton('google-signup-button');
  }
}

async function finalizeSignInResult(result, formName) {
  const session = result?.session || null;
  const user = result?.user || session?.user || null;
  state.auth.session = session;
  state.auth.user = user;
  state.auth.loading = false;
  state.authToken = session?.access_token || '';
  const appUser = withPersistedOnboardingProfile(toAppUser(user));
  state.currentUser = appUser
    ? { ...appUser, policyAcceptance: readLocalPolicyAcceptance(appUser.id) || appUser.policyAcceptance || {} }
    : null;
  state.membersLoaded = false;

  if (requiresEmailVerification(user)) {
    const message = 'Please verify your email before full app access.';
    setFormMessage(formName, message, 'info');
    setStatusMessage(message, 'info');
    setTimeout(() => {
      location.hash = '/login';
    }, 200);
    return;
  }

  setFormMessage(formName, 'Login successful.', 'success');
  setStatusMessage('Login successful.', 'success');

  const postAuthRoute = requiresPolicyReacceptance(state.currentUser)
    ? POLICY_ACCEPT_ROUTE
    : resolvePostAuthRoute(state.currentUser);
  setTimeout(() => {
    location.hash = postAuthRoute;
  }, 200);
}

function syncAuthStateFromSupabase(session) {
  const user = session?.user || null;
  state.auth.session = session || null;
  state.auth.user = user;
  state.authToken = session?.access_token || '';
  const appUser = withPersistedOnboardingProfile(toAppUser(user));
  state.currentUser = appUser
    ? { ...appUser, policyAcceptance: readLocalPolicyAcceptance(appUser.id) || appUser.policyAcceptance || {} }
    : null;
  state.auth.loading = false;
}

function clearClientSecurityState() {
  const prefixesToClear = [
    ONBOARDING_PROFILE_PREFIX,
    ONBOARDING_MOTIVATION_PREFIX,
    ONBOARDING_KNOWN_RETURNING_PREFIX,
    SCENARIO_PROGRESS_STORAGE_PREFIX,
    STARTER_SCENARIO_SEEN_PREFIX,
  ];

  const userId = state.currentUser?.id;
  for (const prefix of prefixesToClear) {
    const userScopedKey = userId ? `${prefix}:${userId}` : null;
    if (userScopedKey) {
      localStorage.removeItem(userScopedKey);
    }
  }
}

function clearAuthSession() {
  state.authToken = '';
  state.currentUser = null;
  state.auth.user = null;
  state.auth.session = null;
  state.auth.loading = false;
  state.scenarioDetail.sessions = {};
  state.layers = {};
  state.availableLayers = ['free'];
  state.lockedLayers = ['professional', 'roleplay'];
  state.activeLayer = 'free';
  sessionStorage.removeItem(ONBOARDING_NEW_USER_KEY);
  clearClientSecurityState();
}

async function bootstrapAuth() {
  state.auth.loading = true;
  state.startupError = '';
  state.supabaseConfigMissing = !supabaseConfig.ready;

  if (state.supabaseConfigMissing) {
    state.supabaseConfigMissing = true;
    clearAuthSession();
    return;
  }

  if (!supabase) {
    state.startupError = supabaseConfig.initError || 'Supabase client failed to initialize.';
    clearAuthSession();
    return;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[auth:frontend] Supabase session bootstrap failed', error.message);
    }
    syncAuthStateFromSupabase(data?.session || null);

    supabase.auth.onAuthStateChange((_event, session) => {
      syncAuthStateFromSupabase(session || null);
      render();
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('[auth:frontend] Supabase bootstrap threw unexpectedly', errorMessage);
    state.startupError = errorMessage || 'Supabase bootstrap failed.';
    clearAuthSession();
  }
}

async function signupWithSupabase({ email, password, metadata }) {
  if (!supabase) throw new Error('Supabase configuration is missing. Check frontend environment variables and redeploy.');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  return data;
}

async function loginWithSupabase({ email, password }) {
  if (!supabase) throw new Error('Supabase configuration is missing. Check frontend environment variables and redeploy.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function logoutWithSupabase() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
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
  try {
    const data = await apiRequest('/connections');
    if (Array.isArray(data)) {
      state.network.connections = data;
      return;
    }
    if (Array.isArray(data?.items)) {
      state.network.connections = data.items;
      return;
    }
    if (Array.isArray(data?.connections)) {
      state.network.connections = data.connections;
      return;
    }
    state.network.connections = [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[connections:frontend] loadConnections failed; using empty list fallback.', { message });
    state.network.connections = [];
  }
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
    state.currentUser = withPersistedOnboardingProfile(normalized.user);
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

  const match = path.match(/^\/(?:members|profile)\/([a-fA-F0-9-]+)$/);
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
  const aliasRoutes = {
    '/app': '/home',
    '/arena': '/nexus/professional',
    '/guild': '/nexus',
    '/world': '/nexus/roleplay',
    '/guild-world': '/nexus/roleplay',
    '/roleplay': '/nexus/roleplay',
    '/members': '/hub',
    '/recruiter-console': '/hub',
    '/discussions': '/nexus/professional',
    '/profile/scenario-chat': '/nexus/professional',
    '/profile/area-chat': '/nexus/roleplay',
  };
  if (aliasRoutes[path]) {
    return aliasRoutes[path];
  }

  const isScenarioRoute = path === '/scenario' || path.startsWith('/scenario/');
  const isMemberProfileRoute = /^\/members\/[^/]+$/.test(path);
  const isUserProfileRoute = /^\/profile\/[^/]+$/.test(path);
  const isCharacterRoute = /^\/characters\/[^/]+$/.test(path);
  const known = routes[path]
    || (isMemberProfileRoute || isUserProfileRoute ? { key: 'profile', requiresAuth: true } : null)
    || (isCharacterRoute ? { key: 'characterDetail', requiresAuth: true } : null)
    || (isScenarioRoute ? { key: 'scenarioDetail', requiresAuth: true } : null);
  if (!known) {
    return path;
  }

  if (state.auth.loading) {
    return path;
  }

  if (known.requiresAuth && !isAuthenticated() && path !== POLICY_ACCEPT_ROUTE) {
    return '/login';
  }

  if (!isAuthenticated() && path === '/') {
    return '/login';
  }

  if (isAuthenticated() && requiresEmailVerification(state.auth.user) && !known.guestOnly) {
    return '/login';
  }

  if (isAuthenticated() && requiresPolicyAcceptance(state.currentUser) && !known.bypassPolicyGuard) {
    return POLICY_ACCEPT_ROUTE;
  }

  if (known.guestOnly && isAuthenticated()) {
    return resolvePostAuthRoute(state.currentUser);
  }

  if (path === '/' && isAuthenticated()) {
    return resolvePostAuthRoute(state.currentUser);
  }

  return path;
}

function appendScenarioMessage(session, message) {
  session.messages = Array.isArray(session.messages) ? session.messages : [];
  session.messages.push({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...message,
  });
  session.messages = session.messages.slice(-120);
}

function updateScenarioObjectivesFromSession(scenario, session) {
  session.objectives = [
    ...scenario.hallOrder.map((locationId) => ({
      id: locationId,
      label: `Visit ${scenario.locations[locationId]?.name || locationId}`,
      completed: session.completedHalls.includes(locationId),
    })),
    {
      id: 'return-dais',
      label: 'Return to the Compass Dais',
      completed: Boolean(session.finalUnlocked),
    },
    {
      id: 'declare-purpose',
      label: 'Declare your purpose',
      completed: Boolean(session.finalSubmitted),
    },
  ];
}

async function processScenarioParticipantInput(scenario, session, text, senderId) {
  const normalized = String(text || '').trim();
  if (!normalized) return;
  const lower = normalized.toLowerCase();
  const locationEntries = Object.values(scenario.locations || {});
  const matchedLocation = locationEntries.find((location) => lower.includes(String(location.name || '').toLowerCase()));
  if (matchedLocation && scenario.locations[matchedLocation.id]) {
    if (!session.visitedLocations.includes(matchedLocation.id)) {
      session.visitedLocations.push(matchedLocation.id);
    }
    session.currentLocation = matchedLocation.id;
    appendScenarioMessage(session, {
      type: 'system',
      role: 'ai',
      senderId: 'scenario-ai',
      senderName: 'Scenario Nexus',
      canAffectProgress: false,
      content: scenario.locations[matchedLocation.id]?.prompt || 'Location updated.',
    });
    return;
  }

  const isFinalPromptVisible = session.currentLocation === scenario.startLocation && session.finalUnlocked;
  const options = isFinalPromptVisible
    ? (scenario.finalResponses || [])
    : (scenario.locations[session.currentLocation]?.responses || []);
  const matchedOption = options.find((option) => String(option).toLowerCase() === lower);
  if (matchedOption) {
    if (isFinalPromptVisible) {
      session.finalAnswer = matchedOption;
      session.finalSubmitted = true;
      session.completionMessageVisible = true;
      session.status = 'completed';
    } else if (scenario.hallOrder.includes(session.currentLocation)) {
      session.answers[session.currentLocation] = matchedOption;
      if (!session.completedHalls.includes(session.currentLocation)) {
        session.completedHalls.push(session.currentLocation);
      }
      if (scenario.hallOrder.every((hallId) => session.completedHalls.includes(hallId))) {
        session.finalUnlocked = true;
      }
    }
    updateScenarioObjectivesFromSession(scenario, session);
    appendScenarioMessage(session, {
      type: 'system',
      role: 'ai',
      senderId: 'scenario-ai',
      senderName: 'Scenario Nexus',
      canAffectProgress: false,
      content: isFinalPromptVisible
        ? (scenario.completionMessage || 'Scenario complete.')
        : `Recorded. ${scenario.locations[session.currentLocation]?.prompt || 'Continue when ready.'}`,
    });
  }

  if (session.finalSubmitted && scenario.id === FIRST_SCENARIO_ID) {
    saveOnboardingMotivation(session.finalAnswer);
    const onboardingProfile = buildOnboardingProfileFromSession(scenario, session);
    saveOnboardingProfile(onboardingProfile);
    state.currentUser = {
      ...(state.currentUser || {}),
      ...onboardingProfile,
    };
    try {
      const completion = await submitScenarioCompletion(scenario, session);
      if (completion && state.currentUser) {
        const existing = Array.isArray(state.currentUser.scenarioHistory) ? state.currentUser.scenarioHistory : [];
        state.currentUser = {
          ...state.currentUser,
          scenarioHistory: [completion, ...existing.filter((entry) => entry.scenarioId !== completion.scenarioId)].slice(0, 10),
        };
      }
    } catch (error) {
      console.warn('[scenario] completion handoff failed', {
        scenarioId: scenario.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    markKnownReturningUser();
  }
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

  const chatLog = document.getElementById('scenario-conversation-log');
  if (chatLog) {
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  const toolsToggle = document.getElementById('scenario-tools-toggle');
  if (toolsToggle) {
    toolsToggle.onclick = () => {
      state.scenarioDetail.toolsCollapsed = !state.scenarioDetail.toolsCollapsed;
      render();
    };
  }
  document.querySelectorAll('[data-scenario-tools-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.getAttribute('data-scenario-tools-tab');
      if (!tab) return;
      state.scenarioDetail.activeToolsTab = tab;
      if (state.scenarioDetail.toolsCollapsed) {
        state.scenarioDetail.toolsCollapsed = false;
      }
      render();
    });
  });

  const openParticipantsButton = document.getElementById('scenario-open-participants-btn');
  if (openParticipantsButton) {
    openParticipantsButton.onclick = () => {
      state.scenarioDetail.activeToolsTab = 'participants';
      if (state.scenarioDetail.toolsCollapsed) {
        state.scenarioDetail.toolsCollapsed = false;
      }
      render();
    };
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
      appendScenarioMessage(session, {
        type: 'system',
        role: 'ai',
        senderId: 'scenario-ai',
        senderName: 'Scenario Nexus',
        canAffectProgress: false,
        content: scenario.locations[locationId]?.prompt || 'Location updated.',
      });
      if (locationId === scenario.startLocation && scenario.hallOrder.every((hallId) => session.completedHalls.includes(hallId))) {
        session.finalUnlocked = true;
      }
      updateScenarioObjectivesFromSession(scenario, session);
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
      const taggedSenderId = session.taggedParticipantIds?.[0];
      if (!taggedSenderId) return;
      appendScenarioMessage(session, {
        type: 'user',
        role: 'participant',
        senderId: taggedSenderId,
        senderName: session.participants.find((participant) => participant.id === taggedSenderId)?.displayName || 'Participant',
        canAffectProgress: true,
        content: selectedResponse,
      });
      processScenarioParticipantInput(scenario, session, selectedResponse, taggedSenderId);
      persistScenarioProgress(scenarioId);
      render();
    };
  });
  const scenarioForm = document.getElementById('scenario-input-form');
  if (scenarioForm) {
    scenarioForm.onsubmit = async (event) => {
      event.preventDefault();
      const input = document.getElementById('scenario-input');
      const senderSelect = document.getElementById('scenario-sender-select');
      const value = String(input?.value || '').trim();
      const senderId = String(senderSelect?.value || session.senderId || '');
      if (!value || !senderId || state.scenarioDetail.pending) {
        return;
      }
      session.senderId = senderId;
      const sender = session.participants.find((participant) => participant.id === senderId);
      const isTagged = Boolean(sender?.isTaggedParticipant && session.taggedParticipantIds.includes(senderId));
      if (!isTagged && !session.allowObservers) {
        state.scenarioDetail.error = 'Only tagged participants can message in this scenario.';
        render();
        return;
      }
      state.scenarioDetail.error = '';
      appendScenarioMessage(session, {
        type: 'user',
        role: isTagged ? 'participant' : 'observer',
        senderId,
        senderName: sender?.displayName || 'Unknown',
        canAffectProgress: isTagged,
        content: value,
      });
      if (input) input.value = '';
      state.scenarioDetail.pending = true;
      render();

      if (isTagged) {
        await processScenarioParticipantInput(scenario, session, value, senderId);
      } else {
        appendScenarioMessage(session, {
          type: 'system',
          role: 'ai',
          senderId: 'scenario-ai',
          senderName: 'Scenario Nexus',
          canAffectProgress: false,
          content: 'Observer message recorded. Scenario progress remains unchanged.',
        });
      }

      state.scenarioDetail.pending = false;
      persistScenarioProgress(scenarioId);
      if (scenarioId === FIRST_SCENARIO_ID && session.finalSubmitted) {
        setStatusMessage('Initiation complete. Welcome to Home.', 'success');
      }
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

  document.querySelectorAll('[data-roleplay-participant-route]').forEach((button) => {
    button.addEventListener('click', () => {
      const route = button.getAttribute('data-roleplay-participant-route');
      if (!route) return;
      location.hash = route;
    });
  });
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
      location.hash = resolvePostAuthRoute(state.currentUser);
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
  const createRoleplayCharacterButton = document.getElementById('create-roleplay-character-btn');
  if (createRoleplayCharacterButton) {
    createRoleplayCharacterButton.onclick = () => {
      const currentCharacters = Array.isArray(state.currentUser?.roleplayCharacters) ? state.currentUser.roleplayCharacters : [];
      const characterLimit = Number.isFinite(Number(state.currentUser?.roleplayCharacterLimit))
        ? Math.max(1, Number(state.currentUser.roleplayCharacterLimit))
        : 5;
      if (currentCharacters.length >= characterLimit) {
        render();
        return;
      }
      const nextCharacterNumber = currentCharacters.length + 1;
      const newCharacter = {
        id: crypto.randomUUID(),
        name: `Ronin Character ${nextCharacterNumber}`,
        system: 'WSG RP System',
        createdAt: new Date().toISOString(),
      };
      state.currentUser = {
        ...state.currentUser,
        roleplayCharacterLimit: characterLimit,
        roleplayCharacters: [...currentCharacters, newCharacter],
      };
      saveOnboardingProfile({
        ...(readOnboardingProfile(state.currentUser.id) || {}),
        roleplayCharacters: state.currentUser.roleplayCharacters,
        roleplayCharacterLimit: state.currentUser.roleplayCharacterLimit,
      }, state.currentUser.id);
      setStatusMessage('Roleplay character created.', 'success');
      render();
    };
  }

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
        state.currentUser = withPersistedOnboardingProfile(normalized.user);
        state.activeProfile = state.currentUser;
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
        state.currentUser = withPersistedOnboardingProfile(normalized.user);
        state.activeProfile = state.currentUser;
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
  function enterRoleplayRoom(roomId) {
    const currentUserId = getCurrentUserRoomId();
    const selectedRoom = (Array.isArray(state.arena.roleplayRooms) ? state.arena.roleplayRooms : [])
      .map((room) => normalizeRoomRecord(room, 'roleplay'))
      .find((room) => room.id === roomId);
    if (!selectedRoom) {
      return;
    }
    if (!canUserAccessRoom(selectedRoom, currentUserId)) {
      state.arena.error = 'You do not have access to this room.';
      render();
      return;
    }
    const selectedTrial = STARTER_TRIALS.find((trial) => trial.id === selectedRoom.trialId) || STARTER_TRIALS[0];
    if (!selectedTrial) {
      return;
    }
    state.arena.activeRoomId = selectedRoom.id;
    state.arena.activeTrialId = selectedTrial.id;
    state.arena.messages = [{ id: crypto.randomUUID(), type: 'system', content: selectedTrial.openingPrompt }];
    render();
  }

  const stripToggleButton = document.getElementById('arena-strip-toggle-btn');
  if (stripToggleButton) {
    stripToggleButton.onclick = () => {
      state.shell.isScenarioStripCollapsed = !state.shell.isScenarioStripCollapsed;
      persistArenaLayoutPrefs();
      render();
    };
  }

  const startButtons = document.querySelectorAll('.start-trial-btn');
  startButtons.forEach((button) => {
    button.onclick = () => {
      const trialId = button.getAttribute('data-trial-id');
      const selectedTrial = STARTER_TRIALS.find((trial) => trial.id === trialId);
      if (!selectedTrial) {
        return;
      }

      state.arena.activeTrialId = selectedTrial.id;
      state.arena.activeRoomId = '';
      state.arena.messages = [{ id: crypto.randomUUID(), type: 'system', content: selectedTrial.openingPrompt }];
      render();
    };
  });

  const roleplayRows = document.querySelectorAll('.roleplay-room-row[data-room-id]');
  roleplayRows.forEach((row) => {
    row.onclick = (event) => {
      const clickedButton = event.target?.closest?.('button');
      if (clickedButton) {
        return;
      }
      const roomId = row.getAttribute('data-room-id');
      if (roomId) {
        enterRoleplayRoom(roomId);
      }
    };
  });

  const selectRoomButtons = document.querySelectorAll('.select-room-btn[data-room-id]');
  selectRoomButtons.forEach((button) => {
    button.onclick = () => {
      const roomId = button.getAttribute('data-room-id');
      if (roomId) {
        enterRoleplayRoom(roomId);
      }
    };
  });

  const createRoomToggleButton = document.getElementById('create-room-toggle-btn');
  if (createRoomToggleButton) {
    createRoomToggleButton.onclick = () => {
      state.arena.isCreateRoomOpen = !state.arena.isCreateRoomOpen;
      render();
    };
  }

  const createRoomEmptyButton = document.getElementById('create-room-empty-btn');
  if (createRoomEmptyButton) {
    createRoomEmptyButton.onclick = () => {
      state.arena.isCreateRoomOpen = true;
      render();
    };
  }

  const createRoomForm = document.getElementById('create-room-form');
  if (createRoomForm) {
    createRoomForm.onsubmit = (event) => {
      event.preventDefault();
      const formData = new FormData(createRoomForm);
      const roomName = String(formData.get('roomName') || '').trim();
      const roomDescription = String(formData.get('roomDescription') || '').trim();
      const roomVisibility = String(formData.get('roomVisibility') || 'public').trim() || 'public';
      const roomType = String(formData.get('roomType') || 'roleplay').trim() || 'roleplay';
      const roomTag = String(formData.get('roomTag') || '').trim();
      const allowedUsers = normalizeAllowedUsers(formData.get('allowedUsers'));
      if (!roomName || !roomDescription) {
        return;
      }
      const fallbackTrial = STARTER_TRIALS[0];
      const currentUserId = getCurrentUserRoomId();
      const isPrivate = roomVisibility === 'private';
      const newRoom = {
        id: `custom-${slugifyScenario(roomName)}-${Date.now()}`,
        trialId: fallbackTrial?.id || '',
        name: roomName,
        description: roomDescription,
        tag: roomTag || 'Custom RP',
        visibility: isPrivate ? 'private' : 'public',
        roomType: roomType === 'scenario' ? 'scenario' : 'roleplay',
        roomKind: roomType === 'scenario' ? 'scenario' : 'chat',
        status: 'Open',
        hostUserId: currentUserId,
        allowedUsers: isPrivate ? [...new Set([currentUserId, ...allowedUsers])] : [],
        players: 1,
      };
      state.arena.roleplayRooms = [newRoom, ...(Array.isArray(state.arena.roleplayRooms) ? state.arena.roleplayRooms : [])];
      state.arena.isCreateRoomOpen = false;
      enterRoleplayRoom(newRoom.id);
    };
  }

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
  const chatLauncherButton = document.getElementById('chat-launcher-btn');
  if (chatLauncherButton) {
    chatLauncherButton.onclick = async () => {
      state.shell.chatOpen = true;
      state.shell.chatMinimized = false;
      if (!state.directChat.activeConnectionId && state.network.connections.length) {
        await loadDirectChat(state.network.connections[0].id);
      }
      render();
    };
  }

  const searchForm = document.getElementById('global-connections-search-form');
  if (searchForm) {
    searchForm.onsubmit = async (event) => {
      event.preventDefault();
      const searchInput = document.getElementById('global-connections-search-input');
      const query = String(searchInput?.value || '').trim();
      state.network.searchTerm = query;
      await searchConnectionCandidates(query);
      render();
    };
  }

  const openDirectChat = async (connectionId) => {
    if (!connectionId || state.directChat.pending) {
      return;
    }
    await loadDirectChat(connectionId);
    render();
  };

  document.querySelectorAll('.open-direct-chat-btn, .open-global-chat-btn, .chat-conversation-item').forEach((button) => {
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

  const toggleChatPaneButton = document.getElementById('chat-popup-minimize-btn');
  if (toggleChatPaneButton) {
    toggleChatPaneButton.onclick = () => {
      state.shell.chatMinimized = !state.shell.chatMinimized;
      render();
    };
  }

  const closeChatPaneButton = document.getElementById('chat-popup-close-btn');
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
  const collapseToggleButton = document.getElementById('header-collapse-toggle');
  if (collapseToggleButton) {
    collapseToggleButton.onclick = () => {
      state.shell.headerCollapsed = !state.shell.headerCollapsed;
      persistHeaderCollapsedPreference();
      render();
    };
  }

  const utilitiesMenuButton = document.getElementById('utilities-menu-btn');
  const utilitiesMenuDropdown = document.getElementById('utilities-menu-dropdown');
  if (utilitiesMenuButton && utilitiesMenuDropdown) {
    utilitiesMenuButton.onclick = (event) => {
      event.stopPropagation();
      const isOpen = utilitiesMenuDropdown.classList.toggle('is-open');
      utilitiesMenuButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      const accountDropdown = document.getElementById('account-menu-dropdown');
      const accountButton = document.getElementById('account-menu-btn');
      if (accountDropdown) {
        accountDropdown.classList.remove('is-open');
      }
      if (accountButton) {
        accountButton.setAttribute('aria-expanded', 'false');
      }
    };
  }

  const accountMenuButton = document.getElementById('account-menu-btn');
  const accountMenuDropdown = document.getElementById('account-menu-dropdown');
  if (accountMenuButton && accountMenuDropdown) {
    accountMenuButton.onclick = (event) => {
      event.stopPropagation();
      const isOpen = accountMenuDropdown.classList.toggle('is-open');
      accountMenuButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (utilitiesMenuDropdown) {
        utilitiesMenuDropdown.classList.remove('is-open');
      }
      if (utilitiesMenuButton) {
        utilitiesMenuButton.setAttribute('aria-expanded', 'false');
      }
    };
  }

  document.querySelectorAll('[data-utility-action]').forEach((button) => {
    button.onclick = () => {
      const action = String(button.dataset.utilityAction || '').trim();
      const actionMap = {
        notifications: 'Notifications',
        invites: 'Invites',
        roomUpdates: 'Room updates',
        scenarioUpdates: 'Scenario updates',
      };
      const label = actionMap[action] || 'Utilities';
      setStatusMessage(`${label} are available in this menu.`, 'info');
    };
  });

  if (!headerOutsideClickHandlerBound) {
    document.addEventListener('click', (event) => {
      const accountButton = document.getElementById('account-menu-btn');
      const accountDropdown = document.getElementById('account-menu-dropdown');
      const utilitiesButton = document.getElementById('utilities-menu-btn');
      const utilitiesDropdown = document.getElementById('utilities-menu-dropdown');
      if (accountDropdown && accountButton && !accountDropdown.contains(event.target) && event.target !== accountButton) {
        accountDropdown.classList.remove('is-open');
        accountButton.setAttribute('aria-expanded', 'false');
      }
      if (utilitiesDropdown && utilitiesButton && !utilitiesDropdown.contains(event.target) && event.target !== utilitiesButton) {
        utilitiesDropdown.classList.remove('is-open');
        utilitiesButton.setAttribute('aria-expanded', 'false');
      }
    });
    headerOutsideClickHandlerBound = true;
  }

  const logoutButton = document.getElementById('logout-btn');
  if (logoutButton) {
    logoutButton.onclick = async () => {
      try {
        await logoutWithSupabase();
      } catch {
        // ignore logout network errors and clear local auth regardless
      }
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
        <p class="muted">Your onboarding scenario is loaded. Start in Nexus Professional to complete your first guided challenge.</p>
        <div class="header-actions" style="justify-content:flex-end;">
          <button class="pill-btn" type="button" id="dismiss-starter-scenario-btn">Later</button>
          <button class="pill-btn cta-primary" type="button" id="open-starter-scenario-btn">Open Nexus Professional</button>
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
      location.hash = '/nexus/professional';
    };
  }
}

function setMode(nextMode) {
  state.mode = nextMode;
  localStorage.setItem('wsg-mode', state.mode);
  applyModeClass();
  if (state.mode === 'roleplay') {
    ensureRoleplaySession();
  }
  render();
}

function applyModeClass() {
  document.body.classList.remove('mode-professional', 'mode-roleplay');
  document.body.classList.add(state.mode === 'roleplay' ? 'mode-roleplay' : 'mode-professional');
}

function renderLayout(path, key, pageHtml) {
  applyModeClass();
  const pageSet = pageSetClass(path, key);

  const statusMarkup = state.statusMessage
    ? `<p class="status-banner status-${state.statusMessage.tone}" role="status">${escapeHtml(state.statusMessage.message)}</p>`
    : '';

  document.getElementById('app').innerHTML = `
    ${AppShell(path, key, pageHtml, statusMarkup, pageSet)}
    ${starterScenarioModalMarkup()}
    ${key === 'arena' ? '' : SiteFooter()}
  `;

  attachHeaderActions();
  attachOnboardingHandlers();
}

function renderPublicLayout(path, key, pageHtml) {
  const [title, subtitle] = pageTitle(key);
  applyModeClass();
  const pageSet = pageSetClass(path, key);
  const isAuthRoute = key === 'login' || key === 'signup';
  const showPageHeader = key !== 'landing' && !isAuthRoute;

  const statusMarkup = state.statusMessage
    ? `<p class="status-banner status-${state.statusMessage.tone}" role="status">${escapeHtml(state.statusMessage.message)}</p>`
    : '';

  document.getElementById('app').innerHTML = `
    <div class="public-shell page-set ${pageSet} ${isAuthRoute ? 'auth-shell' : ''}">
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

      <main class="public-container public-content ${isAuthRoute ? 'auth-public-content' : ''}">
        ${showPageHeader ? `<section class="main-header"><h2>${title}</h2><p>${subtitle}</p></section>` : ''}
        ${statusMarkup}
        <section class="${isAuthRoute ? 'auth-public-section' : ''}" style="margin-top:${showPageHeader ? '14px' : '0'};">${pageHtml}</section>
      </main>
      ${SiteFooter()}
    </div>
  `;

  attachHeaderActions();
}

async function render() {
  try {
    let path = location.hash.replace('#', '') || '/';

    if (state.supabaseConfigMissing) {
      document.getElementById('app').innerHTML = configRequiredPage();
      return;
    }

    if (state.auth.loading) {
      document.getElementById('app').innerHTML = authLoadingPage();
      return;
    }

    if (state.startupError) {
      document.getElementById('app').innerHTML = startupErrorPage(state.startupError);
      return;
    }

    path = applyRouteGuards(path);

    if (location.hash.replace('#', '') !== path) {
      location.hash = path;
      return;
    }

    if (path === '/hub' || path === '/members') {
      await ensureMembersLoaded();
    }
    if (path === '/profile' || /^\/(?:members|profile)\/[^/]+$/.test(path)) {
      await loadProfileForRoute(path);
    }
    const isPolicyAcceptRoute = path === POLICY_ACCEPT_ROUTE;
    const isPublicRoute = ['/', '/login', '/signup', '/code-of-conduct', '/content-policy', '/platform-rules', '/privacy'].includes(path);
    if (state.currentUser && !isPublicRoute && !isPolicyAcceptRoute) {
      await loadConnections();
    }
    if (path === '/recruiter-console' || path === '/hub' || path === '/members') {
      await ensureMembersLoaded();
    }
    if (path !== '/profile') {
      state.onboarding.starterModalOpen = false;
    } else {
      state.onboarding.starterModalOpen = isFirstArrivalAfterSignup();
      if (state.onboarding.starterModalOpen) {
        setStatusMessage('Starter scenario loaded. Begin onboarding to continue.', 'info');
      }
    }

    const route = routes[path]
      || (/^\/(?:members|profile)\/[^/]+$/.test(path) ? { key: 'profile', requiresAuth: true } : null)
      || (/^\/characters\/[^/]+$/.test(path) ? { key: 'characterDetail', requiresAuth: true } : null)
      || { key: 'fallback' };
    const isScenarioRoute = path === '/scenario' || path.startsWith('/scenario/');
    const resolvedRoute = isScenarioRoute ? { key: 'scenarioDetail', requiresAuth: true } : route;
    const pageHtml = {
      landing: landingPage,
      home: homePage,
      nexus: nexusPage,
      nexusProfessional: professionalRoomsPage,
      nexusRoleplay: roleplayRoomsPage,
      hub: hubPage,
      arena: arenaPage,
      guild: guildPage,
      roleplayHub: roleplayHubPage,
      members: membersPage,
      profile: profilePage,
      resume: resumePage,
      characters: charactersPage,
      settings: settingsPage,
      characterDetail: () => characterDetailPage(path),
      directChat: directChatPage,
      scenarioChat: scenarioChatPage,
      areaChat: areaChatPage,
      scenarioDetail: () => scenarioDetailPage(path),
      profileEdit: profileEditPage,
      login: loginPage,
      signup: signupPage,
      policyAccept: policyAcceptPage,
      codeOfConduct: codeOfConductPage,
      contentPolicy: contentPolicyPage,
      platformRules: platformRulesPage,
      privacy: privacyPage,
      recruiter: recruiterPage,
      fallback: fallbackPage,
    }[resolvedRoute.key]();

    if (['landing', 'login', 'signup', 'codeOfConduct', 'contentPolicy', 'platformRules', 'privacy', 'policyAccept'].includes(resolvedRoute.key)) {
      renderPublicLayout(path, resolvedRoute.key, pageHtml);
    } else {
      renderLayout(path, resolvedRoute.key, pageHtml);
    }
    if (typeof initializeGoogleAuth === 'function') {
      initializeGoogleAuth(resolvedRoute.key);
    }

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
        const result = await loginWithSupabase({ email: payload.identifier, password: payload.password });
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
        email: String(formData.get('email') || '').trim(),
        password: String(formData.get('password') || ''),
        confirmPassword: String(formData.get('confirmPassword') || ''),
      };

      const validationError = (() => {
        if (!payload.email || !isValidEmail(payload.email)) return 'Enter a valid email address.';
        if (!payload.password) return 'Password is required.';
        if (payload.password !== payload.confirmPassword) return 'Password and Confirm Password must match.';
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
          fields: Object.keys(requestPayload),
        });
        const result = await signupWithSupabase({
          email: requestPayload.email,
          password: requestPayload.password,
          metadata: {
            role: 'member',
          },
        });
        console.log('[auth:frontend] signup success', { userId: result?.user?.id, email: result?.user?.email });
        const requiresVerification = !result?.session;
        const successMessage = requiresVerification
          ? 'Account created. Please verify your email, then log in.'
          : 'Account created successfully.';
        setFormMessage('signup', successMessage, 'success');
        setStatusMessage(successMessage, 'success');
        if (result?.session) {
          await finalizeSignInResult(result, 'signup');
        } else {
          setTimeout(() => {
            location.hash = '/login';
          }, 200);
        }
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

  const policyAcceptForm = document.getElementById('policy-accept-form');
  if (policyAcceptForm) {
    const checkbox = policyAcceptForm.querySelector('input[name="policyAgreement"]');
    if (checkbox) {
      checkbox.onchange = () => {
        state.authForms.policyAccept.agreed = checkbox.checked;
        if (checkbox.checked) {
          state.authForms.policyAccept.attemptedSubmit = false;
        }
        render();
      };
    }

    policyAcceptForm.onsubmit = async (event) => {
      event.preventDefault();
      if (state.authForms.policyAccept.loading) return;
      const formData = new FormData(policyAcceptForm);
      const policyAgreement = formData.get('policyAgreement') === 'yes';
      state.authForms.policyAccept.agreed = policyAgreement;
      state.authForms.policyAccept.attemptedSubmit = true;
      if (!policyAgreement) {
        setFormMessage('policyAccept', 'Please review and accept all required policies.', 'error');
        render();
        return;
      }
      setFormMessage('policyAccept', 'Saving policy acceptance...', 'info');
      state.authForms.policyAccept.loading = true;
      render();
      try {
        saveLocalPolicyAcceptance(state.currentUser?.id);
        state.currentUser = {
          ...(state.currentUser || {}),
          policyAcceptance: readLocalPolicyAcceptance(state.currentUser?.id) || {},
        };
        state.authForms.policyAccept.agreed = true;
        setFormMessage('policyAccept', 'Policy acceptance saved.', 'success');
        setStatusMessage('Policy acceptance saved. Welcome to WSG.', 'success');
        location.hash = resolvePostAuthRoute(state.currentUser);
      } catch (error) {
        const message = error instanceof Error && error.message
          ? error.message
          : 'We could not save your policy acceptance. Please try again.';
        setFormMessage('policyAccept', message, 'error');
        setStatusMessage(message, 'error');
      } finally {
        state.authForms.policyAccept.loading = false;
        render();
      }
    };
  }

  attachProfileEditHandler();
  attachArenaHandlers();
  attachRoleplayHandlers();
  attachNexusRoomHandlers();
  attachScenarioDetailHandlers();
  attachHomeChatHandlers();
  attachChatPaneHandlers();
    console.log('[wsg] render complete');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown render failure.';
    console.error('[wsg] render failure fallback', error);
    document.getElementById('app').innerHTML = `
      <div class="public-shell">
        <main class="public-container public-content">
          <h2>Unable to render this page</h2>
          <p class="muted">The app hit a rendering error and showed this fallback instead of a blank screen.</p>
          <p class="muted" role="alert"><strong>Details:</strong> ${escapeHtml(message)}</p>
          <p><a href="#/login">Go to Sign In</a> · <a href="#/signup">Create Account</a></p>
        </main>
      </div>
    `;
  }
}


function attachNexusRoomHandlers() {
  document.querySelectorAll('[data-toggle-nexus-create-room]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.getAttribute('data-toggle-nexus-create-room') || '';
      if (!mode || !(mode in (state.nexus.createRoomOpenByMode || {}))) return;
      state.nexus.createRoomOpenByMode[mode] = !state.nexus.createRoomOpenByMode[mode];
      render();
    });
  });

  document.querySelectorAll('[data-nexus-create-room-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const mode = form.getAttribute('data-nexus-create-room-form') || '';
      if (!mode) return;
      const formData = new FormData(form);
      const roomName = String(formData.get('roomName') || '').trim();
      const roomType = String(formData.get('roomType') || (mode === 'professional' ? 'interview' : 'roleplay')).trim();
      const roomDescription = String(formData.get('roomDescription') || '').trim();
      const roomVisibility = String(formData.get('roomVisibility') || 'public').trim();
      const isPrivate = roomVisibility === 'private';
      const currentUserId = getCurrentUserRoomId();
      const allowedUsers = normalizeAllowedUsers(formData.get('allowedUsers'));
      if (!roomName) return;
      const newRoom = normalizeRoomRecord({
        id: `nexus-${mode}-${slugifyScenario(roomName)}-${Date.now()}`,
        name: roomName,
        description: roomDescription || 'Custom room',
        status: 'Open',
        roomKind: roomType === 'scenario' || roomType === 'interview' ? 'scenario' : 'chat',
        visibility: isPrivate ? 'private' : 'public',
        roomType: roomType === 'interview' ? 'interview' : roomType === 'scenario' ? 'scenario' : 'roleplay',
        allowedUsers: isPrivate ? [...new Set([currentUserId, ...allowedUsers])] : [],
        hostUserId: currentUserId,
        category: mode === 'professional' ? (roomType === 'interview' ? 'Interviewing' : 'Scenarios') : 'Social Roleplay',
        moderator: mode === 'professional' ? 'Aegis Moderator' : 'Warden Echo',
        sfwPolicy: mode === 'professional' ? 'Professional SFW moderation active' : 'NPC moderator enforces SFW room safety',
        temporary: roomType === 'scenario' || roomType === 'interview',
        users: [{ id: currentUserId, displayName: state.currentUser?.displayName || state.currentUser?.username || 'You', role: 'host', isOnline: true }],
      }, mode === 'professional' ? 'scenario' : 'roleplay');

      if (mode === 'professional') {
        PROFESSIONAL_ROOMS.unshift(newRoom);
        state.nexus.activeProfessionalRoomId = newRoom.id;
      } else {
        state.arena.roleplayRooms = [newRoom, ...(Array.isArray(state.arena.roleplayRooms) ? state.arena.roleplayRooms : [])];
        state.nexus.activeRoleplayRoomId = newRoom.id;
      }
      state.nexus.createRoomOpenByMode[mode] = false;
      state.nexus.accessNoticeByMode[mode] = '';
      render();
    });
  });

  document.querySelectorAll('[data-nexus-panel-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const token = button.getAttribute('data-nexus-panel-toggle') || '';
      const [mode, side] = token.split(':');
      if (!mode || !side || !state.nexus.panelCollapsedByMode?.[mode]) return;
      if (side !== 'left' && side !== 'right') return;
      state.nexus.panelCollapsedByMode[mode][side] = !Boolean(state.nexus.panelCollapsedByMode[mode][side]);
      persistNexusPanelPrefs();
      render();
    });
  });

  document.querySelectorAll('[data-open-nexus-room]').forEach((button) => {
    button.addEventListener('click', () => {
      const token = button.getAttribute('data-open-nexus-room') || '';
      const [mode, roomId] = token.split(':');
      if (!mode || !roomId) return;
      const targetRoom = getNexusRooms(mode).find((room) => room.id === roomId);
      if (!targetRoom || !canUserAccessRoom(targetRoom, getCurrentUserRoomId())) {
        state.nexus.accessNoticeByMode[mode] = 'You do not have access to this room.';
        render();
        return;
      }
      if (mode === 'professional') {
        state.nexus.activeProfessionalRoomId = roomId;
      } else {
        state.nexus.activeRoleplayRoomId = roomId;
      }
      state.nexus.accessNoticeByMode[mode] = '';
      render();
    });
  });

  document.querySelectorAll('[data-room-category]').forEach((button) => {
    button.addEventListener('click', () => {
      const token = button.getAttribute('data-room-category') || '';
      const [mode, category] = token.split(':');
      if (!mode || !category) return;
      state.nexus.activeCategoryByMode[mode] = category;
      render();
    });
  });

  document.querySelectorAll('[data-nexus-chat-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const token = form.getAttribute('data-nexus-chat-form') || '';
      const [mode, roomId] = token.split(':');
      if (!mode || !roomId) return;
      const input = form.querySelector('input[name="message"]');
      const text = String(input?.value || '').trim();
      if (!text) return;
      const key = roomMessageKey(mode, roomId);
      const roomMessages = Array.isArray(state.nexus.roomMessages[key]) ? state.nexus.roomMessages[key] : [];
      roomMessages.push({
        sender: state.currentUser?.displayName || state.currentUser?.username || 'You',
        role: 'user',
        text,
      });
      state.nexus.roomMessages[key] = roomMessages.slice(-80);
      if (input) input.value = '';
      render();
    });
  });

  const answerButton = document.getElementById('scenario-direct-answer-btn');
  if (answerButton) {
    answerButton.addEventListener('click', () => {
      setStatusMessage('Scenario prompt answer submitted (placeholder). Full scoring flow stays in dedicated scenario routes.', 'info');
      render();
    });
  }
}

function attachRoleplayHandlers() {
  const roleplayForm = document.getElementById('roleplay-input-form');
  if (roleplayForm) {
    roleplayForm.onsubmit = async (event) => {
      event.preventDefault();
      const session = ensureRoleplaySession();
      const input = document.getElementById('roleplay-input');
      const value = String(input?.value || '').trim();
      if (!value || state.roleplay.pending) {
        return;
      }

      state.roleplay.error = '';
      session.messages.push({ id: crypto.randomUUID(), type: 'user', content: value });
      if (input) input.value = '';
      state.roleplay.pending = true;
      render();

      try {
        const aiReply = await requestRoleplayAssistantReply(value, session);
        session.messages.push({ id: crypto.randomUUID(), type: 'system', content: aiReply });
      } catch (error) {
        console.error('[ai:frontend] roleplay response failed', { error, message: value });
        state.roleplay.error = getArenaFriendlyErrorMessage(error);
        session.messages.push({
          id: crypto.randomUUID(),
          type: 'system',
          content: 'The world goes silent for a moment. Try again.',
        });
      }

      state.roleplay.pending = false;
      render();
    };
  }

  const chatLog = document.getElementById('roleplay-conversation-log');
  if (chatLog) {
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  const toolsToggle = document.getElementById('roleplay-tools-toggle');
  if (toolsToggle) {
    toolsToggle.onclick = () => {
      state.roleplay.toolsCollapsed = !state.roleplay.toolsCollapsed;
      persistRoleplayToolsCollapsedPreference();
      render();
    };
  }

  document.querySelectorAll('[data-roleplay-tools-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.getAttribute('data-roleplay-tools-tab');
      if (!tab) return;
      state.roleplay.activeToolsTab = tab;
      if (state.roleplay.toolsCollapsed) {
        state.roleplay.toolsCollapsed = false;
        persistRoleplayToolsCollapsedPreference();
      }
      render();
    });
  });

  document.querySelectorAll('[data-roleplay-participant-route]').forEach((button) => {
    button.addEventListener('click', () => {
      const route = button.getAttribute('data-roleplay-participant-route');
      if (!route) return;
      location.hash = route;
    });
  });
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', async () => {
  applyModeClass();
  const resolvedApiBaseUrl = resolveApiBaseUrl();
  console.log('[wsg] Resolved API base URL:', resolvedApiBaseUrl || '(same-origin)');
  console.info(`[wsg] Supabase URL present: ${supabaseConfig.urlPresent ? 'yes' : 'no'}`);
  console.info(`[wsg] Supabase key present: ${supabaseConfig.keyPresent ? 'yes' : 'no'}`);
  console.info(`[wsg] Supabase configuration missing: ${supabaseConfig.ready ? 'no' : 'yes'}`);
  await bootstrapAuth();
  render();
});

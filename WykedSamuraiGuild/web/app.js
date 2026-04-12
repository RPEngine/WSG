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
  '/login': { key: 'login', guestOnly: true },
  '/signup': { key: 'signup', guestOnly: true },
  '/recruiter-console': { key: 'recruiter', requiresAuth: true },
};

const navItems = [
  ['Home', '/app'],
  ['Arena', '/arena'],
  ['Guild', '/guild-world'],
  ['Members', '/members'],
  ['Profile Hub', '/profile'],
  ['Recruiter Console', '/recruiter-console'],
];

const STARTER_TRIALS = [
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

const state = {
  mode: localStorage.getItem('wsg-mode') || 'professional',
  authToken: localStorage.getItem('wsg-auth-token') || '',
  currentUser: null,
  members: [],
  activeProfile: null,
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
  },
  homeChat: {
    messages: [],
    pending: false,
    error: '',
  },
  statusMessage: null,
  onboarding: {
    starterModalOpen: false,
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
const PASSWORD_POLICY_MESSAGE = 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

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

async function checkHuggingFaceConnection() {
  return apiRequest(AI_ENDPOINTS.test, {
    method: 'GET',
  });
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

function rightSidebar() {
  const onlineConnections = state.network.connections.slice(0, 6);
  const onlineItems = onlineConnections.length
    ? onlineConnections.map((connection) => `
      <li>
        <div class="rail-identity">
          ${avatarMarkup(connection, 'md')}
          <div>
            <strong>${escapeHtml(connection.displayName || connection.username)}</strong>
            <p class="muted">${escapeHtml(connection.role || 'Guild Member')}</p>
          </div>
        </div>
        <span class="rail-online-dot" aria-label="Online"></span>
      </li>
    `).join('')
    : '<li><p class="muted">No guildmates online right now.</p></li>';

  const conversationItems = onlineConnections.length
    ? onlineConnections.slice(0, 4).map((connection, index) => `
      <li class="${index === 0 ? 'is-active' : ''}">
        <div>
          <strong>${escapeHtml(connection.displayName || connection.username)}</strong>
          <p class="muted">${escapeHtml(index === 0 ? 'Ready for your next briefing?' : 'Standing by in command chat.')}</p>
        </div>
        <span class="muted">${index === 0 ? 'Now' : `${index + 6}m`}</span>
      </li>
    `).join('')
    : '<li><p class="muted">No open conversations yet.</p></li>';

  const activeChatName = onlineConnections[0]?.displayName || onlineConnections[0]?.username || 'Guild Channel';

  return `
    <section class="social-rail">
      <div class="social-rail-block">
        <h3>Friends Online</h3>
        <ul class="social-list">${onlineItems}</ul>
      </div>
      <div class="social-rail-block">
        <label class="rail-search">
          <span class="muted">Chat Search</span>
          <input type="search" placeholder="Search conversations" />
        </label>
      </div>
      <div class="social-rail-block">
        <h4>Conversations</h4>
        <ul class="conversation-compact-list">${conversationItems}</ul>
      </div>
      <section class="active-chat-dock">
        <div class="active-chat-head">
          <strong>${escapeHtml(activeChatName)}</strong>
          <span class="muted">Active</span>
        </div>
        <p class="muted">Moon gate is clear. Ready to move when you are.</p>
        <form class="active-chat-form">
          <input type="text" value="" placeholder="Send a quick reply..." />
          <button class="pill-btn cta-primary" type="button">Send</button>
        </form>
      </section>
    </section>
  `;
}

function homePage() {
  const displayName = state.currentUser?.displayName || 'Guild Member';
  const chatMessages = state.homeChat.messages
    .map(
      (message) => `
        <article class="message ${message.type}">
          <div class="message-label">${message.type === 'user' ? 'You' : 'WSG AI'}</div>
          <p>${escapeHtml(message.content)}</p>
        </article>
      `
    )
    .join('');
  const scenarioCards = [
    {
      title: 'Moon Harbor Intercept',
      summary: 'Negotiate a ceasefire between two rival fleets before the trade corridor collapses.',
      timeRemaining: '42m remaining',
      visual: 'Fogline Harbor',
    },
    {
      title: 'Citadel Breach Council',
      summary: 'Lead a cross-cell strategy session while resources are constrained and pressure escalates.',
      timeRemaining: '1h 12m remaining',
      visual: 'Glass Citadel',
    },
    {
      title: 'Nightwatch Supply Run',
      summary: 'Stabilize logistics and morale after a surprise disruption during the midnight convoy.',
      timeRemaining: '23m remaining',
      visual: 'Iron Route',
    },
  ];

  const activitySeed = state.network.connections.slice(0, 4);
  const activityFeed = activitySeed.length
    ? activitySeed.map((connection, index) => `
      <li>
        <div class="activity-avatar">${avatarMarkup(connection, 'md')}</div>
        <div>
          <strong>${escapeHtml(connection.displayName || connection.username)}</strong>
          <p class="muted">${escapeHtml(connection.role || 'Guild Member')} coordinated a tactical response in the Night Forum.</p>
        </div>
        <span class="muted">${index === 0 ? '8m' : `${(index + 1) * 11}m`}</span>
      </li>
    `).join('')
    : `
      <li>
        <div class="activity-avatar"><div class="avatar-md avatar-fallback">WS</div></div>
        <div>
          <strong>Guild Chronicle</strong>
          <p class="muted">No recent activity yet. Coordinate your first mission to light up the feed.</p>
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
      <p class="home-kicker">Guild Command</p>
      <h1>Welcome, ${escapeHtml(displayName)}</h1>
      <p>Your moonlit operations hub is aligned. Review active scenarios, track guild momentum, and deploy your next move with focus.</p>
    </section>

    <section class="home-body-grid">
      <div class="home-main-column">
        <section class="card home-section tier-2">
          <div class="section-heading-row">
            <h3>Recommended Scenarios</h3>
          </div>
          <div class="scenario-card-stack">
            ${scenarioCards.map((scenario) => `
              <article class="scenario-spotlight-card">
                <div class="scenario-spotlight-visual">
                  <span>${scenario.visual}</span>
                </div>
                <div class="scenario-spotlight-content">
                  <h4>${scenario.title}</h4>
                  <p class="muted">${scenario.summary}</p>
                  <div class="scenario-spotlight-meta">
                    <span class="muted">${scenario.timeRemaining}</span>
                    <button class="pill-btn cta-primary" type="button">Enter</button>
                  </div>
                </div>
              </article>
            `).join('')}
          </div>
        </section>

        <section class="card home-section tier-2">
          <div class="section-heading-row">
            <h3>Recent Guild Activity</h3>
          </div>
          <ul class="guild-activity-list">${activityFeed}</ul>
        </section>
      </div>

      <aside class="home-support-column">
        <section class="card home-support-card tier-3">
          <h3>Guild Updates</h3>
          <ul class="support-list">
            <li><strong>Moon Council Briefing</strong><p class="muted">Strategic alignment at 21:00 UTC. Keep notes concise.</p></li>
            <li><strong>Ops Signal</strong><p class="muted">Harbor patrol coverage has shifted to east perimeter.</p></li>
            <li><strong>Lore Dispatch</strong><p class="muted">New archive snippets added for the Glass Frontier chapter.</p></li>
          </ul>
        </section>
        <section class="card home-support-card tier-3">
          <h3>Top Contributors</h3>
          <ul class="contributors-list">${contributors}</ul>
        </section>
        <section class="card home-support-card recruiter-teaser tier-3">
          <h3>Recruiter HQ</h3>
          <p class="muted">Review candidate signal quality and move high-potential talent to your short list.</p>
          <a class="pill-btn" href="${linkFor('/recruiter-console')}">Open Recruiter Console</a>
        </section>
      </aside>
    </section>

    <div class="home-chat-inline">
      <section class="card home-chat-panel tier-2">
        <h3>Strategic AI Relay</h3>
        <p class="muted">Request concise guidance for your next mission thread.</p>
        <div id="home-chat-log" class="conversation-log home-chat-log">
          ${chatMessages || '<p class="muted">No messages yet. Send one to begin.</p>'}
        </div>
        <form id="home-chat-form" class="arena-input" style="margin-top:10px;">
          <input id="home-chat-input" name="message" placeholder="Type your message..." ${state.homeChat.pending ? 'disabled' : ''} />
          <button class="pill-btn cta-primary" type="submit" ${state.homeChat.pending ? 'disabled' : ''}>${state.homeChat.pending ? 'Sending...' : 'Send'}</button>
        </form>
        ${state.homeChat.error ? `<p class="muted" style="color:#ff7b7b;margin-top:8px;" role="alert">${escapeHtml(state.homeChat.error)}</p>` : ''}
      </section>
    </div>
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
  const chatMessages = state.arena.messages
    .map(
      (message) => `
        <article class="message ${message.type}">
          <div class="message-label">${message.type === 'user' ? 'You' : 'Arena System'}</div>
          <p>${escapeHtml(message.content)}</p>
        </article>
      `
    )
    .join('');

  const scenarioMessages = (state.scenarioChat.messages || [])
    .map((message) => `
      <article class="message ${message.senderId === state.currentUser?.id ? 'user' : 'system'}">
        <div class="message-label">${message.senderId === state.currentUser?.id ? 'You' : 'Participant'}</div>
        <p>${escapeHtml(message.content)}</p>
      </article>
    `).join('');

  return layoutColumns({
    className: 'arena-layout',
    left: `
      <h3>Starter Trial Library</h3>
      <p class="muted">Select a live scenario to enter the Arena.</p>
      <div class="trial-list">
        ${STARTER_TRIALS.map(
          (trial) => `
            <article class="trial-card ${trial.id === state.arena.activeTrialId ? 'active' : ''}">
              <div class="trial-card-head">
                <h4>${trial.title}</h4>
                ${trial.id === state.arena.activeTrialId ? '<span class="trial-state-chip">Active Trial</span>' : ''}
              </div>
              <p class="muted">${trial.description}</p>
              <div class="trial-meta">
                <span>${trial.category}</span>
                <span>${trial.difficulty}</span>
              </div>
              <button class="pill-btn start-trial-btn" data-trial-id="${trial.id}">
                ${trial.id === state.arena.activeTrialId ? 'Restart Trial' : 'Start Trial'}
              </button>
            </article>
          `
        ).join('')}
      </div>
    `,
    center: `
      ${
  hasActiveTrial
    ? `
          <section class="scenario-hero scenario-hero-arena">
            <p class="hero-kicker">Active Arena Scenario</p>
            <h3>${activeTrial.title}</h3>
            <p class="hero-description">${activeTrial.description}</p>
            <div class="hero-meta">
              <article class="hero-metric">
                <span>Timer</span>
                <strong>29:45</strong>
              </article>
              <article class="hero-metric">
                <span>Participants</span>
                <strong>${participantCount}</strong>
              </article>
              <article class="hero-metric">
                <span>Category</span>
                <strong>${activeTrial.category}</strong>
              </article>
              <article class="hero-metric">
                <span>Role Focus</span>
                <strong>${activeTrial.suggestedRole || 'Open'}</strong>
              </article>
            </div>
          </section>
        `
    : `
          <section class="scenario-hero scenario-hero-arena">
            <p class="hero-kicker">Arena Ready</p>
            <h3>Select a Trial to Start</h3>
            <p class="hero-description">Choose from the left panel to launch a guided scenario run with live messaging and participant context.</p>
            <div class="hero-meta">
              <article class="hero-metric"><span>Status</span><strong>Awaiting launch</strong></article>
              <article class="hero-metric"><span>Mode</span><strong>${state.mode === 'roleplay' ? 'Roleplay' : 'Professional'}</strong></article>
              <article class="hero-metric"><span>Queue</span><strong>${STARTER_TRIALS.length} scenarios</strong></article>
            </div>
          </section>
        `
}
      <section class="scenario-experience-panel">
        <div class="scenario-panel-head">
          <div>
            <p class="hero-kicker">Execution Deck</p>
            <h4>Scenario Experience</h4>
          </div>
          <p class="muted">${state.mode === 'roleplay' ? 'Immersive roleplay lane' : 'Structured decision lane'}</p>
        </div>
        ${hasActiveTrial ? `<p class="scenario-prompt">${escapeHtml(activeTrial.openingPrompt)}</p>` : ''}
      ${
  hasActiveTrial
    ? `<div id="arena-conversation-log" class="conversation-log">${chatMessages}</div>`
    : '<div class="arena-empty"><h4>No Trial active</h4><p class="muted">Choose a starter Trial from the left panel to begin.</p></div>'
}
      <form id="arena-input-form" class="arena-input">
        <input id="arena-input" name="message" placeholder="${hasActiveTrial ? 'Enter your response to the Trial...' : 'Start a Trial to enable messaging'}" ${hasActiveTrial ? '' : 'disabled'} />
        <button id="arena-send-btn" class="pill-btn" type="submit" ${(hasActiveTrial && !state.arena.pending) ? '' : 'disabled'}>${state.arena.pending ? 'Sending...' : 'Send'}</button>
      </form>
      ${state.arena.error ? `<p class="muted" style="color:#ff7b7b;margin-top:8px;" role="alert">${escapeHtml(state.arena.error)}</p>` : ''}
      </section>
    `,
    right: `
      <h3>Participants</h3>
      <section class="participant-grid">
        ${(state.network.connections || []).slice(0, 6).map((connection) => `
          <article class="participant-card">
            <div class="participant-avatar">${avatarMarkup(connection, 'md')}</div>
            <div>
              <strong>${escapeHtml(connection.displayName || connection.username)}</strong>
              <p class="muted">${escapeHtml(connection.role || 'member')}</p>
            </div>
            <span class="participant-status">Live</span>
          </article>
        `).join('') || '<p class="muted">No participants connected yet.</p>'}
      </section>
      <section class="messaging-rail scenario-chat-rail" style="margin-top:12px;">
        <div class="messaging-rail-head">
          <h4>Scenario Chat</h4>
          <span class="muted">In-trial comms</span>
        </div>
        <div class="conversation-log home-chat-log">${scenarioMessages || '<p class="muted">No scenario chat messages yet.</p>'}</div>
        <form id="scenario-chat-form" class="arena-input" style="margin-top:10px;">
          <input id="scenario-chat-input" placeholder="Message participants..." />
          <button class="pill-btn" type="submit">Send</button>
        </form>
      </section>
      <h4 style="margin-top:14px;">Scenario Status</h4>
      ${
  hasActiveTrial
    ? `
            <ul class="status-list">
              <li><span class="muted">Title</span><strong>${activeTrial.title}</strong></li>
              <li><span class="muted">Category</span><strong>${activeTrial.category}</strong></li>
              <li><span class="muted">Difficulty</span><strong>${activeTrial.difficulty}</strong></li>
              <li><span class="muted">Suggested Role</span><strong>${activeTrial.suggestedRole || 'Unspecified'}</strong></li>
              <li><span class="muted">Pressure State</span><strong>Stable</strong></li>
            </ul>
          `
    : '<p class="muted">No active Trial yet. Status details will populate after you start one.</p>'
}
    `,
  });
}

function guildPage() {
  return `
    <div class="grid two">
      ${card('Roleplay Feed', list(['"Mist over Kagemori as scouts return."', '"Alliance envoy arrives at moon gate."', '"Campfire confessions in the cedar court."'].map((s) => `<span>${s}</span><span class="muted">Story</span>`)))}
      ${card('Featured Locations', list(['Moonfall Harbor', 'Cinder Dojo', 'Glass Pine Ridge'].map((s) => `<span>${s}</span><span class="muted">Live scene</span>`)))}
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
        .map(
          (member) => `
            <article class="card member-row">
              <div>${avatarMarkup(member)}</div>
              <div>
                <h3 style="margin:0;">${member.displayName}</h3>
                <p class="muted" style="margin:4px 0;">@${member.username}</p>
                <p>${member.bio || '<span class="muted">No bio yet.</span>'}</p>
              </div>
              <div class="member-meta">
                <span>Trials completed: <strong>${member.trialCount}</strong></span>
                <a class="pill-btn" href="#/members/${member.id}">View profile</a>
              </div>
            </article>`
        )
        .join('')}
    </div>
  `;
}

function profilePage() {
  const profile = state.currentUser;
  if (!profile) {
    return card('Profile Hub', '<p class="muted">Please log in first.</p>');
  }

  const skills = splitSkills(profile.skillsInterests);
  const connectionPreview = state.network.connections.length
    ? state.network.connections.slice(0, 4).map((connection) => `<li><span>${escapeHtml(connection.displayName || connection.username)}</span><span class="muted">${escapeHtml(connection.role || 'member')}</span></li>`).join('')
    : '<li><span class="muted">No connections yet.</span></li>';

  return `
    <section class="feature profile-display-hero">
      <div class="profile-summary-row">
        ${avatarMarkup(profile, 'lg')}
        <div>
          <p class="hero-kicker">Guild Profile</p>
          <h3 style="margin:0;">${escapeHtml(profile.displayName)}</h3>
          <p class="muted" style="margin:4px 0;">@${escapeHtml(profile.username)}</p>
          <p class="muted" style="margin:0;">${escapeHtml(profile.role || 'member')} · ${escapeHtml(profile.organizationName || 'Independent')}</p>
        </div>
      </div>
      <p class="profile-display-bio">${escapeHtml(profile.bio || 'No profile story published yet.')}</p>
      <div class="tag-list">
        ${skills.length ? skills.map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('') : '<span class="muted">No skills listed yet.</span>'}
      </div>
      <div class="actions">
        <a class="pill-btn" href="#/recruiter-console">Message</a>
        <a class="pill-btn" href="#/members">Connect</a>
      </div>
    </section>
    <section class="profile-identity-overview">
      <article class="metric-card">
        <span>Trials Completed</span>
        <strong>${profile.trialCount || 0}</strong>
      </article>
      <article class="metric-card">
        <span>Connections</span>
        <strong>${state.network.connections.length}</strong>
      </article>
      <article class="metric-card">
        <span>Guild Since</span>
        <strong>${new Date(profile.createdAt || Date.now()).toLocaleDateString()}</strong>
      </article>
      <article class="metric-card">
        <span>Last Active</span>
        <strong>${new Date(profile.lastActiveAt || Date.now()).toLocaleDateString()}</strong>
      </article>
    </section>
    <section class="profile-hub-grid profile-display-grid" style="margin-top:14px;">
      <div class="profile-hub-col">
        <section class="card">
          <h3>Profile Snapshot</h3>
          <p class="muted">Name: ${escapeHtml(profile.displayName || profile.username || 'Unknown')}</p>
          <p class="muted">Title / Role: ${escapeHtml(profile.role || 'member')}</p>
          <p class="muted">Organization: ${escapeHtml(profile.organizationName || 'Independent')}</p>
          <p class="muted">Bio length: ${(profile.bio || '').length} chars</p>
        </section>
      </div>
      <div class="profile-hub-col">
        <section class="card">
          <h3>Connections Preview</h3>
          <ul class="list compact-list">${connectionPreview}</ul>
        </section>
        <section class="card">
          <h3>Account Timeline</h3>
          <p class="muted">Joined: ${formatDate(profile.createdAt)}</p>
          <p class="muted">Updated: ${formatDate(profile.updatedAt)}</p>
        </section>
      </div>
    </section>
    <section class="card profile-edit-section">
      <h3>Edit Profile</h3>
      <p class="muted">Update account details below. Public profile display remains above.</p>
      <form id="profile-hub-form" class="form-stack">
        <p id="profile-hub-feedback" class="status-banner ${state.profileHub.message ? `status-${state.profileHub.tone}` : 'status-info'}" role="alert" aria-live="assertive">${escapeHtml(state.profileHub.message || 'Make updates and save when ready.')}</p>
        <label>Display Name<input name="displayName" value="${escapeAttr(profile.displayName || '')}" required /></label>
        <label>Role / Title
          <select name="role">
            <option value="employee_member" ${profile.role === 'employee_member' ? 'selected' : ''}>Employee / Member</option>
            <option value="employer" ${profile.role === 'employer' ? 'selected' : ''}>Employer</option>
            <option value="recruiter" ${profile.role === 'recruiter' ? 'selected' : ''}>Recruiter</option>
          </select>
        </label>
        <label>Organization<input name="organizationName" value="${escapeAttr(profile.organizationName || '')}" /></label>
        <label>Bio / About<textarea name="bio" rows="4" maxlength="500">${escapeHtml(profile.bio || '')}</textarea></label>
        <label>Skills Tags (comma-separated)<input name="skillsInterests" value="${escapeAttr((profile.skillsInterests || []).join(', '))}" /></label>
        <button class="pill-btn" id="save-profile-hub-btn" type="submit" ${state.profileHub.saving ? 'disabled' : ''}>${state.profileHub.saving ? 'Saving Profile...' : 'Save Profile'}</button>
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

function setAuthSession({ sessionToken, user }) {
  state.authToken = sessionToken;
  state.currentUser = user;
  localStorage.setItem('wsg-auth-token', sessionToken);
  console.log('[auth:frontend] session token saved', {
    hasSessionToken: Boolean(sessionToken),
    userId: user?.id || null,
    email: user?.email || null,
  });
}

function clearAuthSession() {
  state.authToken = '';
  state.currentUser = null;
  localStorage.removeItem('wsg-auth-token');
}

async function bootstrapAuth() {
  if (!state.authToken) {
    return;
  }

  try {
    const data = await apiRequest('/auth/me');
    state.currentUser = data.user;
    console.log('[auth:frontend] bootstrap /auth/me success', { userId: data?.user?.id, email: data?.user?.email });
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
    return;
  }
  state.directChat.loading = true;
  state.directChat.error = '';
  try {
    const data = await apiRequest(`/chats/direct/${connectionId}`);
    state.directChat.activeConnectionId = connectionId;
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
    state.activeProfile = state.currentUser;
    console.log('[profile:frontend] profile route load success', {
      path,
      hasCurrentUser: Boolean(state.currentUser),
      userId: state.currentUser?.id || null,
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
  const known = routes[path] || (path.startsWith('/members/') ? { key: 'profile', requiresAuth: true } : null);
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
  const saveButton = document.getElementById('save-profile-hub-btn');
  const profileHubForm = document.getElementById('profile-hub-form');
  if (saveButton && profileHubForm) {
    profileHubForm.onsubmit = async (event) => {
      event.preventDefault();
      if (state.profileHub.saving) return;
      const formData = new FormData(profileHubForm);
      const payload = {
        legalName: String(formData.get('legalName') || state.currentUser?.legalName || ''),
        displayName: String(formData.get('displayName') || state.currentUser?.displayName || ''),
        email: String(formData.get('email') || state.currentUser?.email || ''),
        role: String(formData.get('role') || state.currentUser?.role || ''),
        organizationName: String(formData.get('organizationName') || state.currentUser?.organizationName || ''),
        bio: String(formData.get('bio') || state.currentUser?.bio || ''),
        skillsInterests: String(formData.get('skillsInterests') || (state.currentUser?.skillsInterests || []).join(', ')),
      };
      state.profileHub.saving = true;
      setProfileHubMessage('Saving profile...', 'info');
      render();
      try {
        const result = await apiRequest('/profile/hub', { method: 'PATCH', body: JSON.stringify(payload) });
        state.currentUser = result.profile;
        state.activeProfile = result.profile;
        console.log('[profile:frontend] profile save success', { userId: result?.profile?.id, email: result?.profile?.email });
        setProfileHubMessage('Profile saved successfully.', 'success');
        setStatusMessage('Profile saved successfully.', 'success');
      } catch (error) {
        const message = 'Unable to save profile right now.';
        console.warn('[profile:frontend] profile save failure', {
          userId: state.currentUser?.id,
          error: error instanceof Error ? error.message : String(error),
        });
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

  document.querySelectorAll('.add-connection-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const connectionId = button.getAttribute('data-connection-id');
      if (!connectionId) return;
      try {
        await apiRequest(`/connections/${connectionId}`, { method: 'POST' });
        await loadConnections();
        await searchConnectionCandidates(state.network.searchTerm);
        setStatusMessage('Connection added.', 'success');
        render();
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : 'Failed to add connection.', 'error');
      }
    });
  });

  document.querySelectorAll('.remove-connection-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const connectionId = button.getAttribute('data-connection-id');
      if (!connectionId) return;
      try {
        await apiRequest(`/connections/${connectionId}`, { method: 'DELETE' });
        await loadConnections();
        await searchConnectionCandidates(state.network.searchTerm);
        if (state.directChat.activeConnectionId === connectionId) {
          state.directChat.activeConnectionId = '';
          state.directChat.messages = [];
        }
        setStatusMessage('Connection removed.', 'success');
        render();
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : 'Failed to remove connection.', 'error');
      }
    });
  });

  document.querySelectorAll('.open-direct-chat-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const connectionId = button.getAttribute('data-connection-id');
      await loadDirectChat(connectionId);
      render();
    });
  });

  const directChatForm = document.getElementById('direct-chat-form');
  if (directChatForm) {
    directChatForm.onsubmit = async (event) => {
      event.preventDefault();
      if (!state.directChat.activeConnectionId) return;
      const input = document.getElementById('direct-chat-input');
      const content = String(input?.value || '').trim();
      if (!content) return;
      try {
        await apiRequest(`/chats/direct/${state.directChat.activeConnectionId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content }),
        });
        if (input) input.value = '';
        await loadDirectChat(state.directChat.activeConnectionId);
        render();
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : 'Chat unavailable.', 'error');
      }
    };
  }

  const scenarioForm = document.getElementById('scenario-chat-form');
  if (scenarioForm) {
    scenarioForm.onsubmit = async (event) => {
      event.preventDefault();
      const input = document.getElementById('scenario-chat-input');
      const content = String(input?.value || '').trim();
      if (!content) return;
      await apiRequest('/chats/scenario/messages', { method: 'POST', body: JSON.stringify({ scenarioId: state.scenarioChat.scenarioId, content }) });
      if (input) input.value = '';
      await loadScenarioChat();
      setStatusMessage('Scenario chat opened.', 'success');
      render();
    };
  }

  const areaForm = document.getElementById('area-chat-form');
  if (areaForm) {
    areaForm.onsubmit = async (event) => {
      event.preventDefault();
      const input = document.getElementById('area-chat-input');
      const content = String(input?.value || '').trim();
      if (!content) return;
      await apiRequest('/chats/area/messages', { method: 'POST', body: JSON.stringify({ areaId: state.areaChat.areaId, content }) });
      if (input) input.value = '';
      await loadAreaChat();
      setStatusMessage('Area chat opened.', 'success');
      render();
    };
  }

  const openScenarioChat = document.getElementById('open-scenario-chat');
  if (openScenarioChat) {
    openScenarioChat.addEventListener('click', () => setStatusMessage('Scenario chat opened.', 'success'));
  }
  const openAreaChat = document.getElementById('open-area-chat');
  if (openAreaChat) {
    openAreaChat.addEventListener('click', () => setStatusMessage('Area chat opened.', 'success'));
  }
}

function starterScenarioModalMarkup() {
  if (!state.onboarding.starterModalOpen) {
    return '';
  }
  const starterTrial = STARTER_TRIALS[0];
  return `
    <div class="modal-overlay" role="presentation">
      <section class="onboarding-modal card" role="dialog" aria-modal="true" aria-labelledby="starter-scenario-title">
        <h3 id="starter-scenario-title">Welcome to your first Trial</h3>
        <p class="muted">Your account is ready. Start with this guided scenario to begin onboarding.</p>
        <article class="feature">
          <p class="muted" style="margin:0 0 6px;">Starter Scenario · ${escapeHtml(starterTrial.category)} · ${escapeHtml(starterTrial.difficulty)}</p>
          <h4 style="margin:0 0 8px;">${escapeHtml(starterTrial.title)}</h4>
          <p style="margin:0;">${escapeHtml(starterTrial.description)}</p>
        </article>
        <div class="actions" style="margin-top:14px;">
          <button class="pill-btn cta-primary" id="start-starter-scenario" data-trial-id="${escapeAttr(starterTrial.id)}">Start Scenario</button>
          <button class="pill-btn" id="close-starter-scenario">Continue Later</button>
        </div>
      </section>
    </div>
  `;
}

function attachOnboardingHandlers() {
  const startButton = document.getElementById('start-starter-scenario');
  if (startButton) {
    startButton.onclick = () => {
      const starterTrialId = startButton.getAttribute('data-trial-id');
      const selectedTrial = STARTER_TRIALS.find((trial) => trial.id === starterTrialId) || STARTER_TRIALS[0];
      state.arena.activeTrialId = selectedTrial.id;
      state.arena.messages = [{ id: crypto.randomUUID(), type: 'system', content: selectedTrial.openingPrompt }];
      state.onboarding.starterModalOpen = false;
      markStarterScenarioSeen();
      setStatusMessage('Starter scenario loaded. Entering Trial Arena…', 'success');
      location.hash = '/arena';
    };
  }

  const closeButton = document.getElementById('close-starter-scenario');
  if (closeButton) {
    closeButton.onclick = () => {
      state.onboarding.starterModalOpen = false;
      markStarterScenarioSeen();
      setStatusMessage('Starter scenario ready when you are.', 'info');
      render();
    };
  }
}

function attachHeaderActions() {
  const professionalButton = document.getElementById('professional-mode');
  if (professionalButton) {
    professionalButton.onclick = () => setMode('professional');
  }

  const roleplayButton = document.getElementById('roleplay-mode');
  if (roleplayButton) {
    roleplayButton.onclick = () => setMode('roleplay');
  }

  const logoutButton = document.getElementById('logout-btn');
  if (logoutButton) {
    logoutButton.onclick = async () => {
      try {
        await apiRequest('/auth/logout', { method: 'POST' });
      } catch {
        // noop
      }
      clearAuthSession();
      state.membersLoaded = false;
      location.hash = '/login';
    };
  }

}

function attachArenaHandlers() {
  const startButtons = document.querySelectorAll('.start-trial-btn');
  if (!startButtons.length) {
    return;
  }

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
        state.arena.error = error instanceof Error ? error.message : 'AI chat request failed.';
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

function setMode(nextMode) {
  state.mode = nextMode;
  localStorage.setItem('wsg-mode', state.mode);
  render();
}

function renderLayout(path, key, pageHtml) {
  const [title, subtitle] = pageTitle(key);
  document.body.classList.toggle('mode-roleplay', state.mode === 'roleplay');
  const hideDefaultHeader = key === 'home';

  const statusMarkup = state.statusMessage
    ? `<p class="status-banner status-${state.statusMessage.tone}" role="status">${escapeHtml(state.statusMessage.message)}</p>`
    : '';

  document.getElementById('app').innerHTML = `
    <div class="app-shell">
      <header class="header panel">
        <div class="brand">
          <div class="brand-logo">WS</div>
          <div>
            <div class="title">Wyked Samurai</div>
            <div class="subtitle">Guild Platform Prototype</div>
          </div>
        </div>
        <div class="header-actions">
          <div class="toggle">
            <button id="professional-mode" class="${state.mode === 'professional' ? 'active' : ''}">Professional</button>
            <button id="roleplay-mode" class="${state.mode === 'roleplay' ? 'active' : ''}">Roleplay</button>
          </div>
          ${state.currentUser ? `<span class="muted">${state.currentUser.displayName}</span><button class="pill-btn" id="logout-btn">Log out</button>` : '<a class="pill-btn" href="#/login">Log in</a>'}
        </div>
      </header>

      <aside class="left-sidebar panel">
        <div class="muted">Navigation</div>
        <ul class="nav-list">
          ${navItems.map(([label, target]) => `<li><a href="${linkFor(target)}" class="${path === target ? 'active' : ''}">${label}</a></li>`).join('')}
        </ul>
      </aside>

      <main class="main-content panel">
        ${hideDefaultHeader ? '' : `
          <section class="main-header">
            <h1>${title}</h1>
            <p>${subtitle}</p>
          </section>
        `}
        ${statusMarkup}
        <section style="margin-top:${hideDefaultHeader ? '0' : '14px'};">${pageHtml}</section>
      </main>

      <aside class="right-sidebar panel">${rightSidebar()}</aside>
    </div>
    ${starterScenarioModalMarkup()}
  `;

  attachHeaderActions();
  attachOnboardingHandlers();
}

function renderPublicLayout(path, key, pageHtml) {
  const [title, subtitle] = pageTitle(key);
  document.body.classList.toggle('mode-roleplay', state.mode === 'roleplay');
  const showPageHeader = key !== 'landing';

  const statusMarkup = state.statusMessage
    ? `<p class="status-banner status-${state.statusMessage.tone}" role="status">${escapeHtml(state.statusMessage.message)}</p>`
    : '';

  document.getElementById('app').innerHTML = `
    <div class="public-shell">
      <header class="public-header panel">
        <div class="public-container public-header-inner">
          <div class="brand">
            <div class="brand-logo">WS</div>
            <div>
              <div class="title">Wyked Samurai Guild</div>
              <div class="subtitle">Guild Platform Prototype</div>
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
  if (['/profile', '/arena', '/recruiter-console', '/profile/direct-chat'].includes(path)) {
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
    profileEdit: profileEditPage,
    login: loginPage,
    signup: signupPage,
    recruiter: recruiterPage,
    fallback: fallbackPage,
  }[route.key]();

  if (route.key === 'landing' || route.key === 'login' || route.key === 'signup') {
    renderPublicLayout(path, route.key, pageHtml);
  } else {
    renderLayout(path, route.key, pageHtml);
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
        const result = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
        console.log('[auth:frontend] login server response', result);
        setAuthSession(result);
        console.log('[auth:frontend] login success', { userId: result?.user?.id, email: result?.user?.email });
        setFormMessage('login', 'Login successful.', 'success');
        setStatusMessage('Login successful.', 'success');
        state.membersLoaded = false;
        setTimeout(() => {
          location.hash = '/profile';
        }, 200);
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
  attachHomeChatHandlers();
  console.log('[wsg] render complete');
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', async () => {
  const resolvedApiBaseUrl = resolveApiBaseUrl();
  console.log('[wsg] Resolved API base URL:', resolvedApiBaseUrl || '(same-origin)');
  await bootstrapAuth();
  render();
});

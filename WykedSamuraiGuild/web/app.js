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
  ai: {
    label: 'AI Connection',
    run: checkHuggingFaceConnection,
  },
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
    profile: ['Profile Hub', 'Your authenticated command center for profile, modes, network, and chat.'],
    directChat: ['Direct Chat', 'One-to-one chat with your Connections.'],
    scenarioChat: ['Scenario Chat', 'Guided roleplay communications tied to a scenario.'],
    areaChat: ['Area Chat', 'Shared roleplay room chat for your current area.'],
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
  const networkItems = state.network.connections.slice(0, 5).map((connection) => `<span>${escapeHtml(connection.displayName || connection.username)}</span><span class="muted">Connected</span>`);
  return `
    ${card('Connections', list(networkItems.length ? networkItems : ['<span>No active connections yet.</span><span class="muted">Build your network</span>']))}
    ${card('Messaging Presence', '<p class="muted">Direct chats are available from Profile Hub. Roleplay channels are in Scenario/Area chat.</p>')}
    ${card('AI Connection', '<button id="check-ai-connection" class="pill-btn">Check Hugging Face</button><p id="ai-connection-result" class="muted" style="margin-top:8px;">Waiting for check.</p>')}
  `;
}

function homePage() {
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

  return `
    <div class="grid two">
      ${card('Recommended Scenarios', list(['Shadow Market Negotiation', 'Supply Chain Siege', 'Cross-Guild Accord'].map((s) => `<span>${s}</span><span class="muted">Match 92%</span>`)))}
      ${card('Recent Roleplay', list(['Moonlit reconnaissance thread', 'Dojo council session', 'Nexus summit debrief'].map((s) => `<span>${s}</span><span class="muted">12m ago</span>`)))}
    </div>

    <section class="card home-chat-panel" style="margin-top:14px;">
      <h3>AI Chat</h3>
      <p class="muted">Ask for coaching, roleplay prompts, or tactical recommendations.</p>
      <div id="home-chat-log" class="conversation-log home-chat-log">
        ${chatMessages || '<p class="muted">No messages yet. Send one to begin.</p>'}
      </div>
      <form id="home-chat-form" class="arena-input" style="margin-top:10px;">
        <input id="home-chat-input" name="message" placeholder="Type your message..." ${state.homeChat.pending ? 'disabled' : ''} />
        <button class="pill-btn" type="submit" ${state.homeChat.pending ? 'disabled' : ''}>${state.homeChat.pending ? 'Sending...' : 'Send'}</button>
      </form>
      ${state.homeChat.error ? `<p class="muted" style="color:#ff7b7b;margin-top:8px;" role="alert">${escapeHtml(state.homeChat.error)}</p>` : ''}
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

  return `
    <section class="arena-layout">
      <aside class="arena-panel arena-trials card">
        <h3>Starter Trial Library</h3>
        <p class="muted">Select one of five starter Trials to initialize the Arena session.</p>
        <div class="trial-list">
          ${STARTER_TRIALS.map(
            (trial) => `
              <article class="trial-card ${trial.id === state.arena.activeTrialId ? 'active' : ''}">
                <h4>${trial.title}</h4>
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
      </aside>

      <section class="arena-panel arena-conversation card">
        <h3>Conversation Console</h3>
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

      <aside class="arena-panel arena-status card">
        <h3>Trial Status</h3>
        ${
          hasActiveTrial
            ? `
              <ul class="status-list">
                <li><span class="muted">Title</span><strong>${activeTrial.title}</strong></li>
                <li><span class="muted">Category</span><strong>${activeTrial.category}</strong></li>
                <li><span class="muted">Difficulty</span><strong>${activeTrial.difficulty}</strong></li>
                <li><span class="muted">Suggested Role</span><strong>${activeTrial.suggestedRole || 'Unspecified'}</strong></li>
                <li><span class="muted">Pressure State</span><strong>Stable (placeholder)</strong></li>
                <li><span class="muted">NPCs</span><strong>Stakeholder A, Stakeholder B (placeholder)</strong></li>
              </ul>
            `
            : '<p class="muted">No active Trial yet. Status details will populate after you start one.</p>'
        }
      </aside>
    </section>
  `;
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

  const recruiterVisible = profile.role === 'recruiter' || profile.role === 'employer';
  const connectionRows = state.network.connections.length
    ? state.network.connections.map((connection) => `
        <li>
          <div>
            <strong>${escapeHtml(connection.displayName || connection.username)}</strong>
            <p class="muted" style="margin:4px 0 0;">${escapeHtml(connection.role || 'member')} · ${escapeHtml(connection.organizationName || 'No guild listed')}</p>
          </div>
          <div class="actions">
            <button class="pill-btn open-direct-chat-btn" data-connection-id="${escapeAttr(connection.id)}">Chat</button>
            <button class="pill-btn remove-connection-btn" data-connection-id="${escapeAttr(connection.id)}">Remove Connection</button>
          </div>
        </li>
      `).join('')
    : '<li><span class="muted">No Connections yet. Search members and add your first connection.</span></li>';

  const candidateRows = state.network.results.length
    ? state.network.results.map((member) => `
        <li>
          <div>
            <strong>${escapeHtml(member.displayName || member.username)}</strong>
            <p class="muted" style="margin:4px 0 0;">${escapeHtml(member.role || 'member')} · ${escapeHtml(member.organizationName || 'No guild listed')}</p>
          </div>
          <div class="actions">
            ${member.isConnected
    ? '<span class="muted">Connected</span>'
    : `<button class="pill-btn add-connection-btn" data-connection-id="${escapeAttr(member.id)}">Add Connection</button>`}
          </div>
        </li>
      `).join('')
    : '<li><span class="muted">Search for users by name, role, or guild to build your network.</span></li>';

  const directChatMessages = state.directChat.messages
    .map((message) => `
      <article class="message ${message.senderId === state.currentUser?.id ? 'user' : 'system'}">
        <div class="message-label">${message.senderId === state.currentUser?.id ? 'You' : 'Connection'}</div>
        <p>${escapeHtml(message.content)}</p>
      </article>
    `).join('');

  return `
    <section class="feature profile-head profile-hub-head">
      <div class="profile-summary-row">
        ${avatarMarkup(profile, 'lg')}
        <div>
          <h3 style="margin:0;">${escapeHtml(profile.displayName)}</h3>
          <p class="muted" style="margin:4px 0;">@${escapeHtml(profile.username)}</p>
          <p class="muted" style="margin:0;">${escapeHtml(profile.role || 'member')} · ${escapeHtml(profile.organizationName || 'Independent')}</p>
        </div>
      </div>
      <div class="actions"></div>
    </section>
    <section class="profile-hub-grid" style="margin-top:14px;">
      <div class="profile-hub-col">
        <section class="card">
          <h3>Profile Setup</h3>
          <form id="profile-hub-form" class="form-stack">
            <p id="profile-hub-feedback" class="status-banner ${state.profileHub.message ? `status-${state.profileHub.tone}` : 'status-info'}" role="alert" aria-live="assertive">${escapeHtml(state.profileHub.message || 'Update and save your profile details here.')}</p>
            <label>Legal Name<input name="legalName" value="${escapeAttr(profile.legalName || '')}" required /></label>
            <label>Display Name<input name="displayName" value="${escapeAttr(profile.displayName || '')}" required /></label>
            <label>Email<input type="email" name="email" value="${escapeAttr(profile.email || '')}" required /></label>
            <label>Role
              <select name="role">
                <option value="employee_member" ${profile.role === 'employee_member' ? 'selected' : ''}>Employee / Member</option>
                <option value="employer" ${profile.role === 'employer' ? 'selected' : ''}>Employer</option>
                <option value="recruiter" ${profile.role === 'recruiter' ? 'selected' : ''}>Recruiter</option>
              </select>
            </label>
            <label>Organization / Guild Name<input name="organizationName" value="${escapeAttr(profile.organizationName || '')}" /></label>
            <label>Bio / About<textarea name="bio" rows="4" maxlength="500">${escapeHtml(profile.bio || '')}</textarea></label>
            <label>Skills / Interests (comma-separated)<input name="skillsInterests" value="${escapeAttr((profile.skillsInterests || []).join(', '))}" /></label>
            <button class="pill-btn" id="save-profile-hub-btn" type="submit" ${state.profileHub.saving ? 'disabled' : ''}>${state.profileHub.saving ? 'Saving Profile...' : 'Save Profile'}</button>
          </form>
          <p class="muted">Trials completed: ${profile.trialCount} · Last active: ${formatDate(profile.lastActiveAt)}</p>
        </section>
        <section class="card">
          <h3>Choose Your Mode</h3>
          <div class="grid two">
            <a class="pill-btn mode-nav-btn" href="#/app" data-mode="professional">Professional Mode</a>
            <a class="pill-btn mode-nav-btn" href="#/arena" data-mode="roleplay">Roleplay Mode</a>
            ${recruiterVisible ? '<a class="pill-btn" href="#/recruiter-console">Recruiter / Employer Mode</a>' : ''}
          </div>
        </section>
      </div>
      <div class="profile-hub-col">
        <section class="card">
          <h3>Connections Network</h3>
          <form id="connection-search-form" class="actions" style="margin-bottom:10px;">
            <input id="connection-search-input" placeholder="Search members..." value="${escapeAttr(state.network.searchTerm)}" />
            <button class="pill-btn" type="submit">Search Network</button>
          </form>
          <h4>Browse Members</h4>
          <ul class="list compact-list">${candidateRows}</ul>
          <h4 style="margin-top:12px;">Current Connections</h4>
          <ul class="list compact-list">${connectionRows}</ul>
        </section>
        <section class="card">
          <h3>Direct Chat</h3>
          <p class="muted">Select a connection to open chat.</p>
          <div id="direct-chat-log" class="conversation-log home-chat-log">
            ${state.directChat.activeConnectionId
    ? (directChatMessages || '<p class="muted">No messages yet in this conversation.</p>')
    : '<p class="muted">No conversation selected.</p>'}
          </div>
          <form id="direct-chat-form" class="arena-input" style="margin-top:10px;">
            <input id="direct-chat-input" placeholder="Type a direct message..." ${state.directChat.activeConnectionId ? '' : 'disabled'} />
            <button class="pill-btn" type="submit" ${state.directChat.activeConnectionId ? '' : 'disabled'}>Send</button>
          </form>
        </section>
      </div>
      <div class="profile-hub-col">
        <section class="card">
          <h3>Roleplay Communications</h3>
          <p class="muted">Choose your roleplay communication channel.</p>
          <div class="actions">
            <a class="pill-btn" href="#/profile/scenario-chat" id="open-scenario-chat">Scenario Chat</a>
            <a class="pill-btn" href="#/profile/area-chat" id="open-area-chat">Area Chat</a>
          </div>
          <p class="muted" style="margin-top:10px;">Scenario Chat is tied to guided RP trials. Area Chat is tied to shared rooms.</p>
        </section>
        <section class="card">
          <h3>Status Panel</h3>
          <p class="muted">Joined: ${formatDate(profile.createdAt)}</p>
          <p class="muted">Updated: ${formatDate(profile.updatedAt)}</p>
          <p class="muted">Connection count: ${state.network.connections.length}</p>
        </section>
      </div>
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
        <a class="pill-btn" href="#/profile">Back to Profile Hub</a>
      </div>
    </section>
  `;
}

function directChatPage() {
  return `
    <section class="card">
      <h3>Direct Chat</h3>
      <p class="muted">Use the Profile Hub Connections section to select a user and open direct chat.</p>
      <a class="pill-btn" href="#/profile">Back to Profile Hub</a>
    </section>
  `;
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
  return `
    <section class="card form-card">
      <h3>Log in</h3>
      <p class="muted">Note: accounts are currently stored in volatile in-memory server storage and may reset when the backend restarts.</p>
      <form id="login-form" class="form-stack">
        <p id="login-feedback" class="status-banner ${state.authForms.login.message ? `status-${state.authForms.login.tone}` : 'status-info'}" role="alert" aria-live="assertive">${escapeHtml(state.authForms.login.message || 'Enter your account email and password to sign in.')}</p>
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
  return `
    <section class="card form-card">
      <h3>Create account</h3>
      <p class="muted">Use your legal identity details so employers and recruiters can verify your profile.</p>
      <p class="muted">Storage note: account records currently use in-memory backend storage for this environment.</p>
      <form id="signup-form" class="form-stack">
        <p id="signup-feedback" class="status-banner ${state.authForms.signup.message ? `status-${state.authForms.signup.tone}` : 'status-info'}" role="alert" aria-live="assertive">${escapeHtml(state.authForms.signup.message || 'Complete all required fields to create your account.')}</p>
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
  return card('Recruiter Console', '<p class="muted">Recruiter workflows are intentionally out of scope for this phase.</p>');
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
  if (message.toLowerCase().includes('network error')) {
    return fallback;
  }
  if (message.toLowerCase().includes('invalid credentials')) {
    return 'Invalid email or password.';
  }
  return fallback;
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
        legalName: String(formData.get('legalName') || ''),
        displayName: String(formData.get('displayName') || ''),
        email: String(formData.get('email') || ''),
        role: String(formData.get('role') || ''),
        organizationName: String(formData.get('organizationName') || ''),
        bio: String(formData.get('bio') || ''),
        skillsInterests: String(formData.get('skillsInterests') || ''),
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
  document.getElementById('professional-mode').onclick = () => setMode('professional');
  document.getElementById('roleplay-mode').onclick = () => setMode('roleplay');

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

  const healthButton = document.getElementById('check-ai-connection');
  if (healthButton) {
    healthButton.onclick = async () => {
      const result = document.getElementById('ai-connection-result');
      result.textContent = 'Checking...';
      try {
        const data = await connectionChecks.ai.run();
        const backendStatus = typeof data?.backend === 'string' ? data.backend : 'unknown';
        const provider = typeof data?.provider === 'string' ? data.provider : 'unknown';
        const model = typeof data?.model === 'string' && data.model.trim() ? data.model.trim() : 'n/a';
        const reason = typeof data?.reason === 'string' && data.reason.trim() ? data.reason.trim() : null;
        const timestamp = typeof data?.timestamp === 'string' && !Number.isNaN(Date.parse(data.timestamp))
          ? new Date(data.timestamp).toLocaleString()
          : 'unknown time';

        const reasonSuffix = reason ? ` · reason ${reason}` : '';
        result.textContent = `${connectionChecks.ai.label}: backend ${backendStatus} · provider ${provider} · model ${model}${reasonSuffix} via ${apiUrl(AI_ENDPOINTS.test)} @ ${timestamp}`;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown health check error.';
        result.textContent = `${connectionChecks.ai.label} error: ${message}`;
      }
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
        <section class="main-header">
          <h1>${title}</h1>
          <p>${subtitle}</p>
        </section>
        ${statusMarkup}
        <section style="margin-top:14px;">${pageHtml}</section>
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
  if (path === '/profile') {
    await loadConnections();
    await searchConnectionCandidates(state.network.searchTerm || '');
  }
  if (path === '/profile/scenario-chat') {
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
        setAuthSession(result);
        console.log('[auth:frontend] login success', { userId: result?.user?.id, email: result?.user?.email });
        setFormMessage('login', 'Login successful.', 'success');
        setStatusMessage('Login successful.', 'success');
        state.membersLoaded = false;
        setTimeout(() => {
          location.hash = '/profile';
        }, 200);
      } catch (error) {
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
        setAuthSession(result);
        console.log('[auth:frontend] signup success', { userId: result?.user?.id, email: result?.user?.email });
        rememberNewUserForOnboarding(result?.user?.id);
        setFormMessage('signup', 'Account created successfully.', 'success');
        setStatusMessage('Account created successfully. Redirecting to profile setup…', 'success');
        state.membersLoaded = false;
        location.hash = '/profile';
      } catch (error) {
        const errorText = error instanceof Error ? error.message : 'Unknown error.';
        const message = errorText.toLowerCase().includes('already in use')
          ? 'This email is already in use.'
          : 'Unable to create account. Please check the form and try again.';
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
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', async () => {
  const resolvedApiBaseUrl = resolveApiBaseUrl();
  console.log('[wsg] Resolved API base URL:', resolvedApiBaseUrl || '(same-origin)');
  await bootstrapAuth();
  render();
});

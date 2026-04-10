const routes = {
  '/': { key: 'home' },
  '/arena': { key: 'arena', requiresAuth: true },
  '/guild-world': { key: 'guild' },
  '/members': { key: 'members' },
  '/profile': { key: 'profile', requiresAuth: true },
  '/profile/edit': { key: 'profileEdit', requiresAuth: true },
  '/login': { key: 'login', guestOnly: true },
  '/signup': { key: 'signup', guestOnly: true },
  '/recruiter-console': { key: 'recruiter' },
};

const navItems = [
  ['Home', '/'],
  ['Arena', '/arena'],
  ['Guild', '/guild-world'],
  ['Members', '/members'],
  ['My Profile', '/profile'],
  ['Recruiter Console', '/recruiter-console'],
];

const mock = {
  friends: ['Aiko', 'Maverick', 'ShinobiRae', 'Devon', 'Kuma'],
  chats: ['Arena squad sync', 'Guild storytellers', 'Recruiter outreach', 'Mission planning'],
};

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
  membersLoaded: false,
  loading: false,
  arena: {
    activeTrialId: '',
    messages: [],
  },
};

const RENDER_BACKEND_BASE_URL = 'https://wyked-samurai-backend.onrender.com';
const BACKEND_BASE_URL_CONFIG_KEY = 'wsg-backend-base-url';

function linkFor(path) {
  return `#${path}`;
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
    return (renderConfiguredBase || RENDER_BACKEND_BASE_URL).replace(/\/$/, '');
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
    return '';
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
  return apiRequest('/ai/test', {
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

  const data = await apiRequest('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const generated = data?.scenario;
  if (!generated) {
    throw new Error('AI scenario response is missing scenario data.');
  }

  return generated.openingSituation || generated.premise || generated.title;
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
    home: ['Welcome to Wyked Samurai Guild', 'Your command center for tactical collaboration and growth.'],
    arena: ['Trial Arena', 'Run starter leadership Trials and prepare for live simulation loops.'],
    guild: ['Guild World', 'Story streams, locations, and social immersion in one space.'],
    members: ['Guild Members', 'Discover member profiles and current contribution footprint.'],
    profile: ['Member Profile', 'Identity snapshot and profile scaffolding for trial records.'],
    profileEdit: ['Edit Profile', 'Update your guild identity details.'],
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

function rightSidebar() {
  return `
    ${card('Friends Online', list(mock.friends.map((f) => `<span>${f}</span><span class="muted">Available</span>`)))}
    ${card('Search / Start Chat', '<input style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--panel-soft);color:var(--text-main)" placeholder="Search member or recruiter..."/>')}
    ${card('Recent Chats', list(mock.chats.map((c) => `<span>${c}</span><span class="muted">Now</span>`)))}
    ${card('Messaging Presence', '<p class="muted">Recruiters online: 3 · Members online: 41 · Response SLA: 2m</p>')}
    ${card('AI Connection', '<button id="check-ai-connection" class="pill-btn">Check Hugging Face</button><p id="ai-connection-result" class="muted" style="margin-top:8px;">Waiting for check.</p>')}
  `;
}

function homePage() {
  return `
    <div class="grid two">
      ${card('Recommended Scenarios', list(['Shadow Market Negotiation', 'Supply Chain Siege', 'Cross-Guild Accord'].map((s) => `<span>${s}</span><span class="muted">Match 92%</span>`)))}
      ${card('Recent Roleplay', list(['Moonlit reconnaissance thread', 'Dojo council session', 'Nexus summit debrief'].map((s) => `<span>${s}</span><span class="muted">12m ago</span>`)))}
    </div>
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
          <button class="pill-btn" type="submit" ${hasActiveTrial ? '' : 'disabled'}>Send</button>
        </form>
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
  const profile = state.activeProfile;
  if (!profile) {
    return card('Profile', '<p class="muted">Profile not found.</p>');
  }

  const isOwnProfile = state.currentUser?.id === profile.id;

  return `
    <section class="feature profile-head">
      ${avatarMarkup(profile, 'lg')}
      <div>
        <h3 style="margin:0;">${profile.displayName}</h3>
        <p class="muted" style="margin:4px 0;">@${profile.username}</p>
        <p>${profile.bio || '<span class="muted">No bio added yet.</span>'}</p>
      </div>
      ${isOwnProfile ? '<a href="#/profile/edit" class="pill-btn">Edit Profile</a>' : ''}
    </section>
    <div class="grid two" style="margin-top:14px;">
      ${card('Stats', `<p>Trials completed: <strong>${profile.trialCount}</strong></p><p class="muted">Last active: ${formatDate(profile.lastActiveAt)}</p>`)}
      ${card('Account', `<p class="muted">Joined: ${formatDate(profile.createdAt)}</p><p class="muted">Updated: ${formatDate(profile.updatedAt)}</p>`)}
    </div>
    <div class="grid two" style="margin-top:14px;">
      ${card('Saved Trial Results', '<p class="muted">No trial results yet. This section is ready for Phase 3 data binding.</p>')}
      ${card('Recent Activity', '<p class="muted">No recent activity yet. Activity stream scaffolding is in place.</p>')}
    </div>
  `;
}

function profileEditPage() {
  const profile = state.currentUser;
  if (!profile) {
    return card('Profile', '<p class="muted">Please log in first.</p>');
  }

  return `
    <section class="card form-card">
      <h3>Edit profile</h3>
      <form id="edit-profile-form" class="form-stack">
        <label>Display name
          <input name="displayName" maxlength="60" value="${profile.displayName || ''}" required />
        </label>
        <label>Avatar URL
          <input name="avatarUrl" type="url" placeholder="https://..." value="${profile.avatarUrl || ''}" />
        </label>
        <label>Bio
          <textarea name="bio" maxlength="280" rows="4" placeholder="Tell the guild about your strengths...">${profile.bio || ''}</textarea>
        </label>
        <div class="actions">
          <button class="pill-btn" type="submit">Save changes</button>
          <a href="#/profile" class="pill-btn">Cancel</a>
        </div>
        <p id="edit-profile-feedback" class="muted"></p>
      </form>
    </section>
  `;
}

function loginPage() {
  return `
    <section class="card form-card">
      <h3>Log in</h3>
      <form id="login-form" class="form-stack">
        <label>Username or email
          <input name="identifier" required />
        </label>
        <label>Password
          <input name="password" type="password" minlength="8" required />
        </label>
        <button class="pill-btn" type="submit">Log in</button>
        <p id="login-feedback" class="muted"></p>
      </form>
      <p class="muted">New here? <a href="#/signup">Create an account.</a></p>
    </section>
  `;
}

function signupPage() {
  return `
    <section class="card form-card">
      <h3>Create account</h3>
      <form id="signup-form" class="form-stack">
        <label>Username
          <input name="username" minlength="3" required />
        </label>
        <label>Display name
          <input name="displayName" required />
        </label>
        <label>Email (optional)
          <input name="email" type="email" />
        </label>
        <label>Password
          <input name="password" type="password" minlength="8" required />
        </label>
        <button class="pill-btn" type="submit">Sign up</button>
        <p id="signup-feedback" class="muted"></p>
      </form>
      <p class="muted">Already have an account? <a href="#/login">Log in.</a></p>
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
  } catch {
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

async function loadProfileForRoute(path) {
  if (path === '/profile') {
    state.activeProfile = state.currentUser;
    return;
  }

  const match = path.match(/^\/members\/([a-fA-F0-9-]+)$/);
  if (!match) {
    return;
  }

  try {
    const data = await apiRequest(`/members/${match[1]}`);
    state.activeProfile = data.profile;
  } catch {
    state.activeProfile = null;
  }
}

function applyRouteGuards(path) {
  const known = routes[path] || (path.startsWith('/members/') ? { key: 'profile' } : null);
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

async function handleAuthSubmit(formId, endpoint, feedbackId, mapPayload) {
  const form = document.getElementById(formId);
  if (!form) {
    return;
  }

  form.onsubmit = async (event) => {
    event.preventDefault();
    const feedback = document.getElementById(feedbackId);
    const formData = new FormData(form);
    const payload = mapPayload(formData);

    feedback.textContent = 'Submitting...';
    try {
      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setAuthSession(result);
      feedback.textContent = 'Success. Redirecting...';
      state.membersLoaded = false;
      location.hash = '/profile';
    } catch (error) {
      feedback.textContent = error.message;
    }
  };
}

function attachProfileEditHandler() {
  const form = document.getElementById('edit-profile-form');
  if (!form) {
    return;
  }

  form.onsubmit = async (event) => {
    event.preventDefault();
    const feedback = document.getElementById('edit-profile-feedback');
    const formData = new FormData(form);
    const payload = {
      displayName: String(formData.get('displayName') || ''),
      avatarUrl: String(formData.get('avatarUrl') || ''),
      bio: String(formData.get('bio') || ''),
    };

    feedback.textContent = 'Saving...';

    try {
      const result = await apiRequest('/profile/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      state.currentUser = result.profile;
      state.activeProfile = result.profile;
      state.membersLoaded = false;
      feedback.textContent = 'Profile updated.';
      location.hash = '/profile';
    } catch (error) {
      feedback.textContent = error.message;
    }
  };
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
        result.textContent = `${connectionChecks.ai.label}: backend ${backendStatus} · provider ${provider} · model ${model}${reasonSuffix} via ${apiUrl('/ai/test')} @ ${timestamp}`;
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

      state.arena.messages.push({ id: crypto.randomUUID(), type: 'user', content: value });
      const activeTrial = getActiveTrial();
      if (!activeTrial) {
        state.arena.messages.push({
          id: crypto.randomUUID(),
          type: 'system',
          content: 'No active trial found.',
        });
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
        state.arena.messages.push({
          id: crypto.randomUUID(),
          type: 'system',
          content: 'AI response unavailable right now. Please try again.',
        });
      }
      render();
    };
  }

  const chatLog = document.getElementById('arena-conversation-log');
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
        <section style="margin-top:14px;">${pageHtml}</section>
      </main>

      <aside class="right-sidebar panel">${rightSidebar()}</aside>
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

  const route = routes[path] || (path.startsWith('/members/') ? { key: 'profile' } : { key: 'fallback' });
  const pageHtml = {
    home: homePage,
    arena: arenaPage,
    guild: guildPage,
    members: membersPage,
    profile: profilePage,
    profileEdit: profileEditPage,
    login: loginPage,
    signup: signupPage,
    recruiter: recruiterPage,
    fallback: fallbackPage,
  }[route.key]();

  renderLayout(path, route.key, pageHtml);

  handleAuthSubmit('login-form', '/auth/login', 'login-feedback', (formData) => ({
    identifier: String(formData.get('identifier') || ''),
    password: String(formData.get('password') || ''),
  }));

  handleAuthSubmit('signup-form', '/auth/register', 'signup-feedback', (formData) => ({
    username: String(formData.get('username') || ''),
    displayName: String(formData.get('displayName') || ''),
    email: String(formData.get('email') || ''),
    password: String(formData.get('password') || ''),
  }));

  attachProfileEditHandler();
  attachArenaHandlers();
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', async () => {
  await bootstrapAuth();
  render();
});

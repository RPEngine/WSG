const routes = {
  '/': 'home',
  '/arena': 'arena',
  '/guild-world': 'guild',
  '/members/profile': 'profile',
  '/recruiter-console': 'recruiter',
};

const navItems = [
  ['Home', '/'],
  ['Arena', '/arena'],
  ['Guild', '/guild-world'],
  ['World RP', '/guild-world'],
  ['Members', '/members/profile'],
  ['Recruiter Console', '/recruiter-console'],
  ['Discussions', '/discussions'],
];

const mock = {
  friends: ['Aiko', 'Maverick', 'ShinobiRae', 'Devon', 'Kuma'],
  chats: ['Arena squad sync', 'Guild storytellers', 'Recruiter outreach', 'Mission planning'],
};

let mode = localStorage.getItem('wsg-mode') || 'professional';
let profileTab = 'Overview';

function linkFor(path) {
  return `#${path}`;
}

function pageTitle(key) {
  return {
    home: ['Welcome back, Ronin Strategist', 'Your community pulse and scenario opportunities.'],
    arena: ['Arena Command', 'Bridge tactical planning with cinematic roleplay missions.'],
    guild: ['Guild World', 'Story streams, locations, and social immersion in one space.'],
    profile: ['Member Profile', 'Identity, contribution history, and guild network presence.'],
    recruiter: ['Recruiter Console', 'Talent intelligence for strategic hiring conversations.'],
    fallback: ['Page Placeholder', 'This section is not built yet, but routing remains intact.'],
  }[key] || ['Wyked Samurai Guild', ''];
}

function card(title, body) {
  return `<section class="card"><h3>${title}</h3>${body}</section>`;
}

function list(items) {
  return `<ul class="list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
}

function rightSidebar() {
  return `
    ${card('Friends Online', list(mock.friends.map((f) => `<span>${f}</span><span class="muted">Available</span>`)))}
    ${card('Search / Start Chat', '<input style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--panel-soft);color:var(--text-main)" placeholder="Search member or recruiter..."/>')}
    ${card('Recent Chats', list(mock.chats.map((c) => `<span>${c}</span><span class="muted">Now</span>`)))}
    ${card('Messaging Presence', '<p class="muted">Recruiters online: 3 · Members online: 41 · Response SLA: 2m</p>')}
    ${card('Backend Health', '<button id="check-backend" class="pill-btn">Check Backend</button><p id="health-result" class="muted" style="margin-top:8px;">Waiting for check.</p>')}
  `;
}

function homePage() {
  return `
    <div class="grid two">
      ${card('Recommended Scenarios', list(['Shadow Market Negotiation', 'Supply Chain Siege', 'Cross-Guild Accord'].map((s) => `<span>${s}</span><span class="muted">Match 92%</span>`)))}
      ${card('Recent Roleplay', list(['Moonlit reconnaissance thread', 'Dojo council session', 'Nexus summit debrief'].map((s) => `<span>${s}</span><span class="muted">12m ago</span>`)))}
    </div>
    <div class="grid two" style="margin-top:14px;">
      ${card('Guild Updates', list(['New event: Ember Protocol', 'Lore drop: The Iron Tributary', 'Mentor pairing round open'].map((s) => `<span>${s}</span><span class="muted">Update</span>`)))}
      ${card('Top Contributors', list(['Aiko — Storycraft lead', 'Rook — Arena tactician', 'Mina — Recruiter liaison'].map((s) => `<span>${s}</span><span class="muted">Elite</span>`)))}
    </div>
  `;
}

function arenaPage() {
  return `
    <section class="feature"><h3 style="margin-top:0">Cinematic Scenario Header</h3><p class="muted">"Operation: Violet Horizon" blends mission analytics with immersive narrative stakes.</p></section>
    <div class="grid two" style="margin-top:14px;">
      ${card('Featured Scenario', '<p>Coordinate infiltration timing, diplomacy paths, and extraction options through a unified mission board.</p><div class="actions"><button class="pill-btn">Deploy Brief</button><button class="pill-btn">Join Mission</button><button class="pill-btn">Review Intel</button></div>')}
      ${card('Active Scenarios', list(['Harbor Ghost Route', 'Council of Blades', 'Silent Relay'].map((s) => `<span>${s}</span><span class="muted">Active</span>`)))}
    </div>
    <div style="margin-top:14px;">${card('Mission Actions', '<div class="actions"><button class="pill-btn">Create Strategy</button><button class="pill-btn">Launch RP Prompt</button><button class="pill-btn">Invite Participants</button></div>')}</div>
  `;
}

function guildPage() {
  return `
    <div class="grid two">
      ${card('Roleplay Feed', list(['"Mist over Kagemori as scouts return."', '"Alliance envoy arrives at moon gate."', '"Campfire confessions in the cedar court."'].map((s) => `<span>${s}</span><span class="muted">Story</span>`)))}
      ${card('Featured Locations', list(['Moonfall Harbor', 'Cinder Dojo', 'Glass Pine Ridge'].map((s) => `<span>${s}</span><span class="muted">Live scene</span>`)))}
    </div>
    <div class="grid two" style="margin-top:14px;">
      ${card('Recent Stories', list(['Echoes of the Ninth Banner', 'Ashes at First Light', 'The Jade Pact'].map((s) => `<span>${s}</span><span class="muted">Chapter update</span>`)))}
      ${card('Embedded Chat', '<p class="muted">#guild-rp stream active with 19 participants, 4 recruiters observing cultural fit and collaboration.</p>')}
    </div>
  `;
}

function profilePage() {
  const tabs = ['Overview', 'Arena Contributions', 'Guild Activity', 'Connections'];
  return `
    <section class="feature"><h3 style="margin-top:0">Kira Tanaka · Tactical Story Architect</h3><p class="muted">Tags: Mentor · Negotiator · Systems Thinker · Lore Curator</p><div class="actions"><button class="pill-btn">Message</button><button class="pill-btn">Connect</button></div></section>
    <div class="tabs" style="margin:14px 0;">${tabs.map((t) => `<button class="${profileTab === t ? 'active' : ''}" data-tab="${t}">${t}</button>`).join('')}</div>
    <div class="grid two">
      ${card('Recent Scenarios', list(['Delta Convoy Accord', 'Twin Lantern Recovery', 'Crescent Bastion Breach'].map((s) => `<span>${s}</span><span class="muted">Contributor</span>`)))}
      ${card('Guild Participation', list(['Led 6 RP events this month', 'Mentoring 3 new members', 'Drafted 2 lore expansions'].map((s) => `<span>${s}</span><span class="muted">Impact</span>`)))}
    </div>
  `;
}

function recruiterPage() {
  return `
    <div class="grid two">
      ${card('Candidate Insights', list(['Cross-functional collaboration score: 94', 'Narrative leadership index: 89', 'Strategic communication consistency: High'].map((s) => `<span>${s}</span><span class="muted">Insight</span>`)))}
      ${card('Top Contributors', list(['Kira Tanaka', 'Mina Alvarez', 'Rook Harmon'].map((s) => `<span>${s}</span><span class="muted">Benchmarked</span>`)))}
    </div>
    <div class="grid two" style="margin-top:14px;">
      ${card('Performance Metrics', '<p class="muted">Participation rate 87% · Task completion 91% · Peer endorsements +23% MoM</p>')}
      ${card('Scenario Intelligence', '<p class="muted">Scenario stress tests indicate strongest candidate behavior during ambiguity and team conflict resolution.</p>')}
    </div>
    <div style="margin-top:14px;">${card('Guild Network Map', '<p class="muted">[Placeholder visualization] Relationship clusters and influence paths between mentors, candidates, and recruiters.</p>')}</div>
  `;
}

function fallbackPage() {
  return card('Coming Soon', '<p class="muted">This route currently uses a placeholder shell to preserve navigation continuity.</p>');
}

function render() {
  const path = location.hash.replace('#', '') || '/';
  const key = routes[path] || 'fallback';
  document.body.classList.toggle('mode-roleplay', mode === 'roleplay');

  const [title, subtitle] = pageTitle(key);
  const pageHtml = {
    home: homePage,
    arena: arenaPage,
    guild: guildPage,
    profile: profilePage,
    recruiter: recruiterPage,
    fallback: fallbackPage,
  }[key]();

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
            <button id="professional-mode" class="${mode === 'professional' ? 'active' : ''}">Professional</button>
            <button id="roleplay-mode" class="${mode === 'roleplay' ? 'active' : ''}">Roleplay</button>
          </div>
          <button class="icon-btn" aria-label="Notifications">🔔</button>
          <div class="avatar">KT</div>
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

  document.getElementById('professional-mode').onclick = () => setMode('professional');
  document.getElementById('roleplay-mode').onclick = () => setMode('roleplay');
  const healthButton = document.getElementById('check-backend');
  if (healthButton) {
    healthButton.onclick = async () => {
      const result = document.getElementById('health-result');
      result.textContent = 'Checking...';
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        result.textContent = JSON.stringify(data);
      } catch (error) {
        result.textContent = 'Unable to reach backend health endpoint.';
      }
    };
  }
  document.querySelectorAll('[data-tab]').forEach((el) => {
    el.onclick = () => {
      profileTab = el.dataset.tab;
      render();
    };
  });
}

function setMode(nextMode) {
  mode = nextMode;
  localStorage.setItem('wsg-mode', mode);
  render();
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);

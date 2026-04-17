# WSG Profiles / Accounts / Characters Blueprint

## Core model

WSG separates identity into three connected layers:

1. **Account** (private login/control)
2. **Profile** (main public or semi-public identity)
3. **Characters** (optional roleplay identities)

**Rule:** one account → one main profile → zero or more characters.

---

## Ownership and purpose

### Account (required)
Private administrative/authentication layer.

Required fields:
- login/auth method
- email
- password hash or provider identity
- account/user id
- auth/session state

### Profile (light required)
Main identity center for platform participation.

Required fields for functional MVP:
- display name
- username
- visibility
- profile type

Optional profile fields:
- avatar
- role/tagline
- about
- organization
- samurai/ronin status
- professional summary
- resume
- skills
- roleplay preferences

### Characters (optional)
Separate RP identities attached to a user account; never required to use the platform.

---

## Navigation architecture

### Main menu (site navigation only)
- Home
- Nexus
- Hub
- Discussions

> Profile should **not** be in the main menu.

### Account menu (opened from avatar/account button)
- View Profile
- Characters
- Resume / Professional Profile
- Connections
- Activity
- Settings & Privacy
- Membership / Verification
- Help
- Sign Out

---

## Mental model

- **Account** = who can log in
- **Profile** = who you are on WSG
- **Resume** = professional face
- **Characters** = RP faces

---

## Profile page blueprint

Profile is the user’s identity center with inline section editing.

### Top summary area
- avatar
- display name
- username
- role/tagline
- samurai/ronin status
- visibility
- short summary/about
- optional shareable profile link

### Profile sections

1. **Overview**
   - avatar, display name, username
   - about snippet
   - visibility
   - profile type
   - quick stats (connections, characters)

2. **Identity**
   - display name
   - username
   - role/title
   - organization
   - profile type
   - samurai/ronin
   - optional pronouns

3. **About**
   - bio/about
   - interests
   - specialties
   - “what I’m here for”

4. **Professional** (optional)
   - professional headline
   - summary
   - resume status
   - key skills
   - experience summary
   - open-to-work toggle
   - recruiter visibility toggle

5. **Roleplay**
   - writing/play preferences
   - preferred genres
   - RP notes
   - character count
   - link to manage characters

6. **Connections**
   - current connections
   - incoming requests
   - outgoing requests
   - if backend not ready: clean placeholder state

7. **Activity**
   - recent profile updates
   - scenario participation
   - character updates
   - discussion activity
   - if backend not ready: placeholder state

8. **Settings**
   - privacy settings
   - account preferences
   - default visibility
   - notification preferences
   - later: display/accessibility settings

---

## Inline editing model

Do not rely on a separate “Edit Profile” page for core profile changes.

- default mode: read-only
- each section has local Edit button
- each edited section has Save/Cancel
- user remains on Profile page

Strong inline edit candidates:
- Identity
- About
- Professional summary
- Roleplay preferences
- Visibility settings

---

## Characters blueprint

Characters live in a dedicated page/area, not embedded as profile form clutter.

### Characters page (MVP display)
- Create Character button
- character list
- avatar/image
- name
- world/setting
- short summary
- status (draft/active/archived)
- visibility

### Character fields

MVP minimum:
- name
- optional portrait/avatar
- world/setting
- short summary
- visibility
- status

Later expansion:
- race/species
- class/role
- faction
- age
- history
- notes
- tags
- RP status
- linked worlds/campaigns

### MVP character operations
- create
- edit
- list
- archive/delete

---

## Resume / Professional profile

Optional and not mandatory during onboarding.

MVP:
- resume upload (or file reference)
- short professional summary
- key skills
- open to opportunities toggle

Later:
- advanced resume builder and recruiter workflows

---

## First-time profile setup

When a new user opens Profile, show guided setup state (never error state).

1. **Step 1 (required basics)**
   - display name
   - username
   - profile visibility

2. **Step 2 (identity polish)**
   - role/tagline
   - short about

3. **Step 3 (optional extras)**
   - resume/professional summary
   - first character

Resume + character creation remain optional.

---

## MVP now vs later

### Build now
- account auth works
- profile create/edit works
- profile sections: Overview, Identity, About
- optional Professional section
- characters page with create/edit/list
- account menu shortcuts functional
- connections placeholder state
- activity placeholder state

### Build later
- advanced resume builder
- recruiter workflows
- membership + verification logic
- full connection request system
- notifications
- full activity feed
- character approval workflows
- company/recruiter profile specialization

---

## Routes and data model direction

### Main routes
- Home
- Nexus
- Hub
- Discussions

### Account/profile routes
- Profile
- Characters
- Resume / Professional Profile
- Settings & Privacy

Optional later:
- Connections
- Activity

### Data model direction
- `accounts` / `users` (auth identity)
- `profiles` (1:1 with user)
- `characters` (1:many with user)
- `professional_profiles` / `resumes` (optional)
- `connections` (relationship records)
- `activity` (optional feed/log)

---

## Recommended implementation order

1. Account auth + session reliability
2. Profile create/edit
3. Characters create/list/edit
4. Resume/professional section
5. Connections + activity

---

## Design rule

Do not make Profile responsible for every domain.

- Profile = identity center
- Characters = separate branch
- Resume = separate branch
- Account settings = private controls
- Connections/activity = can remain simple placeholders until stable

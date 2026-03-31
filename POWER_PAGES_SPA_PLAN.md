# Power Pages SPA Frontend Plan — Community Learning Hub

## Problem Statement

Design a Power Pages single-page application (SPA) frontend for the Community Learning Hub that:
- Serves **public visitors** with a workshop catalog and trainer directory (no login required)
- Gives **authenticated learners** the ability to enrol in workshops, track their progress, and submit feedback
- Gives **authenticated trainers** visibility into their workshops and enrolments
- Leverages the existing Dataverse tables and the Power Pages Web API for all data access

---

## Data Model Summary

| Table | Schema Name | Purpose |
|---|---|---|
| Community Workshop | `ppdev_communityworkshop` | Workshop sessions with title, description, date, trainer |
| Community Trainer | `ppdev_communitytrainer` | Trainer profiles |
| Community Learner | `ppdev_communitylearner` | Learner profiles linked to portal contacts |
| Community Training Enrolment | `ppdev_communitytrainingenrolment` | Enrolment records (learner ↔ workshop) |
| Community Member Feedback | `ppdev_communitymemberfeedback` | Post-workshop ratings and comments |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     Power Pages Site                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  SPA Shell (index.html)                    │  │
│  │  • Single entry point injected into a Power Pages page     │  │
│  │  • React (or vanilla JS) router handles all navigation     │  │
│  │  • Auth state drives public vs. authenticated views        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │   PUBLIC ROUTES          │  │   AUTHENTICATED ROUTES       │  │
│  │  /workshops              │  │  /my-enrolments              │  │
│  │  /workshops/:id          │  │  /workshops/:id/enrol        │  │
│  │  /trainers               │  │  /workshops/:id/feedback     │  │
│  │  /trainers/:id           │  │  /profile                    │  │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Data Access Layer                            │    │
│  │  Public:  Power Pages Web API (table permissions: Read)  │    │
│  │  Auth:    Power Pages Web API (row-level security)        │    │
│  │  Public fallback: Azure Open Data / SharePoint lists      │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Authentication

### Provider
**Power Pages native authentication** with **Azure Entra ID (Azure AD)** as the primary identity provider.

- Power Pages already supports Azure AD OAuth2 / OpenID Connect out of the box
- On login, the portal creates a **Contact** record linked to the Azure AD identity
- A **Community Learner** record is created and linked to the Contact on first login (via a Cloud Flow or plugin)

### Auth Flow
1. Unauthenticated user visits the site → public routes available
2. User clicks **Sign In** → redirected to Power Pages login page (Azure AD)
3. On return, portal session cookie is issued
4. SPA reads `/_api/Web/currentuser` (or equivalent) to get user context
5. Subsequent Dataverse Web API calls carry the session cookie — row-level security enforced automatically

### Role Assignment (Table Permissions)
| Portal Role | Dataverse Tables | Access |
|---|---|---|
| Authenticated Users | Workshop, Trainer | Read (all active records) |
| Authenticated Users | Learner (own) | Read/Write own record |
| Authenticated Users | Enrolment (own) | Create / Read own |
| Authenticated Users | Feedback (own) | Create / Read own |
| Trainer | Enrolment (own workshop) | Read |
| Trainer | Workshop (own) | Read/Write |

---

## Page / Component Structure

### Public Pages

#### `/workshops` — Workshop Catalog
- Data source: `ppdev_communityworkshop` (Web API, Read, all active)
- Displays: Title, Scheduled Date, Trainer name (expand), Rating average (aggregate from Feedback)
- Filter/sort controls: by date, by trainer
- CTA: "View Details" → `/workshops/:id`

#### `/workshops/:id` — Workshop Detail
- Data source: `ppdev_communityworkshop` + expand `ppdev_trainer` + aggregate feedback rating
- Displays: Full description, date, trainer profile card, average rating, public review snippets
- CTA (unauthenticated): "Sign in to Enrol"
- CTA (authenticated): "Enrol Now" → enrolment modal

#### `/trainers` — Trainer Directory
- Data source: `ppdev_communitytrainer` (Web API, Read, all active)
- Displays: Name, upcoming workshops count, average feedback rating across their workshops

#### `/trainers/:id` — Trainer Profile
- Data source: `ppdev_communitytrainer` + associated workshops
- Displays: Trainer name, contact info (if made public), list of upcoming/past workshops

---

### Authenticated Pages

#### `/my-enrolments` — Learner Dashboard
- Data source: `ppdev_communitytrainingenrolment` filtered to current learner
- Displays: Enrolled workshops with date, status; option to submit feedback after workshop date

#### `/workshops/:id/enrol` — Enrolment Form
- POST to `ppdev_communitytrainingenrolment`
- Auto-populates: `ppdev_learner` (current user's Learner record), `ppdev_workshop`, `ppdev_enrollmentdate` (today)
- Generates: `ppdev_enrollmentreference` (e.g. `ENR-{timestamp}`)

#### `/workshops/:id/feedback` — Feedback Form
- POST to `ppdev_communitymemberfeedback`
- Fields: Rating (1–5 stars), Feedback Summary, Comments
- Guard: only accessible if user has an enrolment for this workshop AND workshop date has passed

#### `/profile` — Learner Profile
- Data source: `ppdev_communitylearner` (own record)
- Read/update: Name, Email, Phone

---

## Public Data Sources (No Auth Required)

These complement Dataverse content for anonymous users and reduce portal licensing load:

| Data Source | Use Case | Access Method |
|---|---|---|
| **Power Pages Web API** (anonymous table permissions) | Workshop catalog, Trainer directory, public feedback ratings | `/_api/ppdev_communityworkshops?$select=...&$filter=statecode eq 0` |
| **Azure Open Datasets** | Local event calendars, geographic context for in-person workshops | REST / JSON |
| **SharePoint List (public)** | Site announcements, FAQs, news/blog posts — easily editable by admins without Dataverse | SharePoint REST API with CORS |
| **Power Pages Content Snippets** | Static rich-text content (hero copy, about page, contact info) | Already served by Power Pages at render time |
| **RSS / Atom feeds** | Industry training news, linked learning resources | `fetch()` from a public RSS-to-JSON proxy |

> **Recommended primary public source:** Power Pages anonymous table permissions on `ppdev_communityworkshop` and `ppdev_communitytrainer` with read-only access. This keeps all authoritative data in Dataverse while enabling public browsing without login.

---

## Power Pages Web API Calls (Examples)

```js
// Public: list all active workshops with trainer name
GET /_api/ppdev_communityworkshops
  ?$select=ppdev_workshoptitle,ppdev_description,ppdev_scheduleddate
  &$expand=ppdev_trainer($select=ppdev_trainername)
  &$filter=statecode eq 0
  &$orderby=ppdev_scheduleddate asc

// Authenticated: get current learner's enrolments
GET /_api/ppdev_communitytrainingenrolments
  ?$select=ppdev_enrollmentreference,ppdev_enrollmentdate
  &$expand=ppdev_workshop($select=ppdev_workshoptitle,ppdev_scheduleddate)
  &$filter=ppdev_learner/ppdev_communitylearnerid eq '{learnerId}'

// Authenticated: submit enrolment
POST /_api/ppdev_communitytrainingenrolments
Content-Type: application/json
{
  "ppdev_enrollmentreference": "ENR-1711900000",
  "ppdev_enrollmentdate": "2026-04-01T00:00:00Z",
  "ppdev_learner@odata.bind": "/ppdev_communitylearners({learnerId})",
  "ppdev_workshop@odata.bind": "/ppdev_communityworkshops({workshopId})"
}
```

---

## SPA Technology Recommendation

| Concern | Recommendation | Reason |
|---|---|---|
| Framework | **React + Vite** (or vanilla JS) | Lightweight bundle; embeds cleanly into a single Power Pages page |
| Routing | React Router (hash or memory mode) | Power Pages controls URL routing; use `#/` hash routes to avoid conflicts |
| State | React Context or Zustand | Simple; no heavy Redux needed for this scope |
| Styling | Tailwind CSS or Bootstrap 5 | Bootstrap 5 already available in Power Pages themes |
| API calls | Native `fetch()` with session cookie | Power Pages handles auth cookie automatically |
| Build output | Single `bundle.js` + `bundle.css` | Uploaded as Power Pages web files; injected via Custom JavaScript |

---

## Admin-Managed Routing (No Code Deployments)

The SPA router can be driven by external configuration that admins control, so adding, removing, or restricting routes never requires a code change or redeployment. The SPA fetches the route manifest at bootstrap, builds its router dynamically, and maps each route to a **component key** from a fixed internal registry.

```
Bootstrap sequence
──────────────────
1. SPA loads (bundle.js)
2. Fetch route manifest from config source
3. Build router from manifest entries
4. Each entry maps  path → componentKey → registered component
5. Render — unknown componentKeys render a "Coming Soon" fallback
```

---

### Option 1 — Dataverse Route Configuration Table ✅ Recommended

Add a custom table `ppdev_sparoute` to the solution. Admins manage it in the Model-Driven App (Program Coordinator Console) or Power Pages portal table editor. The SPA reads it via the Web API before rendering.

**Table: `ppdev_sparoute`**

| Column | Type | Purpose |
|---|---|---|
| `ppdev_name` | Text (PK display) | Human-readable label, e.g. "Workshop Catalog" |
| `ppdev_path` | Text | Hash path, e.g. `#/workshops` |
| `ppdev_componentkey` | Text | Maps to a registered SPA component, e.g. `WorkshopList` |
| `ppdev_requiresauth` | Yes/No | If true, redirect to login when anonymous |
| `ppdev_requiredroles` | Text | Comma-separated portal roles, e.g. `Trainer,Admin` (blank = any auth user) |
| `ppdev_navlabel` | Text | Label shown in navigation menu (blank = hidden from nav) |
| `ppdev_navorder` | Integer | Sort order in the nav menu |
| `ppdev_isenabled` | Yes/No | Toggle a route on/off without deleting it |
| `ppdev_redirectto` | Text | Optional: redirect this path to another path (for aliases/renames) |

**SPA bootstrap call (anonymous read):**
```js
GET /_api/ppdev_sparoutes
  ?$select=ppdev_path,ppdev_componentkey,ppdev_requiresauth,
           ppdev_requiredroles,ppdev_navlabel,ppdev_navorder,
           ppdev_isenabled,ppdev_redirectto
  &$filter=ppdev_isenabled eq true
  &$orderby=ppdev_navorder asc
```

**SPA component registry (the only part that needs a code change when a brand-new view is built):**
```js
const COMPONENT_REGISTRY = {
  WorkshopList:    () => import('./views/WorkshopList'),
  WorkshopDetail:  () => import('./views/WorkshopDetail'),
  TrainerList:     () => import('./views/TrainerList'),
  TrainerDetail:   () => import('./views/TrainerDetail'),
  MyEnrolments:    () => import('./views/MyEnrolments'),
  EnrolForm:       () => import('./views/EnrolForm'),
  FeedbackForm:    () => import('./views/FeedbackForm'),
  Profile:         () => import('./views/Profile'),
  ComingSoon:      () => import('./views/ComingSoon'), // fallback
};
```

**Admin workflow:** Open the Program Coordinator Console → SPA Routes table → add a row, set the component key to an existing registry entry, toggle enabled. No deployment needed.

**Pros:** Full Power Platform native; version-controlled with the solution; role-aware; manageable via Model-Driven App, Canvas App, or Power Pages table editor.  
**Cons:** Requires one Web API call per page load (mitigate with `sessionStorage` caching with a short TTL).

---

### Option 2 — Power Pages Site Settings (JSON blob)

Power Pages has a built-in **Site Settings** table (`adx_sitesetting`) — name/value pairs editable in the Power Pages admin centre or Portals Management App. Store the entire route manifest as a single JSON value.

**Site setting name:** `SPA/RouteManifest`  
**Value (JSON string):**
```json
[
  { "path": "#/workshops", "component": "WorkshopList", "navLabel": "Workshops", "navOrder": 1, "requiresAuth": false },
  { "path": "#/my-enrolments", "component": "MyEnrolments", "navLabel": "My Enrolments", "navOrder": 2, "requiresAuth": true }
]
```

**SPA reads it via:**
```js
GET /_api/adx_sitesettings
  ?$select=adx_value
  &$filter=adx_name eq 'SPA/RouteManifest'
```

**Pros:** Zero extra tables; works immediately; editable in the Power Pages admin centre.  
**Cons:** Single unstructured text field — easy to break with a JSON typo; no per-row validation; harder to audit changes; not included in solution exports by default.

---

### Option 3 — Power Pages Web File (`routes.json`)

Upload a `routes.json` file as a **Web File** in Power Pages (under Content → Web Files). The SPA fetches it as a static asset.

```
/routes.json  (Power Pages Web File, MIME: application/json)
```

```json
{
  "routes": [
    { "path": "#/workshops", "component": "WorkshopList", "auth": false, "nav": { "label": "Workshops", "order": 1 } },
    { "path": "#/trainers",  "component": "TrainerList",  "auth": false, "nav": { "label": "Trainers",  "order": 2 } }
  ]
}
```

**SPA reads it via:**
```js
const manifest = await fetch('/routes.json').then(r => r.json());
```

**Pros:** Trivially simple; fully cacheable by the browser and CDN; no API calls needed; admins edit and re-upload via the Power Pages studio.  
**Cons:** No per-role access control in the file itself; requires a manual upload step to update (not a form-based edit); no change history unless stored in source control.

---

### Option 4 — Environment Variables (Power Platform)

Store the route manifest JSON in a **Power Platform Environment Variable** (text type). Surfaced to the SPA via a lightweight Power Automate HTTP-triggered flow or a custom API plugin that returns the variable value.

**Pros:** Managed at the environment level; survives solution imports; editable by environment admins.  
**Cons:** Requires a flow/API endpoint as the delivery mechanism — adds a layer of indirection; latency on first call; overkill for most scenarios.

---

### Comparison

| Option | Admin UX | Role-level control | In solution export | Best for |
|---|---|---|---|---|
| **Dataverse table** ✅ | Model-Driven App form | ✅ Yes (per-row) | ✅ Yes | Full-featured, long-term |
| Site Settings | Power Pages admin centre | ❌ JSON only | ❌ No | Quick prototype |
| Web File (routes.json) | Upload in Pages studio | ❌ JSON only | ✅ As web file | Static / simple sites |
| Environment Variable | Power Platform admin | ❌ JSON only | ✅ Yes | Environment-level config |

---

### Recommended approach: Dataverse table + Web File fallback

1. **Primary:** `ppdev_sparoute` Dataverse table — full admin control, role-aware, ships in the solution.  
2. **Fallback:** If the Web API call fails (e.g. table permissions not yet configured), the SPA falls back to `/routes.json` (a Web File with the default manifest), ensuring the site still renders.

---

## Power Pages Configuration Required

1. **Table Permissions**
   - Anonymous: `ppdev_communityworkshop`, `ppdev_communitytrainer` → Read scope: Global
   - Authenticated: `ppdev_communitylearner` → Read/Write scope: Contact
   - Authenticated: `ppdev_communitytrainingenrolment`, `ppdev_communitymemberfeedback` → Create/Read scope: Contact

2. **Web API site setting**
   - Enable: `Webapi/ppdev_communityworkshop/enabled = true`
   - Enable remaining tables similarly; set `fields` site settings per table

3. **Portal Authentication**
   - Configure Azure AD provider under **Authentication > Identity Providers**
   - Set redirect URIs and client credentials in Azure App Registration

4. **SPA Page**
   - Create a Power Pages page (e.g. `/app`)
   - Add a single `<div id="root"></div>` in the page template
   - Upload `bundle.js` and `bundle.css` as Web Files
   - Inject them via the page's **Custom JavaScript** / **Custom CSS** settings

5. **CORS & anti-CSRF**
   - Power Pages automatically handles `__RequestVerificationToken` for POST/PATCH/DELETE
   - SPA must read the token from the meta tag and include it in mutating requests

---


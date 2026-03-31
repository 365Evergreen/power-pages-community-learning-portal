# Community Learning Hub – Power Pages Portal

Community Learning Hub connects non-profit trainers with eager learners through accessible workshops and training programs. We support participant enrolment and tailor sessions to meet diverse community needs.

Built using **Power Platform**: Power Pages frontend · Dataverse tables · Public API access for anonymous users · Power Automate workflows · Custom Copilot Studio agent.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Repository Structure](#repository-structure)
- [Dataverse Tables](#dataverse-tables)
- [Power Pages Frontend](#power-pages-frontend)
- [Public API – Anonymous Enrolment](#public-api--anonymous-enrolment)
- [Power Automate Workflows](#power-automate-workflows)
- [Copilot Studio Agent](#copilot-studio-agent)
- [Setup & Deployment](#setup--deployment)
- [Security Model](#security-model)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Power Pages Portal                        │
│  Home · Workshops · Enrol · About  (anonymous access)       │
│  Liquid templates · Custom CSS · JavaScript validation      │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP POST (anonymous, CSRF-protected)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Web Template API  /api/enrollment               │
│  Validates input · Creates clh_enrollment in Dataverse       │
└────────────────────┬────────────────────────────────────────┘
                     │ Dataverse trigger
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                Power Automate Flows                          │
│  • Enrollment Confirmation – sends email, updates count      │
│  • Session Reminder        – daily check, 48h reminder       │
│  • Trainer Notification    – alerts trainer on new enrol     │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Dataverse Tables                            │
│  clh_workshop · clh_trainer · clh_learner · clh_enrollment   │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Copilot Studio Agent (embedded chat)              │
│  Discover workshops · Enrolment help · Accessibility info    │
└─────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
src/
├── dataverse/
│   ├── tables/                     # Dataverse table definitions (JSON)
│   │   ├── clh_trainer.json
│   │   ├── clh_workshop.json
│   │   ├── clh_learner.json
│   │   └── clh_enrollment.json
│   ├── relationships/
│   │   └── relationships.json      # Table relationship definitions
│   └── security-roles/
│       └── security-roles.json     # Security role definitions
│
├── power-pages/
│   └── website/
│       ├── website.yml             # Site manifest
│       ├── web-pages/              # Page definitions & Liquid HTML
│       │   ├── home/
│       │   ├── workshops/
│       │   ├── enroll/
│       │   └── about/
│       ├── web-templates/          # API endpoint web template
│       ├── web-files/
│       │   ├── css/                # Custom stylesheet
│       │   └── js/                 # Client-side JavaScript
│       ├── table-permissions/      # Dataverse table access rules
│       └── content-snippets/       # Editable site text
│
├── power-automate/
│   ├── enrollment-confirmation/    # New enrollment → confirm email + count
│   ├── session-reminder/           # Daily scheduler → 48h reminders
│   └── trainer-notification/       # New enrollment → notify trainer
│
└── copilot-studio/
    └── community-learning-agent/
        ├── agent.yml               # Bot definition & settings
        ├── topics/                 # Conversation topic definitions
        │   ├── find-workshops.topic.yml
        │   ├── enrolment-help.topic.yml
        │   ├── accessibility-info.topic.yml
        │   ├── trainer-info.topic.yml
        │   ├── faq.topic.yml
        │   └── escalate-to-human.topic.yml
        └── entities/
            └── entities.yml        # NLU entity definitions
```

---

## Dataverse Tables

### `clh_workshop`
Stores workshop and training program records created by trainers.

| Attribute | Type | Description |
|---|---|---|
| `clh_workshopid` | GUID (PK) | Unique identifier |
| `clh_name` | String | Workshop title |
| `clh_description` | Memo | Full description |
| `clh_trainer` | Lookup → clh_trainer | Delivering trainer |
| `clh_category` | Choice | Topic category |
| `clh_deliveryformat` | Choice | In-Person / Online / Hybrid / Self-Paced |
| `clh_startdate` | DateTime | Start date & time |
| `clh_enddate` | DateTime | End date & time |
| `clh_maxparticipants` | Integer | Capacity |
| `clh_currentenrollments` | Integer | Auto-updated by Power Automate |
| `clh_status` | Choice | Draft / Published / Full / Cancelled / Completed |
| `clh_publishtoportal` | Boolean | Controls visibility on portal |

### `clh_trainer`
Non-profit trainer profiles.

| Attribute | Type | Description |
|---|---|---|
| `clh_trainerid` | GUID (PK) | Unique identifier |
| `clh_name` | String | Full name |
| `clh_email` | Email | Contact email |
| `clh_organization` | String | Non-profit organisation |
| `clh_bio` | Memo | Trainer biography |
| `clh_specialization` | String | Area of expertise |
| `clh_publishtoportal` | Boolean | Controls visibility on portal |

### `clh_learner`
Community members who enrol in workshops.

| Attribute | Type | Description |
|---|---|---|
| `clh_learnerid` | GUID (PK) | Unique identifier |
| `clh_name` | String | Full name |
| `clh_email` | Email | Contact email |
| `clh_accessibilityrequirements` | Memo | Accommodation needs |
| `clh_portalcontact` | Lookup → Contact | Link to authenticated portal contact |

### `clh_enrollment`
Links participants (anonymous or learner) to a workshop.

| Attribute | Type | Description |
|---|---|---|
| `clh_enrollmentid` | GUID (PK) | Unique identifier |
| `clh_workshop` | Lookup → clh_workshop | Workshop enrolled in |
| `clh_learner` | Lookup → clh_learner | Learner (if authenticated) |
| `clh_anonymousname` | String | Name (anonymous participants) |
| `clh_anonymousemail` | Email | Email (anonymous participants) |
| `clh_status` | Choice | Pending / Confirmed / Waitlisted / Cancelled / Attended |
| `clh_confirmationcode` | String | Unique code emailed to participant |
| `clh_source` | Choice | Portal (Anonymous) / Portal (Authenticated) / Manual |

---

## Power Pages Frontend

### Pages

| Page | URL | Access |
|---|---|---|
| Home | `/` | Anonymous |
| Workshops | `/workshops` | Anonymous |
| Enrol | `/enroll?workshopId={id}` | Anonymous |
| About | `/about` | Anonymous |

### Key Features
- **Liquid templates** dynamically query Dataverse for published workshops and trainers
- **FetchXML** filters ensure only published (`clh_publishtoportal = true`) and active workshops are shown
- **Filter bar** on the Workshops page supports filtering by category, format, and cost with auto-submit
- **Capacity awareness** – cards display "X spots left" warnings and switch to "Join Waitlist" when full
- **Accessible HTML** – semantic elements, ARIA labels, keyboard navigation, skip links, focus indicators, reduced motion support
- **CSRF protection** on the enrolment form via `__RequestVerificationToken`

---

## Public API – Anonymous Enrolment

### `POST /api/enrollment`

Accepts workshop enrolment submissions from anonymous (unauthenticated) portal visitors.

**Request body (JSON):**
```json
{
  "workshopId": "00000000-0000-0000-0000-000000000000",
  "participantName": "Jane Smith",
  "participantEmail": "jane@example.com",
  "participantPhone": "+61 400 000 000",
  "accessibilityRequirements": "Hearing loop required",
  "additionalNotes": "Looking forward to it!",
  "isWaitlist": false
}
```

**Responses:**

| Status | Body |
|---|---|
| `200` | `{ "success": true, "message": "...", "confirmationCode": "...", "status": "Confirmed" }` |
| `400` | `{ "success": false, "message": "Validation error description" }` |
| `404` | `{ "success": false, "message": "Workshop not found" }` |
| `405` | `{ "success": false, "message": "Method not allowed" }` |
| `500` | `{ "success": false, "message": "Server error description" }` |

The endpoint:
1. Validates required fields (`workshopId`, `participantName`, `participantEmail`)
2. Loads the workshop and checks it is published and accepting enrolments
3. Determines whether to confirm or waitlist based on remaining capacity
4. Creates a `clh_enrollment` record in Dataverse
5. Returns a JSON response; the Power Automate **Enrollment Confirmation** flow then sends the email

---

## Power Automate Workflows

### 1. Enrollment Confirmation (`enrollment-confirmation.flow.json`)
- **Trigger:** New `clh_enrollment` record created (Dataverse)
- **Actions:**
  - Loads workshop and trainer details
  - Sends HTML confirmation email to participant
  - Updates `clh_confirmationsentat` on the enrollment record
  - Increments `clh_currentenrollments` on the workshop
  - Marks workshop as **Full** (`clh_status = 100000002`) if capacity is reached

### 2. Session Reminder (`session-reminder.flow.json`)
- **Trigger:** Scheduled – daily at 08:00 UTC
- **Actions:**
  - Queries confirmed enrollments for workshops starting within the next 48 hours
  - Sends reminder email to each participant
  - Sets `clh_remindersent = true` to prevent duplicate reminders

### 3. Trainer Notification (`trainer-notification.flow.json`)
- **Trigger:** `clh_enrollment` status changes to **Confirmed**
- **Actions:**
  - Notifies the trainer by email with participant name, email, and accessibility requirements

---

## Copilot Studio Agent

An AI assistant embedded on the portal to help visitors without needing to navigate pages manually.

### Topics

| Topic | Trigger phrases |
|---|---|
| **Find Workshops** | "find workshops", "what classes are available", "free workshops" |
| **Enrolment Help** | "how do I enrol", "do I need an account", "can I cancel" |
| **Accessibility Info** | "accessibility", "hearing loop", "I have accessibility needs" |
| **Trainer Info** | "who are the trainers", "become a trainer", "partner with you" |
| **FAQ** | "how does it work", "is it free", "what is this" |
| **Escalate** | "speak to a person", "contact support", "I need help" |

### Entities
- **Workshop Category** – closed list with synonyms (e.g. "tech" → Digital Skills)
- **Delivery Format** – closed list with synonyms (e.g. "virtual" → Online (Live))

---

## Setup & Deployment

### Prerequisites
- Power Platform environment with Dataverse enabled
- Power Pages site license
- Power Automate per-flow or per-user licence
- Office 365 (Exchange Online) for email sending
- Copilot Studio licence

### Deployment Steps

1. **Dataverse Tables**
   - Import table definitions from `src/dataverse/tables/` into your Dataverse environment
   - Apply relationships from `src/dataverse/relationships/relationships.json`
   - Create security roles defined in `src/dataverse/security-roles/security-roles.json`

2. **Power Pages Site**
   - Use the [Power Pages CLI](https://learn.microsoft.com/power-pages/configure/power-platform-cli) to upload:
     ```
     pac pages upload --path src/power-pages/website
     ```
   - Upload CSS and JS files from `src/power-pages/website/web-files/` as portal web files
   - Apply table permissions from `src/power-pages/website/table-permissions/table-permissions.yml`
   - Configure the web template `enrollment-api` with anonymous access and the `CLH Portal Anonymous` web role

3. **Power Automate Flows**
   - Import each `.flow.json` from `src/power-automate/` into Power Automate
   - Configure connections: Dataverse and Office 365 Outlook
   - Enable each flow

4. **Copilot Studio Agent**
   - Create a new agent in Copilot Studio
   - Import topic definitions from `src/copilot-studio/community-learning-agent/topics/`
   - Import entities from `src/copilot-studio/community-learning-agent/entities/entities.yml`
   - Configure Dataverse knowledge source with `clh_workshop` and `clh_trainer` tables
   - Set authentication to **No authentication** for public portal access
   - Publish and embed on the Power Pages site

---

## Security Model

### Table Permissions

| Web Role | Table | Access | Scope |
|---|---|---|---|
| CLH Portal Anonymous | clh_workshop | Read | Published workshops only |
| CLH Portal Anonymous | clh_trainer | Read | Published trainers only |
| CLH Portal Anonymous | clh_enrollment | Create | Global (no read) |
| CLH Portal Learner | clh_workshop | Read | All published |
| CLH Portal Learner | clh_learner | Read, Write, Create | Self |
| CLH Portal Learner | clh_enrollment | Read, Create | Self |
| CLH Administrator | All tables | Full | Organization |

### Anonymous Enrolment Privacy
- Anonymous enrollment records contain `clh_anonymousname` and `clh_anonymousemail`
- Table permissions deny read access to anonymous users after creation — participants cannot query other enrolments
- CSRF token (`__RequestVerificationToken`) is required on all POST requests from the portal
- Participant email addresses are only used for confirmation and reminder communications

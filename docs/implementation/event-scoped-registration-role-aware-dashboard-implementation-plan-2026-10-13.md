# EVENTOPS-2026 — Event-Scoped Registration, Role-Aware Dashboards & Page Architecture Implementation Plan

**Status:** Draft — planning only  
**Date:** 2026-10-13  
**Repository:** [RAHUL-TKRCET/EVENTOPS-2026](https://github.com/RAHUL-TKRCET/EVENTOPS-2026)  
**Tracking issue:** [#35](https://github.com/RAHUL-TKRCET/EVENTOPS-2026/issues/35)  
**Roadmap:** [data/roadmap.csv](../../data/roadmap.csv)

> This is a plan, not a claim that the proposed behavior is already implemented. Existing findings below are based on repository sources reviewed for this plan.

## 1. Executive direction

EVENTOPS-2026 is a multi-event operations platform. Each event needs its own public portal, participant-registration link and event-login link. Participant account creation and event enrollment are separate operations. A participant may join multiple events, but each event registration and private record must be independently scoped. An event ID in a URL is context only and never proof of authorization.

**Non-negotiable rules**
1. Registering for Event A must not register a participant for Event B.
2. Organization Admin manages only their organization and its events. Event Admin and event staff act only on assigned events and permissions. Super Admin is a separate platform-governance scope.
3. Role selection in a form or URL never grants a role.
4. Backend authorization is authoritative; frontend route guards/navigation are not security boundaries.
5. Event links must work with the Next.js static-export/GitHub Pages deployment, including copied links, direct opening and refresh.
6. Show success only after backend persistence; never present mock/fallback values as live data.
7. Inspect existing models and routes before adding new tables/pages. Keep production database/RLS changes behind existing security approval gates.

## 2. Repository sources reviewed

- `SYSTEM_ARCHITECTURE.md`, `README.md`
- `docs/implementation/role-aware-information-architecture-and-participant-registration-plan-2026-10-12.md`
- `docs/implementation/route-inventory-audit-2026-10-12.md`
- `docs/implementation/next-implementation-plan-2026-10-12.md`
- `docs/implementation/route-inventory.csv`
- `data/roadmap.csv`
- `types/index.ts`, `lib/permissions.ts`
- `backend/app/api/v1/auth.py`, `backend/app/api/v1/events.py`
- `app/page.tsx`, `app/events/create/page.tsx`, `app/events/portal/page.tsx`, `app/events/[eventId]/portal/page.tsx`, `app/events/login/page.tsx`, `app/register/page.tsx`, `app/dashboard/page.tsx`, `app/participant/page.tsx`

### Findings supported by those sources

- The role enum contains nine roles: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`, `EVENT_ADMIN`, `COORDINATOR`, `JUDGE`, `VOLUNTEER`, `PARTICIPANT`, `TECHNICAL_STAFF`, `RESOURCE_MANAGER`.
- Event creation already constructs query-style, static-compatible event portal/login URLs; existing portal/login code attempts event-context and active-assignment checks.
- The route audit says the participant CTA preserves `eventId` into account creation, but account creation does **not** yet create event registration or team membership.
- Current role configuration maps Event Admin and Coordinator to `/dashboard`; the existing IA plan calls for distinct event overview and coordinator workspace destinations after route/context decisions are confirmed.
- The route inventory reports 124 App Router page components, but inventory alone does not prove route authorization, links, API correctness, direct-load/refresh or production behavior.
- Event, event-member, team and team-member tables are reported to exist. Reuse/extend them if their semantics fit; do not automatically add a parallel registration table.
- Roadmap statuses and dependencies include static URL decisions, end-to-end browser verification and an independent database-security gate. Use the roadmap for current recorded evidence; do not infer unrecorded live success.

## 3. Goals and boundaries

Deliver predictable public and event entry flows, persisted per-event participant enrollment, a purposeful dashboard and navigation map for every role, server-enforced organization/event/team isolation, a route inventory/consolidation decision, and direct-link compatibility under static hosting.

Do not rebuild the app wholesale, equate account creation with enrollment, grant privileged roles by self-selection, or rename/delete routes before auditing existing links and behavior.

Logical layers:
1. Public homepage, event discovery/portal, account creation, event registration/login, invitation acceptance, status and error pages.
2. Organization workspace for owned events, organization people and settings.
3. Selected-event workspace for event configuration and operations.
4. Role-specific workflows.
5. Platform governance.
6. FastAPI authorization/data layer.
7. Static-export-compatible route and link layer.

Access is resolved from authenticated identity plus membership/assignment/permission records. Client-provided event/team/object IDs identify requested resources; the server validates every relationship and action.

## 4. Public pages and entry contract

Proposed paths must be reconciled with the 124-page route inventory before adding pages.

| Page | Structure and behavior |
|---|---|
| `/` Homepage | Product overview; Create Organization; Register for an Event; Open Event Link; Sign In; help. No public Super Admin signup. |
| `/events` Event discovery (optional) | Search/filter published public events, event cards, empty/error states; only show API-approved public events. |
| `/events/portal?eventId=…` Event portal candidate | Event identity, public details, date/venue, registration status/rules, Register and Event Login actions, contact/help. Register only when backend says open/eligible. |
| `/events/register?eventId=…` Proposed registration | Event context, sign-in/create-account continuation, participant form, event/team policy, consent, validation, persisted confirmation. |
| `/events/login?eventId=…` Event login | Event identity, credentials, account's allowed event workflow/roles, recovery/help. Backend resolves registration/assignment; role selection cannot grant access. |
| `/register` Account creation | Participant account or Organization Admin onboarding. Creates account only; preserve event context and continue to enrollment if entry came from an event portal. No public staff-role self-selection. |
| `/login` General login | Organization/platform sign-in and “I have an event link” guidance. Event-scoped roles must be resolved within event context. Confirm whether this is a new route or existing homepage surface. |
| Invitation acceptance | Reuse the existing canonical route; show intended event/org/role and validate token expiry, scope, revocation and single-use server-side. |
| Registration status/confirmation | Existing or proposed page; read persisted status back from API, display next steps and support. |
| Profile/session | Reuse the canonical profile route after audit; account identity remains distinct from event enrollment. |
| Forbidden/not-found/unavailable | Distinguish 401, 403, 404, closed registration and network/service errors. Never fall back to sample `evt-01` or another event. |

### Per-event links and portal states

Every event created by an authorized admin should expose a portal link, participant-registration link and event-login link. Centralize link generation so event creation, dashboards, email/invitations and public entry use the same contract. Resolve existing query-style and dynamic route variants alongside roadmap issues #22/#28 before declaring one canonical route.

Portal states: loading; published/open; published/closed; approval/invitation-only; draft/unpublished; unknown event; public metadata unavailable; expired event; authenticated but not registered/not assigned. Registration availability must be explicit in the backend contract, not inferred from an ID or frontend constant.

## 5. Event-specific registration and login

### New participant for Event A
1. Open Event A portal and review event identity/status.
2. Choose Register for Event A.
3. Sign in or create a Participant account while preserving Event A as pending navigation context.
4. Complete Event A registration and any applicable team flow.
5. Backend checks event existence/state, eligibility, duplicates and capacity if supported, then persists the Event A registration.
6. Show success only after confirmed persistence.
7. Load the Participant workspace with Event A selected and API-backed data.

### Existing participant / multiple events
- Event login authenticates the user, then resolves that user's registration or staff assignment for the selected event.
- If the same account joins Event B, it must complete a separate Event B enrollment and receive a separate registration/status.
- Event A team membership, submissions, QR pass, attendance, schedule, results and permissions never imply Event B access.
- A multi-event list may show only the current user's authorized event memberships; it must not expose other participants' private records.

### Account, registration and team are distinct
The current audit says `/auth/register` creates a Participant account but not event enrollment/team membership. Keep that separation explicit. Existing accounts should sign in and continue the pending event flow instead of creating duplicate accounts. Staff assignment/invitation is a separate workflow.

Before implementation, inspect existing Event, EventMember, Team and TeamMember ORM models, migrations, constraints and APIs. Decide whether the existing membership model can represent participant registration status and lifecycle. Only propose a new table if the reviewed model cannot support the contract.

### Registration contract to define
- Event ID validated against event state; never authorization by itself.
- User identity derived from the verified server session/token.
- Server-generated registration ID, status and timestamps.
- Event-specific required fields/consent and policy.
- Team ID only via a valid same-event team/invitation flow.
- Unique participant/event registration rule and idempotent retry behavior.
- Approved states for pending/confirmed/waitlisted/closed only if the backend supports them.

## 6. Dashboard structures for all roles

Use shared UI primitives—headers, tables, cards, filters, loading/empty/error states and confirmation dialogs—but keep workflows role-specific. Each existing route must be audited before adding a new page.

### 6.1 Super Admin — `/super-admin`
Home: platform overview backed by real APIs; organization/event/user directory; account/role governance; service health; audit log; platform policy/settings. Detail areas: Organizations, Users, Audit, System Health, Global Settings. Explicit platform scope; not the Organization Admin dashboard.

### 6.2 Organization Admin — `/dashboard`
Home: organization identity/status; owned-event list and search; create event; copy portal/registration/login links; recent organization activity; people and event-staff assignments; honest empty/error states. Related pages: Organization Overview, Events List/Create, Event Detail, People & Roles, Organization Settings and API-backed reports. Can manage only the same organization.

### 6.3 Event Admin — selected-event overview
Current `/dashboard` mapping is not final for this role. Home: persistent selected event identity/status; registration/team counts only from APIs; participant roster; event registration configuration; staff assignments; rounds/rubrics; venues/allocations; QR/attendance; resources/incidents/announcements/reports where authorized; copy/share links. Related pages: Event Settings, Registrations & Teams, Staff Assignments, Schedule/Rounds/Judging Setup, Venue/Allocation, Attendance/QR, Resources/Incidents, Event Reports. No unrelated event or organization-wide governance.

### 6.4 Coordinator — proposed `/control-center`
Current route exists but role mapping and permissions need confirmation. Home: selected assigned event and current round; task/queue summaries; check-in exceptions; venue readiness; staff shifts; incident queue/escalation; event timeline and notices. Related pages: Live Operations, Check-in Queue, Shifts/Logistics, Incidents, Timeline/Announcements, Operational Reports. No default event deletion, global settings or judge-score controls.

### 6.5 Judge — `/judge`
Home: assigned event/round; assigned-team queue; schedule/room; pending/completed evaluations. Pages: My Assignments, Assigned Team/Submission, Rubric Evaluation, Save/Submit, My Evaluation History/Scorecards, Judge Schedule/Profile. Only assigned teams and permitted scorecards; test real assignment resolution, not only stub seams.

### 6.6 Volunteer — `/volunteers`
Home: assigned event/zone/shift; tasks; authorized check-in/QR workflow; instructions/emergency contacts; incident reporting. Pages: My Shifts, My Tasks, Authorized QR Scan, Report Incident, Event Instructions/Schedule, Profile. No unrestricted roster exports, judging or resource mutations.

### 6.7 Participant — `/participant`
Home: selected event and persisted registration status; team status/roster if applicable; project/submission; schedule/rounds/venue; QR pass and attendance; room/bench/resource allocation; announcements/results/profile. Pages: My Events/Registrations if no equivalent exists, Registration Detail, My Team/Invitation, Project/Submission, Schedule, QR/Attendance, Venue/Allocation, Announcements/Results, Profile. Every API request verifies the participant's membership and record ownership for the selected event. Event A data must never bleed into Event B.

### 6.8 Technical Staff — `/technical-staff`
Home: assigned event/rooms; equipment/setup checklists; work orders/readiness; technical incidents; schedule changes. Pages: Assigned Rooms/Equipment, Setup Checklist, Work Orders, Incident Detail/Report, Operational Schedule/Profile. No inherited participant management, judging or organization-admin privileges.

### 6.9 Resource Manager — `/resource-manager`
Home: assigned event and inventory scope; persisted stock status; kit/meal/resource allocation; issue/return/reconciliation; exceptions and audit history. Pages: Inventory, Allocation/Distribution, Kit or Meal Handoff, Returns/Reconciliation, Resource Audit/Reports, Profile. All changes event-scoped and auditable unless explicit organization authority says otherwise.

### Personal Event Mode
Architecture mentions independent-organizer mode. Decide whether it belongs in this release. If retained, confirm a canonical home (possibly `/personal-events`) for owned events/create/details and scoped operations. Do not fabricate an organization or ship non-functional navigation.

## 7. Route manifest and canonical mapping

Create a typed route manifest from the current route inventory. Each entry records canonical path/aliases, public/protected status, required role/permission, organization/event context, navigation label, API/data source, allowed states and direct-load/refresh tests. Use it for navigation, breadcrumbs, active state and route tests. Unknown protected routes fail closed.

| Area | Candidate canonical path | Decision |
|---|---|---|
| Homepage | `/` | Exists; audit CTA and claims |
| Account creation | `/register` | Exists; account-only semantics |
| General login | `/login` or current homepage surface | Confirm before adding |
| Event portal | `/events/portal?eventId=…` or approved static-safe equivalent | Resolve duplicate route forms and issues #22/#28 |
| Event registration | `/events/register?eventId=…` | Proposed distinct enrollment workflow |
| Event login | `/events/login?eventId=…` | Exists; verify canonical link generation |
| Organization Admin | `/dashboard` | Confirm guard and API scope |
| Event Admin | selected-event overview | Choose static-compatible contract |
| Coordinator | `/control-center` | Confirm role map |
| Super Admin/Judge/Volunteer/Participant/Technical/Resource | Existing canonical role paths above | Audit each route/data source |
| People & Roles | existing `/people` with organization/event context | Verify CRUD and access scope |
| Event detail | agreed static-safe event context | No sample-ID fallback |
| Invitation/errors/profile | existing canonical routes | Reuse; do not duplicate |

Add a page only if it closes a distinct workflow or security boundary. Otherwise reuse a canonical route with explicit context or an intentional compatibility redirect.

## 8. Backend and security contract

Review existing APIs before naming or adding endpoints. Required capabilities include public-safe event metadata and explicit registration availability; create/read/cancel registration; user's authorized event registrations; team create/join/invitation; event login and role resolution; event-specific participant data; event-admin roster; staff invitation/assignment/revocation; and centralized link generation.

For every private API call, verify:
- token/session and account status;
- event exists and state permits action;
- caller owns the organization or has current event assignment/registration;
- requested team/submission/scorecard/venue/pass/resource/incident belongs to the same event;
- role/permission permits the action;
- participants access their own records except explicit authorized staff access;
- invitations are scoped, expiring, revocable and single-use;
- tenant/event filters are applied in data queries, not only after retrieval.

Test altered IDs, stale/revoked assignments, cross-event/team/object references and direct API calls. Duplicate submit must not create duplicate registration/team membership. Re-login/refresh must restore server status. Errors must not leak private data.

## 9. UI states and accessibility

Each page needs a clear title and context, relevant primary action, API-backed data, loading state, meaningful empty state, field-level validation, retry where safe, confirmation for destructive actions, success only after API confirmation, mobile layout and keyboard-accessible controls.

Support distinct loading, empty, ready, validation, unauthenticated (401), forbidden (403), not found (404), duplicate/conflict, event closed/ineligible, network/service failure and revoked-permission states. Avoid generic mock fallbacks.

## 10. Implementation phases and exit criteria

| Phase | Priority | Deliverables | Exit criteria |
|---|---|---|---|
| 0. Baseline/decisions | P0 | Route-role-link-API inventory; inspect models/migrations; approve URL, registration/team contract; classify keep/share/merge/redirect/build/remove | Unknowns recorded; owner approves contract; no schema changes yet |
| 1. Event portal/links | P0 | Central link builder; event details and registration/login CTAs; open/closed/unavailable states; compatibility decision with issues #22/#28 | Each link resolves the right event on GitHub Pages; direct open/refresh pass; unknown event never falls back |
| 2. Persisted enrollment | P0 | Existing-model-first API/data flow; eligibility, duplicates, idempotency, account continuation and team policy | A persists only A; B needs separate enrollment; status survives refresh/re-login; closed/unknown event denied |
| 3. Event login/role resolution | P0 | Event identity; allowed workflows from backend; active registration/assignment checks and safe errors | No role elevation via picker; unassigned event/role denied |
| 4. Participant workspace | P0 | Replace fixture/local state with event-scoped APIs for registration/team/submission/schedule/QR/attendance/allocation/results as supported | Data is API-backed or explicitly unavailable; cross-event tests pass |
| 5. Organization + Event Admin | P0 | Organization event hub; event overview/configuration; people/roles and per-event link actions | Organization Admin sees own org; Event Admin sees assigned event only |
| 6. Coordinator + staff | P1 | Operations center, Judge queue/scoring, Volunteer shifts/tasks, Technical work orders, Resource inventory | All actions API-backed and permission-tested |
| 7. Super Admin + session/profile | P1 | Governance, account/profile, session/revocation behavior | Cross-org actions explicit/audited; no self-elevation |
| 8. Route manifest/consolidation | P0 | Typed manifest, shared shells, aliases, stale/sample link cleanup | Nine roles have one canonical home and approved navigation/denial map |
| 9. Release acceptance | P0 gate | Frontend build, backend suite, cross-scope API tests, browser test matrix, deployed evidence and roadmap update | Exact commit/build/tests/deployment/live acceptance recorded separately |
| 10. Production DB/security | Independent P0 gate | Issue #24 runtime DB identity/grants, backup/restore, staging, migration/rollback and approval | No production security/schema changes until explicit approval and verified evidence |

**Recommended order:** resolve the canonical static-safe event URL and registration-availability contract; implement persisted event enrollment using existing models where possible; validate the complete participant journey; then expand role dashboards. Continue existing Judge/membership/security work in coordination with the roadmap.

## 11. Acceptance test matrix

| Scenario | Required positive result | Required negative/edge test |
|---|---|---|
| Event portal | Correct identity and links retain event context | Unknown ID never displays a sample/other event |
| Registration A/B | Registration persists independently for each event | A membership never creates B membership |
| Participant data | Only own authorized records for selected event | Altered event/team/submission ID denied |
| Event login | Registered participant/assigned staff reaches allowed workspace | Selecting a privileged role cannot grant it |
| Organization Admin | Own organization events manageable | Other organization denied |
| Event Admin | Assigned event operations work | Unrelated event denied |
| Judge | Assigned teams and permitted scorecards only | Unassigned team/other judge's private scorecard denied |
| Coordinator/Volunteer | Assigned tasks/shifts and allowed actions work | Other worker/out-of-scope mutation denied |
| Technical/Resource | Assigned operations work | Cross-event changes denied |
| Retry/invitation | Idempotent registration; valid invite works | Duplicate, expired, revoked, reused, wrong-event invite denied |
| Navigation | All allowed menu links work | Direct protected route/API still denied |
| Static hosting | Copy/direct open/refresh/back/forward/mobile work | No reliance on unbuilt dynamic routes |
| Failures/revocation | Useful closed/404/network/permission state | No false success or stale revoked access |

## 12. Risks and mitigations

- **Static URL mismatch:** one canonical contract, centralized builder, deployed direct-load/refresh tests.
- **Account mistaken for enrollment:** separate account and event-registration states; server-confirmed confirmation.
- **Event ID treated as permission:** authorize principal + membership and validate every related object server-side.
- **Duplicate registration schema:** inspect Event/EventMember/Team/TeamMember before migration.
- **Generic role dashboards:** one canonical home per role; share UI primitives only.
- **Mock values presented as live:** remove production fallbacks or label demo mode explicitly.
- **Premature RLS/grant rollout:** retain issue #24 staging, runtime identity, backup/restore and approval gate.
- **Broken legacy links:** map aliases and references before removing or renaming routes.

## 13. Decisions required before enrollment implementation

1. Are individual entries permitted for every event, or may events require teams?
2. Is registration public, approval-based, invitation-only, or configurable per event?
3. Which fields are common versus event-configurable?
4. Are registrations immediate, pending approval or waitlisted (if capacity is supported)?
5. Can one account participate in multiple events? This plan assumes yes, with separate enrollment records.
6. What is the final static-safe URL contract and legacy-link compatibility period?
7. Is Personal Event Mode in this release or deferred?
8. Which existing route is canonical for general login and profile?

## 14. Definition of done

- All pages/links mapped to audiences, permissions and data sources.
- Each of the nine roles has one canonical home and approved navigation/denial matrix.
- Each event's portal, registration and login links work on the deployed static host.
- Event enrollment persists separately from account creation and separately per event.
- Cross-event isolation is enforced and regression-tested at API/data layer.
- Registration state survives refresh and re-login.
- Dashboards show API data or explicit unavailable/empty states, never unpersisted success.
- Frontend/backend tests, deployment and live browser acceptance are documented separately.
- Roadmap records exact commit/test/deployment evidence.
- Production DB/security changes remain blocked until their independent gate passes.

## 15. Repository references

- [System architecture](https://github.com/RAHUL-TKRCET/EVENTOPS-2026/blob/main/SYSTEM_ARCHITECTURE.md)
- [README](https://github.com/RAHUL-TKRCET/EVENTOPS-2026/blob/main/README.md)
- [Roadmap](https://github.com/RAHUL-TKRCET/EVENTOPS-2026/blob/main/data/roadmap.csv)
- [Route inventory audit](https://github.com/RAHUL-TKRCET/EVENTOPS-2026/blob/main/docs/implementation/route-inventory-audit-2026-10-12.md)
- [Role-aware IA plan](https://github.com/RAHUL-TKRCET/EVENTOPS-2026/blob/main/docs/implementation/role-aware-information-architecture-and-participant-registration-plan-2026-10-12.md)
- [Next implementation plan](https://github.com/RAHUL-TKRCET/EVENTOPS-2026/blob/main/docs/implementation/next-implementation-plan-2026-10-12.md)
- [Issue #35](https://github.com/RAHUL-TKRCET/EVENTOPS-2026/issues/35)
- [PR #5](https://github.com/RAHUL-TKRCET/EVENTOPS-2026/pull/5)
- [PR #36](https://github.com/RAHUL-TKRCET/EVENTOPS-2026/pull/36)

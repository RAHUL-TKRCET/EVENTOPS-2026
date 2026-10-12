# EVENTOPS-2026 — Role-Aware Information Architecture & Participant Registration Plan

**Prepared:** 2026-10-12  
**Tracking issue:** [#35 — Role-aware information architecture and participant registration](https://github.com/RAHUL-TKRCET/EVENTOPS-2026/issues/35)  
**Status:** Planning only. This document does not mean any of the listed UI/API work is implemented.

## 1. Product intent to preserve

EVENTOPS is not simply a collection of dashboards. Its core product promise is to let an organization coordinate multiple events in one place, while every event has its own people, responsibilities and operations. People enter an event through a shareable event link and get the workspace appropriate to their verified role and assignment.

The architecture sources describe:
- Organization Mode for an institution/company managing multiple events, plus Personal Event Mode for independent organizers without a fake organization.
- One event entry point for event information and eligible users, with distinct role workflows after authentication.
- Zero-paperwork event operations: team/participant registration, QR passes and attendance, teams/projects, schedules, judging/evaluations, venues and allocations, resources, incidents and communication.
- Least privilege: organization admins manage only their organization; event members only their assigned events; participants only their own registration/team data; platform governance is separate.
- A clear distinction between intended features and currently verified implementation.

**Role taxonomy to use as the starting point:** the current application role type/configuration covers 9 roles: SUPER_ADMIN, ORGANIZATION_ADMIN, EVENT_ADMIN, COORDINATOR, JUDGE, VOLUNTEER, PARTICIPANT, TECHNICAL_STAFF, and RESOURCE_MANAGER. Older documentation mentions other personas such as Track Lead, Mentor, Sponsor or Organizer; treat those as proposed/legacy terminology until the product owner explicitly adds them to the authoritative role model. Do not invent new live routes or permissions from a diagram alone.

## 2. Source-grounded findings from current `main`

### Confirmed registration gap
1. `app/register/page.tsx` already has two account options: Organization Head and Participant.
2. The public homepage `app/page.tsx` shows organization-head account creation and sign-in as its prominent account actions. It does not clearly send a visitor to the Participant option on `/register`.
3. `app/events/portal/page.tsx` loads public event metadata and offers a role-login action, but it does not offer a participant-registration action.
4. `backend/app/api/v1/auth.py` allows public registration only for `PARTICIPANT` and `ORGANIZATION_ADMIN`; it rejects self-registration for staff/privileged roles. Organization Admin signup creates an organization and active organization membership.
5. Participant registration via `/auth/register` creates an account but has no event ID in its request contract, and does not itself create an event registration or team membership. **Account creation is not the same as registering for an event.**

### Confirmed page/workflow mismatch
- Participant home, team and project pages currently use fixture data or local state; the schedule page includes a hard-coded sample timeline. At least one local project-save action displays success without persisting through an API.
- `ROLE_CONFIGS` maps Event Admin and Coordinator to the same `/dashboard` portal path. `app/dashboard/page.tsx` special-cases Organization Admin and otherwise provides a shared event dashboard, so role-specific tasks can be obscured by one generic surface.
- The role sidebar contains hard-coded/sample destinations such as an event-specific `evt-01` roles URL and a Judge evaluation link with sample team `T042`. These links are not reliable routing contracts.
- `AppShell.tsx` has route-specific layout exceptions, including hiding the main shell only on the Organization Admin root page; project conversations also recorded that organization management subpages retained unwanted shared navigation.
- `lib/permissions.ts` mixes role definitions, home routes and path-prefix checks. Unmatched paths currently fall through to an authorized result in the frontend guard; route visibility must be made explicit. This guard is a UX layer, not a substitute for backend authorization.
- Event links must remain compatible with Next.js static export on GitHub Pages. Issues #22 and #28 already track the canonical event URL and shared event portal; preserve their work rather than creating a second competing URL design.
- Existing issues #23 and #25 cover role-aware navigation/dashboard data truth and the membership/invitation lifecycle. Coordinate with those issues and use #35 as the cross-cutting product IA/participant registration plan.

## 3. Design principles

1. **Do not add a page just to duplicate another role's dashboard.** A route should exist because a user journey or permission boundary needs a distinct destination.
2. **Share implementation primitives, not incorrect workflows.** Tables, form fields, status badges, empty/loading/error states, confirmation dialogs and event context headers may be shared. Participant self-service must not reuse an admin-management screen; Judge scoring must not reuse an admin roster page.
3. **One canonical route per concept.** Old links should redirect to the canonical route or show an intentional compatibility message. Do not keep parallel pages that do the same job differently.
4. **Workspace and event context must be visible.** Organization management is organization-scoped; event operations are tied to a selected event; participant and staff views use the verified assignment context; Personal Event Mode has an explicit owner context.
5. **Registration is a state transition, not just a form.** Account → event registration → team membership/assignment → participant workspace must be recorded by the backend and have clear status.
6. **Backend authorization is authoritative.** Client-side navigation visibility never grants permissions. A query parameter or event URL identifies the event; it does not grant access.
7. **Static URLs are first-class.** New events must work when their links are copied, opened directly, refreshed, or opened on mobile under the configured GitHub Pages base path.
8. **Show data truthfully.** A shared component must render API data or explicit loading/empty/unavailable states. Mock data may appear only in an explicitly identified demo mode, never as live operations.

## 4. Target information architecture

This is the intended route contract to validate during the route inventory. Paths marked **proposed** require route/API confirmation before coding.

### A. Public and account entry
| Canonical destination | Purpose | Entry/action |
|---|---|---|
| `/` | Product overview and clear first-step choices | **Create an organization**, **Register for an event**, **Open event link**, **Sign in** |
| `/register` | Account creation only: Organization Admin or Participant | Visible from homepage; do not offer self-assignment to staff/admin event roles |
| `/login` | General account sign-in for platform/organization accounts | Separate “I have an event link” route for event-scoped roles |
| `/events/portal?eventId=…` | Public-safe event details and the available next actions | **Register as a participant** only when event registration is open; **Sign in to an existing assignment** for staff |
| `/events/register?eventId=…` **proposed** | Event-specific participant registration/onboarding | Must confirm the event is published and accepting registration before creating registration data |
| Existing invitation-acceptance route | Accept an administrator-issued role invitation | Preserve the repository’s actual canonical route; do not create a duplicate acceptance URL |

### B. Workspace entry
| Workspace | Canonical home | What it owns |
|---|---|---|
| Platform Super Admin | `/super-admin` | Cross-organization governance, global users, system/operational health, audit views |
| Organization Admin | `/dashboard` (organization home) | Organization profile, its event list, people/roles, judge roster and assignments, organization settings |
| Event Admin | Selected event overview, using the static-compatible event URL contract | Setup and operations for one assigned event, not organization-wide governance |
| Coordinator | `/control-center` or the canonical coordinator home selected in route inventory | Live operational coordination, attendance status, incidents, shifts/logistics |
| Judge | `/judge` | Assigned teams, evaluation rubric, submission, own score history and event schedule |
| Volunteer | Existing canonical volunteer home (`/volunteers` or the audited replacement) | My shifts/tasks, allowed scans, event information, incident reporting |
| Participant | `/participant` | Their own event registration, team, project/submissions, schedule, QR pass, attendance, allocation, announcements and results |
| Technical Staff | `/technical-staff` | Assigned rooms/equipment, readiness work, technical tasks and incidents |
| Resource Manager | `/resource-manager` | Stock/inventory, kits/meals, distribution and reconciliation |
| Personal Event Mode | Existing or confirmed `/personal-events` hub | Create/manage independently owned events without creating a fake organization |

**Important:** Do not assume every desired destination already works. The first implementation deliverable is a route inventory identifying which routes exist, which are only linked, which are mock-backed, and which are merely described in architecture documents.

### C. Role-specific page sets

| Role | Pages/features that should be distinct | Pages/features it should not inherit by default |
|---|---|---|
| Super Admin | Platform overview, organizations/tenants, user governance, system health, global settings/audit | Organization owner’s day-to-day event tools unless explicitly required |
| Organization Admin | Organization overview, events list/create, people & role assignments, judge management, organization settings | Participant self-service or event-role scoring |
| Event Admin | Event overview/configuration, teams/participant registrations, staff assignments, rounds/rubrics, schedule, venues, allocation, attendance, resources, incidents, reports | Cross-organization/global tenant administration |
| Coordinator | Live command view, queues/attendance, shifts/logistics, assigned staff, incidents and communication | Event deletion, global settings, judging-score management unless delegated |
| Judge | My assigned teams, team/submission detail, rubric/evaluation, own history, event schedule | People management, organization settings, unrelated teams, other judges’ scorecards |
| Volunteer | My shifts/tasks, assigned zone, permitted QR scans, report incident, event instructions | All-event rosters, judging, arbitrary resource mutations |
| Participant | Registration status, team create/join (subject to event rules), roster, project submission, schedule, QR pass/check-in status, venue/bench allocation, announcements/results/profile | Staff tools, other teams’ private data, judging or admin pages |
| Technical Staff | Assigned rooms, equipment/readiness checklist, work orders, technical incident reports | Participant management and organization governance |
| Resource Manager | Inventory, allocation/distribution, meal/kit verification, stock levels and audit | Judge scoring, account management, unrelated event resources |

Pages can share the same presentational components where fields/actions are actually shared. They should not share the same navigation or dashboard merely because the layouts look similar.

## 5. Participant registration workflow

### Required entry points
- Homepage includes a clear Participant/event-registration route, not only an organization-creation CTA.
- A public event page exposes **Register as a participant** when the event is accepting registrations.
- A separate action supports already-assigned Event Admin/Judge/Volunteer/staff sign-in; it must not present staff roles as public self-registration.
- Participant account creation should retain the existing `/register` endpoint contract and must not silently imply event enrollment.

### Proposed end-to-end flow
1. Visitor opens the event link; frontend resolves minimal public metadata via the configured API.
2. The backend response supplies public availability such as published/registration-open state. If the current schema lacks an explicit registration window/state, add a reviewed API/data contract rather than deriving availability from the `DRAFT` label or a frontend constant. Default to closed when the backend cannot establish eligibility.
3. Visitor chooses register, signs in or creates a Participant account, then returns to the same event context.
4. The participant submits event-specific registration data. Backend validates event state, required fields, duplicate registration and any capacity/eligibility rules.
5. Team handling follows the event’s declared policy: team captain creates/registers a team and invites members, or an eligible participant joins through a verified invite. Do not let a user attach themselves to arbitrary teams by submitting a team ID.
6. Persist registration and team membership in a transaction or explicit recoverable workflow; return a stable status such as submitted/confirmed/waitlisted/closed only if that state is supported by the API.
7. Send the participant to a registration confirmation/status view, then to `/participant` with verified event/team context.
8. Event Admin sees the persisted participant/team record in the event management view. Participant dashboard pages read the same persisted records.
9. Re-entry and refresh must recover registration status from the backend, not volatile browser state.

### API/data-contract audit before implementation
- Inventory existing event, team, team-member, participant, invitation and registration models/endpoints before creating any new table or route.
- Define explicit event registration-open/publish policy; never assume all known event IDs are open for public registration.
- Define team ownership, membership invite/accept rules, duplicate-account behavior and whether single-person entries are permitted. **Recommended initial assumption for hackathons:** a participant registers under a team-captain flow or joins a team invitation; confirm this against event rules before building it as a constraint.
- Do not allow participant registration to assign Event Admin, Judge, Volunteer, Coordinator, Technical Staff, Resource Manager or Super Admin roles.
- Make duplicate email, event closed, full capacity (if supported), invalid invite, duplicate registration, missing event, forbidden, validation failure and backend unavailable states clear and non-destructive.

## 6. Role-aware routing, layouts and page consolidation

### Build one route manifest
Inventory and then consolidate route definitions into one typed manifest/config used to derive:
- Canonical route and aliases/redirects.
- Public/protected status.
- Required workspace, event context and allowed role/permission.
- Sidebar/topbar entry, label, icon, and active-route rule.
- Static-export behavior (plain route versus query-parameter route).
- Required API/data source and whether demo mode is permitted.
- Route-level tests.

The frontend guard should explicitly deny unknown protected routes rather than treating every unmatched path as allowed. Keep backend authorization checks and cross-organization/event tests regardless of what the UI hides.

### Shared shell model
Use a small number of coherent shells:
1. **Public shell** for landing, sign-up, event details and event registration.
2. **Organization shell** for the Organization Admin’s cross-event administration pages, with a consistent focused layout on dashboard, events, people/roles, judges and settings.
3. **Event operations shell** for Event Admin/coordinator workflows with an obvious selected-event context.
4. **Role portal shells** for Judge, Volunteer, Participant, Technical Staff and Resource Manager. They may share a base frame and design tokens, but each role gets a task-relevant navigation set and homepage.
5. **Platform shell** for Super Admin governance.
6. **Personal-event workspace** for independent events if this architecture mode is retained for the first release.

### Components worth sharing
Buttons/forms/validation, table/filter/pagination primitives, status badges, page headers, event context selectors, empty/loading/error/retry states, confirmation dialogs, QR-card presentation, and generic read-only detail sections.

### Do not consolidate
- Do not collapse distinct routes such as `/participant/project` and `/judge/evaluation` into one generic page.
- Do not let Organization Admin’s event member management become the Judge’s self-service workflow.
- Do not share a “success” state or fabricated KPI across pages unless each operation is backed by the same confirmed contract.
- Do not keep parallel legacy pages if one canonical page plus a compatibility redirect meets the need.

## 7. Implementation phases and order

### Phase 0 — Route and feature inventory (P0)
**Deliverable:** `docs/implementation/route-inventory.csv` plus a reviewed sitemap.
- Enumerate every `app/**/page.tsx`, nested layout, route alias and navigation link.
- Record audience, workspace, event context, permission, entry points, data source (API/mock/local), actions, loading/error states, current test status, direct-load/refresh behavior, and keep/merge/redirect/new decision.
- Identify orphan routes, duplicate destinations, stale `evt-01`/sample IDs, dead links, routes no sidebar can reach, and pages reached only through stale hard-coded links.
- Compare current role enum/config against README and architecture docs; record one source of truth and separately label aspirational roles.

**Exit gate:** owner reviews the sitemap and role-to-page matrix before implementation removes/renames any route.

### Phase 1 — Public navigation and participant entry point (P0)
- Add explicit homepage paths for Organization setup, Participant registration, existing-user sign-in, and opening an event link.
- Add a participant-registration CTA to the public event portal, conditional on backend-confirmed registration availability.
- Retire misleading public wording such as “Create Super Admin” when the action is actually Organization Admin onboarding.
- Fix all event entry paths to use the same canonical static-host URL builder (coordinate with issue #22); preserve old links with redirects or clear instructions.
- Verify mobile navigation and keyboard/accessibility semantics.

**Exit gate:** a new visitor can discover the correct journey from the homepage without knowing a hidden URL.

### Phase 2 — Event-scoped participant registration contract (P0)
- Agree on event publication/registration state, allowed fields, team policy, duplicate rules, capacity/waitlist rules if applicable and registration statuses.
- Add/reuse backend APIs for event-specific registration and team create/join; validate every event/team membership server-side.
- Test account creation separately from event registration, repeated submissions, existing accounts, closed events, invalid team invitations, and cross-event ID tampering.
- Preserve invitation-only assignment for privileged/event-operational roles.

**Exit gate:** successful event registration returns a persisted record and can be retrieved after logout/re-login; a Participant account without a registration has no implied event/team membership.

### Phase 3 — Participant portal becomes data-backed (P0)
- Replace mock team/event/project/schedule/status data in participant pages with event-scoped APIs.
- Add explicit API contracts or disable unsupported actions; never show project-save success if no server write occurred.
- Provide first-time, pending registration, no-team, team-invitation, active participant, event-closed, and API-failure states.
- Make QR pass, attendance and allocation reflect persisted state and the event context.

**Exit gate:** registration → participant home → team/project/schedule/QR journey survives refresh and a new authenticated session.

### Phase 4 — Role-aware shell and route permissions (P0)
- Derive sidebar and active states from the centralized route manifest instead of maintaining separate, drifting conditions.
- Give Organization Admin pages a consistent organization shell; give Event Admin/coordinator event-scoped shells; tailor self-service roles to their own tasks.
- Change Event Admin and Coordinator away from a generic `/dashboard` mapping only after their destination and context are defined.
- Fail closed for unregistered protected frontend paths; enforce actual permission server-side at every API.
- Remove hard-coded sample event/team destinations from navigation.

**Exit gate:** each of the 9 implemented roles has one canonical home, a reviewed navigation map, explicit denied routes and direct-route tests.

### Phase 5 — Role page consolidation and completion (P1, can overlap after inventory)
- Review every dashboard and page against the role matrix. Classify as **Keep unique**, **Share component**, **Merge into canonical route**, **Redirect legacy route**, **Build missing page**, or **Remove after compatibility check**.
- Complete Judge assigned-team/scorecard work (issues #20 and #30); complete Volunteer data/shift work (issue #27); complete portal roles/auth (issue #28); complete People & Roles membership actions (issue #25).
- Keep organization-level judge/staff assignment different from judge self-service scoring.
- Ensure Event Admin operations pages are event-scoped; coordinator focuses on live operations; technical/resource staff see only their assigned workflow.
- Ensure Personal Event Mode is either implemented and tested as described or explicitly moved to future scope; do not show non-functional mode choices.

**Exit gate:** no duplicate page exists without a documented user/workflow reason, and no role sees irrelevant or misleading navigation.

### Phase 6 — End-to-end quality and release acceptance (P0 release gate)
- Automated route-map test: every visible navigation item resolves and is allowed for the role; every protected page is denied for an unauthorized role.
- Backend integration tests: account registration vs event registration, team membership, same-event allow, cross-event/org deny, expired invitation, revoked role and unknown event.
- Frontend tests: public CTA reachability; role navigation; empty/loading/error state; mobile; direct-open/refresh/back-forward under GitHub Pages base path.
- Validate the full participant and staff journey on deployed Pages + FastAPI, separately from CI build.
- Update roadmap with exact commit SHA, backend tests, frontend static build, deployments and live E2E as separate evidence.
- Keep database/RLS work gated under issue #24; this plan is not approval to change production grants, policies or schema.

**Exit gate:** each tested path has recorded evidence and only verified behavior is marked complete.

## 8. Acceptance matrix

| Journey | Required positive test | Required negative/edge test |
|---|---|---|
| Homepage → participant entry | Participant CTA is visible on desktop/mobile and opens the correct route | No hidden URL knowledge required; event ID is not fabricated |
| Event portal → register | Open event exposes CTA and preserves event context | Closed/draft/unknown event cannot silently register |
| Account → event registration | Persisted event registration appears after re-login | Account alone grants no event/team membership |
| Team join | Valid invitation adds the user to that one team/event | Arbitrary team ID, reused/expired invite, other event denied |
| Organization Admin | Manage events and memberships within own organization | Other organization’s event/data denied |
| Event Admin | Manage only the selected authorized event | Cannot govern unrelated organizations |
| Judge | See assigned teams and own scorecards only | Unassigned team and other judge’s scorecard denied |
| Volunteer / Coordinator | See assigned tasks and authorized operations | Another worker’s tasks or event resources denied |
| Technical / Resource | See and mutate only assigned operational objects | Out-of-scope writes are denied |
| Static hosting | Copied link, direct navigation, refresh and mobile open work | Unknown IDs show clear 404/unavailable states, never a fallback event |
| Data honesty | Values/statuses come from API or are labelled demo/unavailable | No mock data presented as production; no fake write success |

## 9. Product decisions to record before Phase 2

These points are not fully settled by the available sources and must not be silently assumed:
1. Is participation always team-based for the VISTERA/hackathon workflow, or can an individual register without a team?
2. Can participants self-register for every published event, or must some events remain invitation/approval-only?
3. Which registration fields are mandatory and configurable per event (college/organization, team name, track, project title, consent, etc.)?
4. Does an event require email verification or admin approval before a participant is confirmed?
5. Which parts of Personal Event Mode are required for this release versus future scope?

Recommended default is **public participant entry only for events explicitly opened for registration; role assignment never comes from a URL or a user-selected privileged role**. Team policy remains configurable/confirmed per event.

## 10. Related roadmap/issue dependencies

- **#35:** cross-cutting information architecture and participant registration plan (this document).
- **#23:** dashboard data honesty and role-aware navigation.
- **#28:** shared event portal and role-specific routing.
- **#22 / PR #5:** canonical static-export-safe event URL contract.
- **#20 / #30:** Judge workflow and real assignment resolver tests.
- **#25:** invite, membership and assignment lifecycle.
- **#27:** Volunteer data and assignments.
- **#33:** Organization Admin event hub live acceptance.
- **#24 / PR #8:** database security release gate; production DB changes remain separately blocked until prerequisites and explicit approval are recorded.

## 11. Source register

Reviewed project and repository sources:
- `SYSTEM_ARCHITECTURE.md` — universal event operations vision, dual Organization/Personal Event Mode, nine-role matrix, intended app structure and operational flows.
- Project reference `EVENTOPS-2026-Architecture.md` — organization-owned multi-event model, shared event entry, membership/permission boundaries, and implementation sequence.
- Project reference `deep-research-report.md` — user journeys, account/event role behavior, participant/team workflow, security, UI components and testing strategy.
- Project conversation notes from “Continue registration flow” and “Check GitHub Connection” — registration/backend mismatch, Organization Admin focused workspace, mock dashboards, and invitation/member lifecycle checkpoints.
- Current `main`: `app/page.tsx`, `app/register/page.tsx`, `app/events/portal/page.tsx`, `backend/app/api/v1/auth.py`, `app/participant/*`, `app/dashboard/page.tsx`, `components/layout/AppShell.tsx`, `components/layout/Sidebar.tsx`, `lib/permissions.ts`, `data/roadmap.csv`.
- Issues #20–#35, especially #22, #23, #24, #25, #27, #28, #30 and #33.

The source docs contain both current architecture and proposed future capabilities. This plan treats code/API observations as current evidence and design diagrams as intended behavior until live/API tests verify it.

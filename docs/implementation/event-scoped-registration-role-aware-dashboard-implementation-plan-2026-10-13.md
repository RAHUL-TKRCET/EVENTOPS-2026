# EVENTOPS-2026 — Event-Scoped Registration, Role-Aware Dashboards & Page Architecture Implementation Plan

**Status:** Draft — planning only  
**Date:** 2026-10-14  
**Repository:** [RAHUL-TKRCET/EVENTOPS-2026](https://github.com/RAHUL-TKRCET/EVENTOPS-2026)  
**Tracking issue:** [#35](https://github.com/RAHUL-TKRCET/EVENTOPS-2026/issues/35)  
**Roadmap:** [data/roadmap.csv](../../data/roadmap.csv)

> This is a plan, not a claim that the proposed behavior is already implemented. Existing findings below are based on repository sources reviewed for this plan.

## 1. Executive direction

EVENTOPS-2026 is a multi-event operations platform. Each event needs its own public portal, participant-registration link and event-login link. **Public participant registration itself creates the participant's event space and login identity. A participant must not be required to create an account or sign in before registering.** After successful registration, the system sends the participant an email containing their login details or a secure account-activation/login mechanism. Email delivery must be real and verifiable; the UI must not claim an email was sent if delivery was not confirmed.

A participant may register for multiple events, but each registration and its private records must be independently scoped. An event ID in a URL is context only and never proof of authorization.

**Non-negotiable rules**
1. A participant can submit the public event registration form without an existing account or authentication.
2. One successful registration creates/links the participant identity, persists membership/enrollment in that event, and initiates delivery of login details by email. No separate pre-registration account-creation step.
3. Registering for Event A must not register a participant for Event B.
4. Organization Admin manages only their organization and its events. Event Admin and event staff act only on assigned events and permissions. Super Admin is a separate platform-governance scope.
5. Role selection in a form or URL never grants a role.
6. Backend authorization is authoritative; frontend route guards/navigation are not security boundaries.
7. Event links must work with the Next.js static-export/GitHub Pages deployment, including copied links, direct opening and refresh.
8. Show success only after backend persistence; do not claim email delivery unless the mail provider confirms acceptance or the app clearly reports pending/unavailable delivery.
9. Inspect existing models and routes before adding new tables/pages. Keep production database/RLS changes behind existing security approval gates.

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

### Findings supported by those sources and latest product clarification

- The role enum contains nine roles: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`, `EVENT_ADMIN`, `COORDINATOR`, `JUDGE`, `VOLUNTEER`, `PARTICIPANT`, `TECHNICAL_STAFF`, `RESOURCE_MANAGER`.
- Event creation already constructs query-style, static-compatible event portal/login URLs; existing portal/login code attempts event-context and active-assignment checks.
- The existing implementation currently makes participant enrollment require an authenticated participant session (`get_current_user` and participant-scope validation in `/auth/event-registration`). That does **not** match the intended product requirement and must be redesigned as a public registration endpoint.
- Existing account creation and event enrollment are separate operations today. This should change for the public participant journey: event registration should create or link a participant account/identity and persist event enrollment in the same logical registration flow.
- The route audit reports existing Event, EventMember, Team and TeamMember tables. Reuse/extend them if their semantics fit; do not automatically add a parallel registration table.
- Current role configuration maps Event Admin and Coordinator to `/dashboard`; the existing IA plan calls for distinct event overview and coordinator workspace destinations after route/context decisions are confirmed.
- The route inventory reports 124 App Router page components, but inventory alone does not prove route authorization, links, API correctness, direct-load/refresh or production behavior.
- Roadmap statuses and dependencies include static URL decisions, end-to-end browser verification and an independent database-security gate. Use the roadmap for current recorded evidence; do not infer unrecorded live success.

## 3. Goals and boundaries

Deliver predictable public and event entry flows, public participant registration that creates the participant's event space and login identity, reliable email delivery of access details, a purposeful dashboard and navigation map for every role, server-enforced organization/event/team isolation, a route inventory/consolidation decision, and direct-link compatibility under static hosting.

Do not rebuild the app wholesale, require an account before event registration, allow public self-selection of privileged roles, grant staff roles through participant registration, or rename/delete routes before auditing existing links and behavior.

Logical layers:
1. Public homepage, event discovery/portal, public event registration, event-role login, invitation acceptance, status and error pages.
2. Organization workspace for owned events, organization people and settings.
3. Selected-event workspace for event configuration and operations.
4. Role-specific workflows.
5. Platform governance.
6. FastAPI authorization/data layer.
7. Email delivery/credential or activation workflow.
8. Static-export-compatible route and link layer.

Access is resolved from authenticated identity plus membership/assignment/permission records after registration. Client-provided event/team/object IDs identify requested resources; the server validates every relationship and action.

## 4. Public pages and entry contract

Proposed paths must be reconciled with the 124-page route inventory before adding pages.

| Page | Structure and behavior |
|---|---|
| `/` Homepage | Product overview; Create Organization; Register for an Event; Open Event Link; Admin Sign In; help. No public Super Admin signup. |
| `/events` Event discovery (optional) | Search/filter published public events, event cards, empty/error states; only show API-approved public events. |
| `/events/portal?eventId=…` Event portal candidate | Event identity, public details, date/venue, registration status/rules, Register and Event Role Login actions, contact/help. Register only when backend says open/eligible. No account/login prerequisite. |
| `/events/register?eventId=…` Public registration | Event context and public form; event/team policy, consent, validation, submit, persisted confirmation. Visitors can register while unauthenticated. No login or create-account prerequisite. |
| `/events/login?eventId=…` Event-role login | Event identity and credentials for assigned event personnel only. Backend validates assignment; role selection cannot grant access. Participant login after registration should be reached through the participant's issued credentials/appropriate participant route, not as a prerequisite to registration. |
| `/register` Account/organization onboarding | Organization Admin onboarding only (or other explicitly approved identity recovery flow). Do not route public event participants here as a required step. |
| `/login` General admin login | Only Organization Admin and Super Admin. Event-scoped operational roles use event login; participants use credentials created by registration and the participant login path chosen by the route audit. |
| Invitation acceptance | Reuse the existing canonical route; show intended event/org/role and validate token expiry, scope, revocation and single-use server-side. Staff assignment remains separate from participant self-registration. |
| Registration confirmation | Show persisted registration identity/status and next steps; explain whether email is sent, pending, or could not be queued based on actual delivery-provider result. |
| Profile/session | Reuse the canonical profile route after audit; account identity remains distinct from event-specific membership data. |
| Forbidden/not-found/unavailable | Distinguish 401, 403, 404, closed registration and network/service/email errors. Never fall back to sample `evt-01` or another event. |

### Per-event links and portal states

Every event created by an authorized admin should expose a portal link, participant-registration link and event-login link. Centralize link generation so event creation, dashboards, email/invitations and public entry use the same contract. Resolve existing query-style and dynamic route variants alongside roadmap issues #22/#28 before declaring one canonical route.

Portal states: loading; published/open; published/closed; approval/invitation-only if supported; draft/unpublished; unknown event; public metadata unavailable; expired event; registration submitted; duplicate/already registered; registration service unavailable. Registration availability must be explicit in the backend contract, not inferred from an ID or frontend constant.

## 5. Public participant registration and participant login

### Required journey: no prior account

1. Participant opens Event A's public registration link.
2. The public page displays Event A identity, registration state, and required fields.
3. Participant submits the form without signing in or creating an account first.
4. Backend validates that Event A exists, is published and accepts registration; validates required fields, eligibility, capacity if implemented, and duplicate rules.
5. Backend creates or safely links the participant user identity and creates the Event A participant membership/registration in a transaction or other recoverable, idempotent workflow. The participant must not receive a role beyond `PARTICIPANT`.
6. System generates a secure login credential or account-activation/reset mechanism and queues/sends an email to the submitted address. Never log plaintext passwords or persist them outside the normal secure password-hash mechanism.
7. The confirmation page displays a registration/reference ID and backend-confirmed status. Only say login details were emailed if provider delivery was accepted; otherwise explain the delivery state and safe recovery path.
8. Participant later signs in with the issued details and reaches the participant workspace with Event A selected and API-backed registration data.

**No intermediate “Create participant account” action is required. Registration itself provisions the participant's identity and event space.**

### Existing email/account conflicts

- If the email is already associated with a participant account, do not create a duplicate identity or expose private account data. Product contract must decide whether to send a sign-in/claim flow, require secure email proof, or return a privacy-preserving message.
- If an email already has a privileged or staff account, public registration must never downgrade, elevate, or silently convert its role. Require a safe account-linking/identity-proof policy or route to organizer support.
- Rate-limit public registration and credential email requests. Add abuse controls, validation, duplicate handling and audit events that do not store secrets.
- Never email a permanent plaintext password if a secure one-time activation link or set-password process is supported. If the product specifically requires initial login details, send only a securely generated temporary credential, require password change at first login, expire it, and ensure the email provider integration is configured and tested.

### Multiple events and duplicate registration

- One participant identity may participate in multiple events, but each event enrollment is a separate `EventMember`/registration record.
- Registration for Event B must separately validate Event B and persist a separate membership.
- Retrying the same submission must not create duplicate identities or enrollments. Define an idempotency strategy and enforce participant/event uniqueness in the database after migration/security review.
- Existing users registering for another event should be securely verified by email or authenticated with an existing session as part of that submission, without requiring an account-creation step. Account reuse must not be based on an unverified email string alone.
- Team creation/joining is a separate step only where the event requires it. The individual registration itself must create the participant's event space.

### Registration contract to define

- Public endpoint accepts no bearer-auth requirement for a first-time participant; protect it through validation, rate limits, bot/abuse controls and transactional behavior.
- Event ID validates event context and state; it is never authorization by itself.
- Server validates/normalizes email and required registration fields.
- Server-generated user/registration IDs and timestamps; server assigns only `PARTICIPANT`.
- Event-specific required fields/consent and policy.
- Team ID only via a valid same-event team/invitation flow.
- Unique participant/event registration rule and idempotent retry behavior.
- Safe behavior for pre-existing users/emails, duplicate requests and email-send failures.
- Approved states such as confirmed/pending/waitlisted only if the backend supports them.
- Email provider integration, configuration/secret handling, delivery status, retry/outbox policy and first-login credential/reset behavior.
- Public confirmation must not leak whether an email belongs to a privileged account.

Before implementation, inspect existing Event, EventMember, User, Team and TeamMember ORM models, migrations, constraints and APIs. Decide whether the existing membership model can represent participant registration status and lifecycle. Only propose a new table if the reviewed model cannot support the contract.

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
Home: selected event and persisted registration status; team status/roster if applicable; project/submission; schedule/rounds/venue; QR pass and attendance; room/bench/resource allocation; announcements/results/profile. Pages: My Events/Registrations if no equivalent exists, Registration Detail, My Team/Invitation, Project/Submission, Schedule, QR/Attendance, Venue/Allocation, Announcements/Results, Profile. The public registration process provisions the participant's event space; sign-in is used for subsequent access, not to begin registration. Every private API request verifies the participant's membership and record ownership for the selected event. Event A data must never bleed into Event B.

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
| Organization onboarding | `/register` | Organization Admin creation; must not be prerequisite for participant event registration |
| Admin login | `/login` | Only Organization Admin and Super Admin |
| Event portal | `/events/portal?eventId=…` or approved static-safe equivalent | Resolve duplicate route forms and issues #22/#28 |
| Public participant registration | `/events/register?eventId=…` | Public and unauthenticated; submission creates/links participant identity and event membership |
| Event-role login | `/events/login?eventId=…` | Event Admin and assigned event personnel only; verify canonical link generation |
| Participant login | Existing canonical participant auth route to be identified by route audit | Supports accounts provisioned by registration; not a gate before registration |
| Organization Admin | `/dashboard` | Confirm guard and API scope |
| Event Admin | selected-event overview | Choose static-compatible contract |
| Coordinator | `/control-center` | Confirm role map |
| Super Admin/Judge/Volunteer/Participant/Technical/Resource | Existing canonical role paths above | Audit each route/data source |
| People & Roles | existing `/people` with organization/event context | Verify CRUD and access scope |
| Event detail | agreed static-safe event context | No sample-ID fallback |
| Invitation/errors/profile | existing canonical routes | Reuse; do not duplicate |

Add a page only if it closes a distinct workflow or security boundary. Otherwise reuse a canonical route with explicit context or an intentional compatibility redirect.

## 8. Backend, identity, email and security contract

Review existing APIs before naming or adding endpoints. Required capabilities include public-safe event metadata and explicit registration availability; unauthenticated participant registration/provisioning; status/confirmation; secure credential delivery or activation; participant login and authorized event resolution; event-specific participant data; event-admin roster; staff invitation/assignment/revocation; and centralized link generation.

For every private API call, verify:
- token/session and account status;
- event exists and state permits action;
- caller owns the organization or has current event assignment/registration;
- requested team/submission/scorecard/venue/pass/resource/incident belongs to the same event;
- role/permission permits the action;
- participants access their own records except explicit authorized staff access;
- invitations are scoped, expiring, revocable and single-use;
- tenant/event filters are applied in data queries, not only after retrieval.

For the public registration endpoint:
- Permit an unauthenticated first-time request, but apply rate limiting and abuse controls.
- Validate event status/deadline and required fields on the server.
- Atomically or recoverably create/link identity and membership; protect against duplicate races and partial failures.
- Never accept requested privileged roles; assign `PARTICIPANT` server-side.
- Use secure temporary credentials with forced change/expiry or preferably a single-use activation/set-password mechanism. Never store or log plaintext secrets.
- Send a real email using configured provider credentials; support retry/observability and do not falsely report delivery.
- Avoid user/email enumeration and ensure existing privileged accounts are never overwritten/downgraded.
- Validate altered IDs, stale/revoked assignments and cross-event/team/object references. Duplicate submit must not create duplicate registration/team membership. Re-login/refresh must restore server status. Errors must not leak private data.

## 9. UI states and accessibility

Each page needs a clear title and context, relevant primary action, API-backed data, loading state, meaningful empty state, field-level validation, retry where safe, confirmation for destructive actions, success only after API confirmation, mobile layout and keyboard-accessible controls.

Support distinct loading, empty, ready, validation, unauthenticated (401), forbidden (403), not found (404), duplicate/conflict, event closed/ineligible, network/service failure and email pending/failure states. For public registration, never force login/create-account before submission. Avoid generic mock fallbacks.

## 10. Implementation phases and exit criteria

| Phase | Priority | Deliverables | Exit criteria |
|---|---|---|---|
| 0. Baseline/decisions | P0 | Route-role-link-API inventory; inspect models/migrations; approve public registration/identity/email contract; team policy; approve URL contract | Unknowns recorded; owner approves contract; no schema changes yet |
| 1. Event portal/links | P0 | Central link builder; event details and registration/login CTAs; open/closed/unavailable states; compatibility decision with issues #22/#28 | Each link resolves the right event on GitHub Pages; direct open/refresh pass; unknown event never falls back |
| 2. Public participant registration | P0 | Unauthenticated registration form/API; participant identity provisioning; event membership; duplicate/idempotency policy; credential/activation email; safe confirmation and retry | A first-time visitor registers without an account; exactly one identity/enrollment is persisted; email workflow tested; A/B isolation passes |
| 3. Participant login/role resolution | P0 | Login using issued credentials/activation; participant's authorized events; event-role login for assigned personnel; safe errors | Successful registration provisions later access; no role elevation via picker; unassigned event/role denied |
| 4. Participant workspace | P0 | Replace fixture/local state with event-scoped APIs for registration/team/submission/schedule/QR/attendance/allocation/results as supported | Data is API-backed or explicitly unavailable; cross-event tests pass |
| 5. Organization + Event Admin | P0 | Organization event hub; event overview/configuration; people/roles and per-event link actions | Organization Admin sees own org; Event Admin sees assigned event only |
| 6. Coordinator + staff | P1 | Operations center, Judge queue/scoring, Volunteer shifts/tasks, Technical work orders, Resource inventory | All actions API-backed and permission-tested |
| 7. Super Admin + session/profile | P1 | Governance, account/profile, session/revocation behavior | Cross-org actions explicit/audited; no self-elevation |
| 8. Route manifest/consolidation | P0 | Typed manifest, shared shells, aliases, stale/sample link cleanup | Nine roles have one canonical home and approved navigation/denial map |
| 9. Release acceptance | P0 gate | Frontend build, backend suite, cross-scope API tests, email delivery test, browser test matrix, deployed evidence and roadmap update | Exact commit/build/tests/deployment/live acceptance recorded separately |
| 10. Production DB/security | Independent P0 gate | Issue #24 runtime DB identity/grants, backup/restore, staging, migration/rollback and approval | No production security/schema changes until explicit approval and verified evidence |

**Recommended order:** resolve canonical static-safe event URLs and registration policy; inspect existing identity/membership models; implement anonymous public registration that creates or links the participant identity and event membership; implement and verify credential/activation email delivery; test the whole journey and duplicate/error handling; then expand role dashboards. Continue existing Judge/membership/security work in coordination with the roadmap.

## 11. Acceptance test matrix

| Scenario | Required positive result | Required negative/edge test |
|---|---|---|
| Event portal | Correct identity and links retain event context | Unknown ID never displays a sample/other event |
| First-time registration | Anonymous participant completes one form; account/identity and event membership created; access email/activation sent | Login/account-creation prerequisite must not appear |
| Existing email | Safe verified linking or safe recovery path | No duplicate identity, privilege downgrade, or email enumeration |
| Registration A/B | Registration persists independently for each event | A membership never creates B membership |
| Duplicate/retry | Idempotent response and one membership | Concurrent duplicate submission does not create duplicates |
| Registration deadline/status | Open published event accepts registration | Draft, closed, expired, invalid and over-capacity (if supported) registrations denied |
| Email delivery | Confirmation matches actual provider result; secure activation/temporary credentials work | Misconfigured provider does not create false “email sent” success; retry does not duplicate registrations |
| Participant data | Only own authorized records for selected event | Altered event/team/submission ID denied |
| Event-role login | Assigned staff reaches allowed workspace | Selecting a privileged role cannot grant it |
| Organization Admin | Own organization events manageable | Other organization denied |
| Event Admin | Assigned event operations work | Unrelated event denied |
| Judge | Assigned teams and permitted scorecards only | Unassigned team/other judge's private scorecard denied |
| Coordinator/Volunteer | Assigned tasks/shifts and allowed actions work | Other worker/out-of-scope mutation denied |
| Technical/Resource | Assigned operations work | Cross-event changes denied |
| Retry/invitation | Idempotent registration; valid invite works | Duplicate, expired, revoked, reused, wrong-event invite denied |
| Navigation | All allowed menu links work | Direct protected route/API still denied |
| Static hosting | Copy/direct open/refresh/back/forward/mobile work | No reliance on unbuilt dynamic routes |
| Failures/revocation | Useful closed/404/network/permission/email state | No false success or stale revoked access |

## 12. Risks and mitigations

- **Static URL mismatch:** one canonical contract, centralized builder, deployed direct-load/refresh tests.
- **Account mistaken for enrollment:** public registration creates/links the identity and enrollment in one logical workflow; later login remains separate.
- **Credential email failure:** provider integration, safe retry/outbox and honest delivery state; never claim email was sent without confirmation.
- **Public registration abuse:** rate limits, server validation, duplicate safeguards, generic conflict/recovery responses and audit controls.
- **Event ID treated as permission:** authorize principal + membership and validate every related object server-side.
- **Duplicate registration schema:** inspect Event/EventMember/User/Team/TeamMember before migration.
- **Generic role dashboards:** one canonical home per role; share UI primitives only.
- **Mock values presented as live:** remove production fallbacks or label demo mode explicitly.
- **Premature RLS/grant rollout:** retain issue #24 staging, runtime identity, backup/restore and approval gate.
- **Broken legacy links:** map aliases and references before removing or renaming routes.

## 13. Decisions required before registration implementation

1. Are individual entries permitted for every event, or may events require teams?
2. Is registration public, approval-based, invitation-only, or configurable per event? The default public participant flow must not require an account.
3. Which fields are common versus event-configurable?
4. Are registrations immediate, pending approval or waitlisted (if capacity is supported)?
5. Can one account participate in multiple events? This plan assumes yes, with separate enrollment records.
6. What is the final static-safe URL contract and legacy-link compatibility period?
7. Is email-based activation preferable to a system-generated temporary password? The security approach must be selected before implementation; actual email delivery is required either way.
8. How should a person whose email already belongs to an existing participant or privileged/staff account safely register for another event?
9. Is Personal Event Mode in this release or deferred?
10. Which existing route is canonical for participant login and profile?

## 14. Definition of done

- All pages/links mapped to audiences, permissions and data sources.
- Each of the nine roles has one canonical home and approved navigation/denial matrix.
- Each event's portal, registration and login links work on the deployed static host.
- Anonymous participant event registration creates/links the participant identity and event enrollment; no pre-registration account-creation step.
- The participant receives verified email login/activation details, with honest failure/retry handling.
- Event enrollment persists separately per event and cross-event isolation is regression-tested at the API/data layer.
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

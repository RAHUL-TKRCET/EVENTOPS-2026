# EVENTOPS-2026 — Design & Implementation Plan

Status: proposed; design and documentation only. No application code or database schema is changed by this PR.

## 1. Product journey

1. An organization head visits the public EVENTOPS website and registers or signs in to their organization-owner account.
2. After verification, the account opens the Super Admin / organization workspace, where it can create and configure events within its authorized organization scope.
3. Event creation produces one canonical, shareable static-safe event URL (`/events/portal?eventId=...` on GitHub Pages).
4. The event URL opens a shared event portal with approved event details and role-login options enabled for that event.
5. Every role uses the same link. Choosing a role is only a request; the backend must verify identity, active event membership, role assignment, account state, and permission before granting access.
6. Successful authentication routes the user to the dashboard for the verified role and event context.
7. All protected reads and writes are authorized server-side and scoped to the correct event/organization.

## 2. Verified current-state findings

- Frontend: Next.js App Router and static export, deployed on GitHub Pages with base path /EVENTOPS-2026.
- Backend: FastAPI, Python 3.11, root entrypoint main:app, deployed on FastAPI Cloud.
- The current landing page hard-codes EVENT_ADMIN for both login and registration and routes to /dashboard. This conflicts with the intended organization-head-to-Super-Admin journey.
- Backend role vocabulary currently includes SUPER_ADMIN, ORGANIZATION_ADMIN, EVENT_ADMIN, COORDINATOR, JUDGE, VOLUNTEER, PARTICIPANT, TECHNICAL_STAFF, and RESOURCE_MANAGER.
- Backend entities include users, organizations, organization_memberships, events, and event_members. Many operational entities reference event_id.
- POST /api/v1/auth/event-login exists. In the inspected implementation, a matching global user/password can pass into the login flow without a visible active event-member assignment check for the requested event and role. This needs to be treated as a security gap until tests prove otherwise.
- The inspected GET event details route and GET event members route do not visibly depend on authentication; define the public/private data boundary and protect private member data.
- The current role dependency has a global SUPER_ADMIN bypass. Every event operation still needs an explicit scope/ownership check.
- The organization header must not be treated as authority for tenant scope. A missing or client-forged organization header must never bypass backend access checks.
- Frontend OTP verification and forgot/reset password methods currently return simulated success; they are not real recovery flows.
- GitHub Pages and FastAPI Cloud workflows are already separate and path-filtered. The Pages workflow points to the FastAPI Cloud API base URL.
- Confirmed Supabase project: EVENTOPS-2026, ref kwttdfgxstazmtzpcjnu, region ap-south-1, PostgreSQL 17.11.0.003.
- Read-only Supabase inspection found 24 public tables with RLS disabled; the Supabase security advisor reports this as critical because anon/authenticated Data API clients may access rows depending on grants. Do not blindly enable RLS across all tables: without matching policies, legitimate access may break. Define, test, and then apply table-specific policies in a reviewed migration.
- The Supabase migration list returned no migrations. Establish a version-controlled baseline/schema snapshot before further changes, after reviewing existing live schema and seed data.
- Inspected live table counts included organizations (1), users (15), organization_memberships (14), events (2), event_members (11), venues (3), judges (2), resources (3), incidents (1), benches (30), teams (5), and team_members (10). Counts are a point-in-time read-only observation, not a data-quality assessment.

## 3. Target architecture

Browser → public landing page → organization authentication → Super Admin/organization workspace → event creation → unique event slug → shared event portal → FastAPI authentication and membership verification → event-scoped authorization → role-specific dashboard → protected FastAPI APIs → PostgreSQL.

GitHub feature branch / pull request → CI and tests → path-filtered GitHub Pages or FastAPI Cloud deployment. Keep UI work and backend work separated by path filters.

## 4. Identity and data model

Recommended logical entities:

- users: global identity, normalized unique email, credential/identity-provider mapping, active/disabled status, timestamps.
- organizations: owner, details, lifecycle status.
- organization_memberships: user, organization, organization-level role, status.
- events: organization_id, durable unique slug, event details, event status, registration policy.
- event_members or event_role_assignments: event_id, user_id or invited email, role key, status, assigned_by, invite expiry/accepted timestamps.
- roles and permissions: start with centrally managed role definitions and a permission matrix; add configurable role-permission tables only if event-specific customization is required.
- sessions/refresh_tokens: hashed refresh token, expiry, rotation/revocation information if the current local token design is retained.
- audit_events: actor, event/org scope, action, resource, result, timestamp and correlation ID. Never store raw passwords or tokens in logs.

Add foreign keys, uniqueness constraints, and indexes for slug lookup and event/user/role membership queries. Avoid creating competing sources of truth between event_members and any new assignment table.

## 5. Proposed authorization rules

1. Deny by default.
2. Authenticate account and verify that it remains active.
3. Resolve the event from the canonical slug.
4. Verify the event is eligible for access.
5. Verify active membership and requested role for that exact event.
6. Verify the permission required for the action and the target resource.
7. Scope every query and mutation to the authenticated event/org context.
8. Ensure membership revocation takes effect without waiting for a stale long-lived token to expire.
9. Audit grants, revocations, sensitive changes, and denied cross-event attempts.
10. Treat frontend route guards as UX only. They are never authorization controls.

### Initial capability matrix (proposed; product approval required)

| Capability | Org Head / Super Admin | Event Admin | Coordinator | Judge | Volunteer | Participant | Technical Staff | Resource Manager |
|---|---|---|---|---|---|---|---|---|
| Create event | Allowed only in authorized org scope; platform-global scope only for platform Super Admin | No by default | No | No | No | No | No | No |
| Update event configuration | Authorized org scope | Assigned event only | Explicit limited fields | No | No | No | Assigned technical fields | Assigned resource fields |
| Assign event roles | Authorized org scope | Only delegated assignments if approved | No by default | No | No | No | No | No |
| View event roster | Authorized org scope | Assigned event | Need-to-know subset | No | Need-to-know subset | Own team only | Operational subset | Resource subset |
| Judge / score | Oversight | Oversight | No | Assigned scoring units only | No | Released results only | No | No |
| View own work | Support | Support | Assigned logistics | Assigned judging | Assigned tasks | Own team | Assigned technical queue | Inventory / resources |
| Read another event's private data | Explicit authorized org/platform scope with audit | No | No | No | No | No | No | No |

Do not infer permissions from dashboard route names. Confirm the matrix before implementing it.

## 6. Event portal and session flow

**Canonical static-host link contract (approved for this plan):** use the deployed query-based portal URL:
`https://rahul-tkrcet.github.io/EVENTOPS-2026/events/portal?eventId=<event-id>`.
Generate the URL through the shared base-path-aware builder; never generate `/events/{slug}` as the only shareable URL under GitHub Pages `output: "export"`, because arbitrary post-deployment event IDs do not have pre-generated HTML pages. Existing dynamic-style URLs may remain compatibility aliases only where the app can redirect them without claiming that every arbitrary ID is a statically generated route. Direct open, refresh, copied links, missing IDs, and unknown IDs must be tested against the deployed static site.

Public event lookup returns only approved event information and explicit registration availability. It must not reveal private member rosters, judge assignments, internal tokens, draft configuration, or unreleased results. The portal must not infer availability solely from the URL or from a frontend constant.

The login submission carries event slug, email, password, and requested role. The backend checks all four against authoritative persisted state. A role selector never grants the selected role. Avoid exposing an unauthenticated email lookup that reveals which roles a person has. A forged role or unassigned user must fail.

Choose one consistent session architecture before coding: short-lived access token plus rotating/revocable refresh token. Avoid long-lived tokens in localStorage. Because the frontend is static and on a separate host from FastAPI Cloud, document and test cookie, CORS, and CSRF behavior before relying on HttpOnly cookies.

## 7. Proposed API contract

| Method | Route | Purpose | Access requirement |
|---|---|---|---|
| POST | /auth/register-organization | Create organization-owner account using controlled role creation | Public, rate limited, verified flow |
| POST | /auth/login | Account sign-in; backend determines privileges | Public, rate limited |
| GET | /auth/me | Account and verified memberships/context | Authenticated |
| POST | /auth/refresh | Rotate refresh token | Valid refresh session |
| POST | /auth/logout | Revoke current session | Authenticated session |
| POST | /auth/forgot-password | Start reset with generic response | Public, rate limited |
| POST | /auth/reset-password | Consume single-use reset token | Valid reset token |
| GET | /public/events/{slug} | Public event metadata and enabled role options | Public, minimum data |
| POST | /events/authenticate | Event login for a requested assigned role | Public, rate limited |
| GET | /me/events | Events and roles assigned to current user | Authenticated |
| POST | /events | Create event and canonical slug | Organization-level permission |
| PATCH | /events/{event_id} | Update event | Correct organization/event permission |
| GET | /events/{event_id}/members | List roster | Authorized event staff only |
| POST | /events/{event_id}/invitations | Invite/enroll a role | Authorized role manager |
| PATCH | /events/{event_id}/members/{membership_id} | Change role/status | Authorized role manager |

Reconcile these proposed routes with current routers before implementation; don't add duplicates. Use consistent 401/403/404 semantics, Pydantic validation, and transactionally safe membership/role changes.

## 8. Frontend plan

- app/page.tsx: public product introduction and organization sign-in / account-creation entry points; remove EVENT_ADMIN as the default public account flow only after owner role semantics are agreed.
- Organization login/registration pages: dedicated owner workflow; user-submitted role must not grant privileged access.
- Super Admin/organization workspace: event list, create event, configuration, member/role enrollment, copy/share event link.
- Event portal route: event details, enabled role options, sign-in form, validation/errors/loading states; one link for all event roles.
- Role dashboard routes: dedicated operational interfaces, all protected data loaded from authorization-checked APIs.
- Central API client: typed payloads, token/session behavior, consistent error handling. Role/permission gates in the UI are presentation only.
- Preserve existing IDs and portal URLs where possible; add backward-compatible aliases only when needed.

## 9. Safe data migration plan

1. Treat the confirmed EVENTOPS Supabase database as the current schema target only after checking the project owner and environment. It contains existing data, so every schema change requires a reviewed migration and backup.
2. Export a schema-only snapshot, review grants and policies, and take a verified backup.
3. Decide whether event_members remains canonical or becomes a normalized role-assignment model.
4. Add unique event slug and membership constraints additively.
5. Backfill slugs and membership mappings; report duplicates and orphan rows before constraints are enforced.
6. Preserve existing event IDs and links where possible.
7. Add session/audit tables only after session architecture is selected.
8. Build table-specific RLS policies after confirming how FastAPI connects and whether requests use a database owner/service role or user-scoped database identities. Test policies with anon, authenticated, and backend service contexts as applicable.
9. Do not apply the advisor's blanket ENABLE ROW LEVEL SECURITY statements by themselves: RLS without policies will block ordinary data access, while enabling RLS with overly broad policies may provide no useful isolation.
10. Create and test a version-controlled migration baseline, then use additive migrations and document the rollback/forward-fix plan.

## 10. Security and test requirements

- Production startup fails closed when required JWT/QR secrets are absent or weak; remove known fallback secrets from production configuration.
- Never expose service-role keys, DB credentials, or server secrets in NEXT_PUBLIC variables.
- Never log credentials or raw tokens.
- Rate limit authentication, registration, invite verification, OTP, and reset endpoints.
- Ensure an ordinary registered user's valid password cannot bypass event_members assignment checks.
- Ensure an Event A Judge cannot act as Event Admin in Event A or enter Event B without a separate assignment.
- Ensure client-forged role, event ID, organization header, and dashboard URL cannot bypass server checks.
- Ensure public event APIs reveal only deliberately public fields and roster endpoints are private.
- Ensure disabling/removing membership blocks subsequent requests under the chosen token/revocation model.
- Test logout, refresh rotation, reset-token single use/expiry, generic reset response, and rate limits.
- Run unit tests, API integration tests, end-to-end browser tests, static analysis, dependency audit, and deployment smoke tests.
- Release gate: no unresolved critical/high authorization finding; explicit cross-event negative tests pass.
- Remediate the 24-table RLS exposure in a deliberate, table-by-table plan after policies and backend access mode have been tested.

## 11. Roadmap and acceptance criteria

| Phase | Priority | Estimate | Work | Acceptance criterion |
|---|---|---:|---|---|
| 0. Baseline audit | P0 | 1–2 days | Map routes, authorization dependencies, roles, existing tests, DB owner/schema | Permission matrix and DB/project confirmed |
| 1. Authorization foundation | P0 | 2–4 days | Central policy, event membership dependency, event-login fix, private endpoint protection | Cross-role and cross-event negative tests pass |
| 2. Organization-owner auth | P0 | 2–4 days | Safe registration/login, controlled owner membership, no self-elevation | Owner account reaches organization workspace without user-selected privilege |
| 3. Slug + portal API | P0 | 2–3 days | Unique canonical event URL, minimal public metadata, role options | Event creation returns stable URL and the portal resolves it |
| 4. Shared portal UI | P0 | 2–4 days | Event details, same-link role options, authentication states/mobile UX | All enabled roles use the same link; static direct load/refresh passes |
| 5. Role-specific routing | P1 | 2–4 days | Server-derived context, dashboard routing and route regression tests | Verified role routes correctly; direct URL cannot bypass API security |
| 6. Member provisioning | P1 | 3–5 days | Invite, accept, revoke, change assignment, audit events | Super Admin can assign/revoke roles; revocation takes effect |
| 7. Session/recovery hardening | P1 | 3–5 days | Refresh lifecycle, real reset, limits, admin MFA | Session and recovery integration tests pass |
| 8. DB/RLS hardening | P1 | 2–5 days | Schema migration, indexes, RLS aligned to identity model, isolation tests | Same-event reads pass; cross-event reads/writes denied at app and DB layers |
| 9. Staging and rollout | P1 | 1–3 days | Staging, telemetry, smoke tests, rollout gates, rollback playbook | Release gates pass before production cutover |

Estimates are directional single-developer planning estimates, not commitments. Do not begin later phases until previous acceptance criteria pass.

## 12. Deployment strategy

- Keep GitHub Pages and FastAPI Cloud deploy workflows separate and path-filtered.
- Add CI for lint/type-check/build, Pytest, API integration tests, and auth/RBAC negative cases.
- Check the actual static export output and Pages base path /EVENTOPS-2026; direct event links and refresh must be tested.
- Deploy backend API compatibility first, then frontend that consumes the new contract.
- After each deploy, smoke test public event lookup, owner login, valid assigned event login, wrong-role denial, and cross-event denial.
- Do not run Supabase migrations until table-by-table policies and the current backend connection mode are agreed.

## 13. First sprint

1. Build the route/API-to-permission inventory and confirm the database provider/project.
2. Add tests for the event-login bypass before changing behavior.
3. Require active membership for the requested event and role and protect private event/member routes.
4. Review the 24-table RLS-disabled finding and create a table-specific policy matrix; do not apply blanket changes.
5. Confirm organization-owner role semantics and registration flow.
6. Implement event slug + public metadata contract after current route conventions are reconciled.
7. Build the shared event portal around one event URL, then role-specific routing.
8. Run cross-event isolation tests and deployment smoke tests before calling this complete.

## 14. Sources

- Supplied deep research report (authentication, event-scoped RBAC, data model, rollout, and milestones).
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP Multi-Tenant Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
- Supabase local development/migrations: https://supabase.com/docs/guides/local-development/cli-workflows
- Supabase RLS guidance: https://supabase.com/docs/guides/database/postgres/row-level-security
- GitHub Actions workflow syntax: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
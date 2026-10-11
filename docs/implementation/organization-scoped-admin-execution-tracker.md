# Organization-Scoped Admin — Execution Tracker

## Completed and verified
- [x] Organization Admin management shell suppresses the persistent sidebar and sidebar toggle on the explicitly defined management routes, while preserving portal/login shells.
- [x] Event list uses the scoped backend API and has loading/error/empty states.
- [x] Mock judge API replaced with persisted FastAPI-backed list/create/update/assignment endpoints.
- [x] Judge form uses real authorized event results and submits selected event/email.
- [x] Removed false claim that invite email was sent; UI says delivery/account activation are not configured.
- [x] Judge APIs validate the event scope and ensure assigned teams belong to the event.
- [x] Event list/detail/create/update/member endpoints now require authentication and enforce org/event scope.
- [x] Evaluation submission requires an event-scoped JUDGE session and matching DB judge/event/team assignment.
- [x] Teams, check-in/QR, venue/bench, attendance, allocation, incident, inventory distribution, and analytics routes now validate event scope.
- [x] Seed J001 judge record linked to J001 JUDGE account instead of Super Admin.
- [x] Authorization regression tests added to CI. Run: https://github.com/RAHUL-TKRCET/EVENTOPS-2026/actions/runs/38176750011 — 18 passed.
- [x] Frontend event-list workflow succeeded: https://github.com/RAHUL-TKRCET/EVENTOPS-2026/actions/runs/38176315111.
- [x] Supabase grant-hardening migration applied to project kwttdfgxstazmtzpcjnu; matching SQL committed under supabase/migrations/20261011213317_lock_down_public_data_api_grants.sql.
- [x] Verified zero table grants to anon/authenticated, including on public.users; no public routines were found.

## Root-cause findings
1. lib/api/judges.ts was mock-only and no backend judges router was registered. It now calls persisted APIs.
2. The judge creation screen used demo events, did not submit the selected event reliably, and falsely claimed email dispatch. It now saves pending enrollment and gives honest delivery status.
3. Multiple backend event-owned endpoints were unauthenticated and/or did not check object-level event scope. Explicit guards have been added across the event, scoring, team/check-in, venue, attendance, allocation, incident, resource, and analytics routers.
4. EVENTOPS issues custom PyJWTs and has no Supabase JS client in its browser bundle. FastAPI uses SQLAlchemy via private DATABASE_URL. Supabase custom auth claims must not be assumed available through auth.jwt().
5. Supabase has 24 public tables with RLS enabled but no policies. Direct anon/authenticated Data API grants were revoked as a least-privilege boundary rather than applying policies that expect a Supabase Auth JWT the app does not use. RLS-enabled/no-policy notices remain informational; client roles no longer have table privileges.

## Not yet complete — next work
- [ ] Add database-backed invitation lifecycle: random hashed single-use tokens, expiry/revocation, event/org-scoped role allow-list, acceptance endpoint, and copy-link/email-not-configured UI. Current judge enrollment stores a pending record but does not create an invitation token or account.
- [ ] Add organization member/role APIs and a real People & Roles UI; dashboard card currently routes safely to events.
- [ ] Add end-to-end tests for org A/org B isolation, persistent judge enrollment, and event-scoped judge scoring. The CI suite currently runs registration plus helper/authentication-gate tests; legacy test_api.py is not in CI and includes anonymous-access expectations that need updating.
- [ ] Verify backend deployment after the latest endpoint-guard batch and smoke-test the deployed frontend/backend.
- [ ] Reconcile all Supabase tables to the ORM and establish the ongoing migration workflow. Do not create generic JWT policies until identity mapping or a claims bridge is verified.
- [ ] Audit any remaining API routes/functions for missing object scope and re-run Supabase Security/Performance Advisors.

## Authorization contract
- Organization Admin can manage their organization/events/people/judges/assignments, but cannot score as a judge.
- Only an assigned event-session judge can submit a score for assigned work in that event.
- Only an unscoped SUPER_ADMIN session has platform-wide access.
- Client organization headers are filters, never an authorization authority.
- Persisting enrollment is not email delivery or account activation.
- Do not mark the work complete until both allowed and denied paths plus deployment evidence are tested.
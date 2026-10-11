# EVENTOPS-2026 Security Remediation Runbook

**Status:** planning/implementation branch; no production code or schema changes deployed.
**Tracker:** [EVENTOPS-2026 Implementation Tracker](https://docs.google.com/spreadsheets/d/1xE8dfbAAY2fFY9nxKvX3Glcb1M7FWJ5nydy88Z8zHM8/edit?usp=drivesdk) — read-only through current connector session; update status only when a Sheets write action is available.
**Tracking issue:** https://github.com/RAHUL-TKRCET/EVENTOPS-2026/issues/7
**Supabase project:** `kwttdfgxstazmtzpcjnu` (ap-south-1)

## Verified risk
Supabase Security Advisor reports RLS disabled on 24 exposed public tables: organizations, audit_logs, users, organization_memberships, events, event_members, rounds, event_rules, venues, judges, allocation_constraints, volunteers, resources, incidents, round_criteria, time_slots, benches, allocation_results, volunteer_tasks, teams, team_members, evaluations, attendance_records, resource_distributions.

The DB uses varchar IDs in `public.users` and its own password/user model. Do not assume `auth.uid()` maps to `public.users.id`. FastAPI currently appears to query via SQLAlchemy, so verify the ORM DB role and whether it owns tables or bypasses RLS before claiming RLS protects those requests.

## Hard gates
- No production DDL until backup and restore are verified, staging tests pass, and the change window is approved.
- Do not blindly enable RLS without policies; this can break valid workflows. Never use RLS disablement as routine rollback, because it reopens exposure.
- Never expose service-role keys. Do not put secrets, raw tokens or production dumps in frontend, code, CI logs, issues or spreadsheet.
- Prior inspection found populated production tables but no recorded migrations; capture schema/grants/policies/views/functions/triggers/constraints/indexes and reconcile drift before establishing migration baseline.

## Phase A — baseline
- [ ] Reinspect current main's auth/event routes, dependency functions, settings, models and tests.
- [ ] Capture live schema-only snapshot including grants, policies, views, functions, triggers, constraints, indexes and extensions.
- [ ] Confirm `get_db` connection role and its table ownership/BYPASSRLS, as well as app-user-to-Supabase-Auth identity mapping.
- [ ] Verify backup and restore/clone; record row counts/integrity checks.
- [ ] Define role × event × action matrix using actual role and membership status values.

## Phase B — FastAPI authorization
- [ ] Add central dependencies that look up active event membership on every event-scoped request; do not trust `role`/`eventId` claims alone.
- [ ] `/event-login`: for existing accounts require password **and** active `EventMember` assignment for the requested event and role before minting claims.
- [ ] `/register`: reject caller-selected privileged/event roles; use least-privilege self-registration and controlled organization-owner bootstrap/invitations.
- [ ] `/switch-role`: require authoritative active assignment to target role/event; no arbitrary target role based solely on global SUPER_ADMIN.
- [ ] Replace static invite codes with cryptographically random, hashed, expiring, single-use DB-backed invitation records scoped to org/event/role.
- [ ] Protect event details, member lists and all event writes/object routes. Deliberately define minimal public event metadata; member contact details remain private.
- [ ] Remove permissive tenant fallback when `x-organization-id` is missing/undefined; infer scope from authorized event/resource and verify membership.
- [ ] Log sensitive role/membership changes without logging secrets.

## Phase C — sessions/secrets
- [ ] Production config fails closed on missing/default JWT and QR HMAC secrets; no process-local auto-generated fallback.
- [ ] Document and stage coordinated key rotation; access-token lifetime reduction; access-vs-refresh token type validation; session/revocation semantics.
- [ ] Add throttling to login, event-login, invitation redemption and recovery. Replace simulated OTP/password reset success with genuine server validation.
- [ ] Review browser storage/XSS protection and privileged-user MFA.

## Phase D — table-specific RLS and grants
- `organizations`: owner/active org membership visibility; owner/admin mutation only.
- `users`: own profile by default; org admin sees minimum required profile data; password hashes never exposed.
- `organization_memberships`: user sees own rows; only authorized org owner/admin can mutate memberships.
- `events`: if public discovery is required, publish only a narrow event metadata projection; other reads/writes require owner/org/event permissions.
- `event_members`: own assignment read; roster listing/provision/revoke restricted to allowed event admin roles.
- Event-child tables (`rounds`, `event_rules`, `venues`, `judges`, `allocation_constraints`, `volunteers`, `resources`, `incidents`, `time_slots`, `allocation_results`, `volunteer_tasks`, `teams`, `evaluations`, `attendance_records`, `resource_distributions`) require per-operation event and role policies.
- `round_criteria` derives event through `rounds`; `benches` through `venues`; `team_members` through `teams`. Validate parent objects, never trust client IDs.
- `audit_logs`: least-privilege read; trusted append path; no ordinary update/delete.
- Deny unnecessary anon grants; regrant only required privileges. Avoid broad `TO authenticated USING (true)`.

**Architecture decision:** Either align Supabase Auth identity safely with the app user model and pass identity context through, or keep data behind FastAPI, use a constrained DB role where practical, and rigorously enforce API object authorization. Verify actual path before creating RLS SQL. A connection with RLS bypass cannot be protected by table policies for that path.

## Phase E — migration/tests/CI
- [ ] Establish versioned migration baseline only after drift review; never destructive-reset production.
- [ ] Build reviewed RLS + policy + least-privilege grants migrations with rollback/forward-fix notes.
- [ ] Rehearse from baseline against clean local/staging DB with production-like schema and synthetic data.
- [ ] Add SQL policy tests (pgTAP/equivalent role/claim testing) and FastAPI integration tests.
- [ ] Test anonymous/private data, cross-event reads and writes, role escalation at registration, wrong role, revoked member, wrong org, member PII disclosure, tampered resource IDs, unauthorized scoring, attendance and resource changes.
- [ ] Test positive role workflows, public metadata (if required), migration and current DB connection role. Tests as table owner alone do not prove RLS.
- [ ] CI: lint/type checks, unit tests, migration validation, SQL policy tests, integration tests, drift detection.

## Phase F — production rollout
- [ ] Verify backup + restore rehearsal and recovery steps.
- [ ] Deploy backend authorization changes before or coordinated with policies; run small reviewed DB migration batches in approved window.
- [ ] Smoke-test login, event portal, role dashboard, event CRUD, member provision/revoke, check-in, judging, allocation, resource distribution and audit trail.
- [ ] Monitor 401/403/5xx, DB permission errors, latency and support signals; prefer secured forward-fix over blanket RLS disable.
- [ ] Re-run Supabase security/performance advisors. All exposed tables must have RLS and appropriate policies/grants, or be moved out of exposed schemas with documented justification.
- [ ] Verify denial through both Supabase Data API and FastAPI. Close only with PR, migration, CI, staging and production evidence linked in tracker.

## Existing code observations (recheck before edits)
- `backend/app/api/v1/auth.py`: previous-user path in `/event-login` appeared to skip roster validation; public register accepts role; switch-role trusts target role; invites hardcoded; `expiresIn` hardcoded to 86400.
- `backend/app/api/deps.py`: global SUPER_ADMIN bypass and missing-tenant fallback.
- `backend/app/api/v1/events.py`: event details/members appeared unauthenticated; update checks global role without clear per-event ownership.
- `backend/app/core/config.py`: default JWT/QR keys and short JWT secret auto-generation.
- `backend/app/core/security.py`: same JWT signing key for access/refresh; current-user dependency should verify token type.

## Stop/continue matrix
| Condition | Decision |
|---|---|
| Backup/restore unverified or identity/DB role unclear | Stop production change |
| Staging fails | Fix on branch; do not release |
| Unauthorized access succeeds | Release blocker |
| Valid flow breaks after RLS | Pause and secure-forward-fix; don't blanket-disable RLS |
| Advisor shows exposed table without RLS | Keep issue open |
| Tests pass, backup verified, advisor reviewed | Request explicit release approval |


## Current implementation status (2026-10-11)

- [x] Feature branch and draft PR opened; review this branch before merging.
- [x] Backend CI: 23 tests passed; two dependency deprecation warnings remain.
- [x] Next.js static export build passed on the same head.
- [ ] Apply or deploy the `event_invitations` schema only after establishing the migration baseline, backup/restore proof, and staging validation. The production database currently does not have this model table.
- [ ] Supabase Security Advisor still reports 24 public tables with RLS disabled. No production RLS migration has been applied.
- [ ] Direct Google Sheets editing is blocked because no write-capable Sheets connector is available in this session; mirror this status in the linked sheet when write access is restored.

PR #8: https://github.com/RAHUL-TKRCET/EVENTOPS-2026/pull/8
Tracking issue #9: https://github.com/RAHUL-TKRCET/EVENTOPS-2026/issues/9

No production SQL was applied while preparing this runbook.
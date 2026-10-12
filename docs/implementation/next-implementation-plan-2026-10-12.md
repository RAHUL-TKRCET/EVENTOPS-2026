# EVENTOPS-2026 — Next Implementation Plan
**Planning baseline:** 2026-10-12
**Repository:** https://github.com/RAHUL-TKRCET/EVENTOPS-2026
**Basis:** current main, data/roadmap.csv, organization-scoped implementation tracker, architecture notes, registration findings, and open PRs/issues. This plan distinguishes code implementation, CI evidence, deployment evidence, and live end-to-end evidence.

## Product intent
An Organization Head manages their organization, events, staff, role assignments, and operations from one central workspace. Each event has its own workforce and operational context. An event link identifies an event but never grants authorization. For every protected action, the backend verifies identity, organization membership, event assignment, role, action, and target-object scope. Organization administrators can manage people and role memberships without impersonating those roles; managing judges does not grant permission to submit scores as a judge.

## Current baseline
- Organization-owner registration and the Organization Admin workspace are implemented, but the complete owner registration/role-routing journey still needs live browser verification.
- Event-scope checks have been added across multiple operational API routes. The full protected-route audit and negative tests still need completion.
- Secure invitation endpoints and random, hashed, expiring, single-use invitation tokens are implemented. Email delivery is not configured and the deployed acceptance journey remains unverified.
- People & Roles was merged in PR #15. Invitation create/list/revoke and acceptance UI exist; activate/deactivate for existing memberships and role/assignment changes still need reviewed mutation APIs.
- Open drafts checked 2026-10-12: PR #16 organization navigation, #17 compact organization Topbar, #18 dashboard demo-data labeling, #19 Judge queue/saved scorecard. These overlap or build on common bases; review and rebase deliberately rather than blindly merging.
- PR #5 has unresolved review feedback on dynamic event URLs with GitHub Pages static export. The current app/events/[eventId]/layout.tsx generates only evt-01; app/events/[eventId]/login/page.tsx still uses hard-coded localhost API URLs, mock-event fallback, and global-login fallback after event-login failure.
- PR #8 security/RLS work remains draft/non-mergeable. EVENTOPS uses custom JWTs and SQLAlchemy via private DATABASE_URL; do not assume Supabase browser auth.uid() maps to application identity. The roadmap reports direct anon/authenticated table grants were revoked and migration artifacts exist, but schema, DB connection role, policies and live behavior remain to be verified.
- Dashboard and role pages still contain mock datasets or fabricated operational metrics/activity statements. A static build alone is not operational verification.

## Next sprint sequence

### 1. P0 — Finish Judge assigned-team workflow and saved scorecards
**Tracking issue:** #20 · **Current PR:** #19
- Review PR #19 and check Pages static export/backend CI results on the exact current head SHA.
- Dashboard, team queue, rubric, and history must use persisted API responses, without silent mock fallbacks.
- Every read/write must be scoped server-side to authenticated judge, active event, assignment, team, and round.
- If scorecard lookup fails, disable submission; never overwrite a scorecard whose current value could not be verified.
- Test wrong role, unassigned team, wrong event/round, and access to another judge's scorecard.
- Browser-smoke assigned, empty, loading, error, and saved-score states; record exact evidence.
**Exit:** correct assignments and saved scores appear only to the authorized judge; CI and browser checks pass on the exact PR head.

### 2. P0 — Remove local-only and unsafe event-login fallbacks
**Tracking issue:** #21
- Replace hard-coded http://localhost:5000 calls with the centralized configured API client.
- Remove mock-event fallback; unknown/unreachable events must show an error or not-found state, never the first fixture.
- Remove global authApi.login fallback after event-login failure. Fail closed.
- Backend validates active account, credentials, event membership, requested role, organization/event scope and permissions.
- Query-string role/email values are prefill only, never authority; avoid unauthenticated role-discovery endpoints that enumerate memberships.
- Add tests for invalid credentials, unassigned user, wrong role, inactive membership, wrong event, API unavailable, and direct URL attempts.
**Exit:** failed event login cannot create a dashboard session; production code has no localhost or mock-event fallback.

### 3. P0 — Decide the canonical URL compatible with GitHub Pages static export
**Tracking issue:** #22 · **Related PR:** #5
- Choose a canonical approach that works with static export: for example, a pre-rendered portal route with a query/hash event identifier, or hosting with verified dynamic rewrite support.
- Event creation must return exactly the URL format that the deployed host can route.
- Resolve public event metadata from a durable unique slug/ID via backend API; no mock fallback.
- Define invalid/disabled/unpublished event behavior and preserve or alias existing links as needed.
- Update the plan in PR #5, address its unresolved P1 review feedback, and resolve conflicts only after the URL contract and tests are updated.
**Exit:** direct open, copied link, and refresh for a newly created event work on deployed hosting; the URL never grants authorization.

### 4. P0 — Consolidate role-aware navigation and truthful dashboards
**Tracking issue:** #23 · **Related PRs:** #16, #17, #18
- Review overlapping draft PRs and sequence/rebase them against current main, avoiding duplicate or conflicting edits.
- Organization Admin navigation focuses on Organization Home, Events, People & Roles, Judges, and Settings. Event operations are reached within the selected-event context.
- Test route visibility, active links, direct URL behavior, and desktop/mobile layout per role.
- Replace mock metrics with API data when a valid endpoint exists; otherwise clearly label the whole view as demo data. Remove unsupported live/optimal/solver-success claims.
- API-backed screens provide loading, empty, error and retry states.
- Hiding a UI control is not authorization; backend checks remain authoritative.
**Exit:** dashboards make no unverified operational claims, role navigation is consistent, and static/browser checks pass.

### 5. P0 release gate — Authorization and database safety
**Tracking issue:** #24 · **Related:** PR #8 and security issue #9
- Re-audit every protected FastAPI route using identity → organization membership → active event assignment → role permission → target-object scope.
- Test org A/B, event A/B, wrong role, revoked membership, forged IDs/organization headers, anonymous access and unauthorized writes.
- Verify the actual DATABASE_URL database role/grants, whether it bypasses RLS, migration history, schema drift and real API database access behavior.
- Capture schema/grants/policies baseline and perform a verified backup-and-restore rehearsal.
- Build a table-by-table read/write policy matrix from real ownership relationships. Keep audit logs append-only and membership mutations privileged.
- Test proposed migrations on production-like staging with synthetic data and regression tests.
- Do not merge/apply production RLS changes until review, staging, verified backup/restore, rollback/forward-fix plan and explicit owner approval are recorded.
**Exit:** authorized and denied behavior is demonstrated at API and database layers; residual risks and evidence are documented. No direct client grants is not by itself proof that database security is complete.

### 6. P1 — Complete People & Roles and invitation lifecycle
**Tracking issue:** #25
- Reuse existing invitation model/endpoints and People & Roles UI; do not duplicate tables or contracts.
- Test deployed invite → copy link → verify → accept → authenticate as assigned role.
- Reject expired, revoked, reused, wrong-email/role/event and cross-organization tokens. Audit sensitive changes without logging raw tokens.
- Implement reviewed APIs for existing-membership activation/deactivation and role/assignment changes, or keep unsupported controls disabled.
- Ensure membership revocation takes effect according to the selected session design.
- Email delivery is NOT_CONFIGURED until a provider is integrated and tested; a copied link is not an email sent.
**Exit:** deployed positive/negative invitation tests pass and the UI reports outcomes honestly.

### 7. P1 — Session and account recovery
**Tracking issue:** #26
- Document one session architecture compatible with GitHub Pages and FastAPI Cloud, including access/refresh behavior, storage, expiry, rotation/revocation, CORS and CSRF.
- Replace simulated OTP/forgot/reset flows with real tokenized flows or disable and label them unavailable.
- Add single-use expiring password-reset tokens, generic public responses and rate limits to registration, login, invitation and recovery endpoints.
- Decide privileged-account MFA and test expiry, reuse, logout/revocation and revoked membership behavior.

### 8. P1 — Replace Volunteer demo tasks with assignment-backed data
**Tracking issue:** #27
- Inventory existing volunteer/task backend APIs and tables first to avoid duplicate contracts.
- Reuse or add narrow APIs for the authenticated volunteer's tasks/shifts in the active event.
- Replace mock records and in-memory task state with API responses and loading/empty/error/retry states.
- Enforce assignment scope for reads/mutations; test cross-volunteer and cross-event denial.

### 9. P1 — Shared event portal and complete journey
**Tracking issue:** #28
- Depends on the canonical URL decision and fail-closed event login fixes.
- Public lookup returns only approved event metadata and enabled role options; all assigned roles use the same event entry point.
- Backend-derived identity/role/event controls post-login routing; selected client role is never authoritative.
- Verify create organization → owner workspace → create event → invite/enroll role → accept invitation → event login → role dashboard → allowed action → forbidden action denied.
- Test direct link, refresh, mobile, invalid/disabled event, unassigned user, wrong role, expired invitation and cross-event access.
**Exit:** complete deployed positive and negative end-to-end tests pass on the exact released commit.

### 10. P2 — Make roadmap evidence auditable
**Tracking issue:** #29
- Distinguish code implemented, CI passed, deployed and live E2E verified for every phase.
- Record exact commit SHA, workflow/test links, browser results and unresolved blockers.
- Update data/roadmap.csv only when acceptance criteria have evidence; editing the CSV is not proof that a feature works.

## Release principles
1. No production DB changes without reviewed migration, baseline, verified restore, staging proof and explicit approval.
2. Do not weaken CI or authorization to make a PR green.
3. Do not use mock fallback for production operations that must be persisted or authorized.
4. Do not mark work complete because the UI looks correct or a static build passed.
5. Keep planning tasks separate from application/schema changes.
6. Prefer focused, sequenced PRs based on current main with explicit acceptance criteria.

## Immediate order
1. Validate and finish PR #19 Judge workflow.
2. Fix event-login API configuration and fail-closed behavior (#21).
3. Decide static-export-compatible event URL and resolve PR #5 feedback (#22).
4. Consolidate PRs #16–18 for truthful, consistent dashboards (#23).
5. Progress DB/security readiness for #24 in a separately gated staging track; do not apply production RLS changes prematurely.
6. Finish invitation/membership lifecycle, sessions/recovery, Volunteer API data, shared portal E2E, then roadmap closeout.

Original estimates are directional; sequence depends on dependencies and evidence, not estimates alone.

## Fresh verification update — 2026-10-12 (follow-up)

### Judge PR #19
- Current head verified: `23aa429270ee874676a5eccc6e6ab399a83ee13a`.
- Backend workflow passed: https://github.com/RAHUL-TKRCET/EVENTOPS-2026/actions/runs/38210663414.
- GitHub Pages static-export workflow passed: https://github.com/RAHUL-TKRCET/EVENTOPS-2026/actions/runs/38210663494.
- Still open as a draft; browser/direct-route checks were not performed.
- Additional issue #30 records the remaining integration-test gap: new unit tests stub `_assigned_judge`, so they do not exercise actual persisted judge resolution; real TestClient allow/deny tests and browser verification remain required before merge.

### Live Supabase review
- Project `kwttdfgxstazmtzpcjnu` (EVENTOPS-2026) is reported `ACTIVE_HEALTHY`, Postgres 17.11.
- Current migration ledger reports `20261011213317_lock_down_public_data_api_grants` and `20261011213523_create_secure_event_invitations`.
- Latest Security Advisor snapshot at 2026-10-12 06:40 UTC reports 25 public tables with RLS enabled but no policies. Current advisor list includes organizations, users, organization_memberships, events, event_members, invitations, judges, teams, evaluations, attendance_records, resources, resource_distributions, and other operational tables. Details: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy.
- Latest Performance Advisor reports 21 foreign-key constraints without a covering index and 15 unused indexes. Treat these as review candidates; do not create/drop indexes solely from an advisor snapshot without querying actual access patterns.
- This is an observed advisor state, not proof of publicly exploitable row access. Prior tracker evidence says direct `anon`/`authenticated` table grants were revoked; verify grants, actual `DATABASE_URL` role/bypass-RLS behavior, and backend connection path before deciding final policy design.
- No Supabase schema, grants, policies, migrations, or production data were changed during this follow-up.

### Release decision
- PR #19 is **not merged**; passing CI does not replace browser verification or the real-helper integration tests in issue #30.
- PR #8 remains draft/non-mergeable and security-sensitive; no production RLS migration is approved by this update.


## PR #16 resolution plan — updated 2026-10-12

**Disposition:** PR #16 is closed and unmerged because its navigation changes were superseded by PR #31. Do not reopen or re-implement #16 in isolation.
- Original PR: https://github.com/RAHUL-TKRCET/EVENTOPS-2026/pull/16
- Merged replacement: PR #31, merge commit `c19a67fc08fe59a2798fc75dee068a3354d505e8` — https://github.com/RAHUL-TKRCET/EVENTOPS-2026/pull/31
- Demo-data honesty replacement: PR #32, merge commit `45c51f861cad65f5ff243050f0bd842572006cb7` — https://github.com/RAHUL-TKRCET/EVENTOPS-2026/pull/32
- Combined tracker: issue #23 — https://github.com/RAHUL-TKRCET/EVENTOPS-2026/issues/23

### Scope already delivered
1. Organization Admin sidebar is narrowed to five organization-level destinations: Organization Home, People & Roles, Events, Judges, and Organization Settings.
2. Hard-coded navigation badges such as LIVE, counts, OR-Tools and Copilot were removed; unknown roles get a minimal fail-closed menu.
3. Global search and mock announcement controls are suppressed on the Organization Admin landing page; profile/logout remain.
4. Fixture-backed dashboard state is labeled as demo rather than claiming verified live/optimal solver state.
5. The replacements were merged into main. Original #16/#17/#18 are superseded, not merge candidates.

### Remaining execution plan
**P0 — Validate UX and navigation on deployed Pages**
- Run a fresh static export/build against current main and retain the exact commit SHA + workflow URL.
- Browser-smoke the five Organization Admin destinations: sidebar links, active states, topbar visibility, profile/logout, direct URL and back/forward navigation.
- Repeat at desktop and mobile widths; verify the Organization Admin dashboard layout and secondary organization-management pages separately.
- Run role-by-role checks for Super Admin, Organization Admin, Event Admin, Coordinator, Judge, Volunteer and Participant. Verify hidden controls are not treated as security controls; protected APIs must still deny unauthorized requests.

**P0 — Verify dashboard honesty**
- Confirm fixture-backed metrics and operational activity remain visibly identified as sample/demo data and that no unsupported live, optimal or solver-success claims are shown.
- Where a real API exists, verify loading, empty, error and retry behavior and ensure values are scoped to the selected organization/event.
- Record remaining mock-backed pages separately instead of treating the dashboard banner as proof all role workspaces are API-backed.

**P0 — Close tracker only with evidence**
- Update issue #23 and this plan with exact build SHA, Pages run, test results, and desktop/mobile browser evidence.
- Keep status open until browser/role tests pass. Do not represent CI/static export alone as a successful live UX test.
- No database/schema/RLS change is required for this UI plan. Continue to keep the separate PR #8 security/staging gates intact.

### Acceptance criteria
- Five expected Organization Admin destinations render and navigate correctly on the deployed static site.
- Organization and event operational links make scope/context clear; event-specific operations are reached only inside the selected event.
- No misleading fabricated badges or solver/live claims remain.
- Other roles retain their expected navigation and can still use profile/logout.
- Browser/route visibility tests pass on desktop and mobile; backend authorization tests continue to enforce access independently.

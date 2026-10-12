# EVENTOPS-2026 — Next Implementation Plan
**Plan date:** 2026-10-12  
**Basis:** Current `data/roadmap.csv`, open PRs #5 and #8, and existing issue/phase references. This is a planning artifact, not a claim that implementation or live validation has already happened.

## Executive direction
Sequence the next cycle as: (1) close the live acceptance gap left by merged PR #34, (2) finish the data-backed Judge workflow and prove real assignment resolution, (3) finish event portal/static URL contracts and member lifecycle integration, (4) complete cross-role end-to-end regression, and (5) prepare database security only after identity, DB role, backup/restore and staging evidence is available. Keep production Supabase read-only until its explicit rollout gate passes.

## Sprint 0 — Release acceptance for PR #34 (P0; first)
**Source:** Roadmap phases 9 and 15–17; issue #33; merge commit `471ccce0e9b1864c39d3a09c8739c3ad396d8792`.  
**Already verified:** Backend tests, FastAPI deployment, and GitHub Pages build/deployment passed on the merge commit (workflow runs 38255961047, 38255961042, 38255961055).  
**Work**
1. Confirm live frontend and backend correspond to the intended release.
2. With a real active Organization Admin session, open `evt-cdf51aa8` and `evt-34896300` through the Events list and `/events/detail?eventId=<id>`; test direct navigation and refresh.
3. Verify title/details and API-backed metrics/roster, with clear unavailable states if data is absent.
4. Test unauthenticated (401), cross-organization (403), unknown event (404), and unassigned event-role denial; verify no Super Admin privilege elevation.
5. Audit hub-reachable reads/writes (analytics, event members, rounds/criteria, schedule, settings) for server-side scope checks. Settings must not claim save without confirmed persistence.
**Done when:** Browser/API evidence is recorded in issue #33 and roadmap. CI/deployment success alone does not close this phase.

## Sprint 1 — Judge workflow backed by persisted assignments (P0)
**Source:** Roadmap phases 1 and 5; issue #20; phase 13; `feat/judge-scoped-team-queue`; PR #19 history and issue #30.  
**Work**
1. Reconcile current branch/PR head with roadmap evidence; the recorded head `c1416f178af620da41b8bd3bef7fd22527f7957f` does not prove later changes passed.
2. Replace remaining mocked judge assignment, team detail, scorecard, criteria, or history dependencies with persisted event-scoped API data.
3. Add integration tests using actual persisted assignment resolution rather than stubbing `_assigned_judge`.
4. Cover assigned judge allow, unassigned team deny, wrong event/round deny, own-scorecard isolation, saved score retrieval, and blank new scorecards; verify explicit rubric/criteria IDs.
5. Run backend tests and static export; add direct-route and signed-in browser tests.
**Done when:** No demo score/team substitution, persisted assignment tests pass, and exact-head CI plus browser evidence is attached to the tracking issue.

## Sprint 2 — Event portal and canonical static-host URL contract (P0)
**Source:** Roadmap phases 3–4; PR #5 unresolved P1 review; event URL and portal E2E issues.  
**Work**
1. Resolve PR #5’s open static-export review before merging: document a canonical URL contract compatible with GitHub Pages (query/hash/static route), not arbitrary post-deploy dynamic path generation.
2. Add tests for open, refresh, copied link, missing ID, and back/forward navigation for events created after deployment.
3. Complete shared public event portal: allow-listed metadata only, role options from event contract, clear login/loading/not-found/API failure states, no mock fallback.
4. Make event creation, Events list, portal, login, and hub generate/consume one base-path-aware URL format.
5. Verify portal does not expose owner/organization IDs or protected rosters before authorization.
**Done when:** PR #5’s P1 thread is addressed, URL format is consistent across entry points, and Pages direct-open/refresh tests pass. Do not merge PR #5 only because documentation builds.

## Sprint 3 — Member lifecycle and invitation UI integration (P1)
**Source:** Roadmap phases 6 and 10; merged PR #15; `feat/secure-invitation-lifecycle` and `feat/people-roles-workspace` notes.  
**Work**
1. Reconcile each branch/PR against main and identify what is deployed versus branch-only; avoid duplicating invitation model/UI work.
2. Verify create/list/verify/accept/revoke against deployed backend: expiry, reuse, revoked token, wrong org/event, role allow-list, existing-user acceptance, and audit events.
3. Keep email delivery labelled `NOT_CONFIGURED` until a real provider is configured and tested; manual copy-link delivery must be explicit.
4. Define backend contracts for activating/deactivating memberships and changing role/event assignments; enforce privileged authorization and audit every mutation.
5. Implement UI only after API contracts and denial tests exist; revocation must take effect on subsequent protected requests.
**Done when:** Invitation flows pass deployed E2E; membership changes have tested backend endpoints and audit trail; UI does not imply email or mutation success without confirmation.

## Sprint 4 — Sessions, recovery and remaining role journeys (P1)
**Source:** Roadmap phase 7 and phases 1–5.  
**Work**
1. Inventory current JWT/access/refresh behavior and configuration without printing secrets.
2. Choose and document session model; test expiry, refresh-token rejection on protected HTTP/WebSocket calls, revocation semantics and membership/role revalidation.
3. Replace simulated password recovery with a real, rate-limited, single-use and expiring recovery flow, or explicitly mark it unavailable until approved.
4. Assess privileged MFA as a product/security decision; do not represent it as available unless implemented.
5. Finish role route matrix for Super Admin, Organization Admin, Event Admin, Judge, Volunteer, Participant, Coordinator, Technical Staff and Resource Manager, including direct navigation and denied states.
**Done when:** Integration tests cover expired/revoked sessions, recovery abuse cases, role escalation and direct-route access; rollout notes distinguish implemented features from deferred ones.

## Sprint 5 — Database/RLS readiness gate (P0 security; prepare first, apply last)
**Source:** Roadmap phase 8; draft PR #8; issues #7/#9; read-only Supabase advisor/migration notes.  
**Work before any migration**
1. Verify production FastAPI `DATABASE_URL` identity, object ownership, grants, role memberships and whether the connection bypasses RLS. Do not assume `auth.uid()` maps to EVENTOPS custom string IDs.
2. Inventory table/view/function/sequence exposure and direct API grants; distinguish “RLS enabled without policies” from actual external exposure using effective grants and query role.
3. Take a recoverable backup and rehearse restore; reconcile schema and migration history safely, with no destructive reset.
4. Create a table-by-table operation matrix (select/insert/update/delete) for anonymous, participant, judge, event admin, organization admin and platform admin; identify service-role-only tables and append-only audit data.
5. Rework PR #8 into a reviewed staging-only migration/test proposal aligned to the real auth path. Test clean install, upgrade from a sanitized production-like snapshot, and PostgreSQL app flows.
6. Verify deny paths, migration drift, grant/policy coverage and Supabase advisors after staging.
**Production gate:** No production schema/grant/RLS change until backup+restore, staging acceptance, reviewed migration, rollback/forward-fix plan, explicit approval and change window are recorded. Never apply generic `auth.uid()` policies blindly or disable RLS as routine rollback.

## Sprint 6 — Release engineering, observability and roadmap hygiene (P1)
**Source:** Roadmap phase 9 and phases 12–14.  
**Work**
1. Standardize release evidence: commit SHA, backend test run, static export run, backend deployment, Pages deployment, and separately recorded browser E2E.
2. Define smoke checks and rollback/forward-fix playbook; capture backend health/version and errors without exposing tokens or personal data.
3. Update roadmap only from verified current evidence; remove stale branch/head notes when superseded and label duplicated phase rows as summary versus detailed follow-up.
4. Consolidate superseded branches/issues after confirming unique fixes are preserved; do not merge old PRs solely to clear the queue.
**Done when:** Every release has auditable evidence, roadmap status matches reality, and blockers have one canonical issue/PR.

## Dependency order
1. Issue #33 live acceptance and dependent-endpoint audit.
2. Judge persisted assignment integration (issue #30 is the known test gap; confirm current tracking issue/PR before coding).
3. Static URL contract and shared event portal; unblock PR #5 only after its P1 route design is resolved.
4. Invitation deployed E2E and membership mutation contracts.
5. Session/recovery and role-route matrix.
6. RLS/runtime DB-role/backup/staging investigation can run in parallel; production migration stays last and separately approved.
7. Every sprint: exact-head CI, deployment verification where applicable, live E2E separately, and roadmap update.

## Standard Definition of Done
- Acceptance criteria map to issues and tests.
- Authorization is checked server-side for every object and mutation; client-supplied organization/event IDs never grant access.
- Same-tenant allow and cross-tenant deny cases exist for every scoped feature.
- No fabricated metrics, production mock substitution, fake success, or implicit default event IDs.
- Static routes work by direct URL, refresh and copied/shared links under configured base path.
- Backend tests, frontend static export, deployment, and browser E2E are reported independently.
- Secrets and production data are not copied into issues, logs, artifacts or source.
- Production DB remains unchanged until the separate security gate is explicitly approved.

## Immediate next task
Start with live acceptance and endpoint audit in [issue #33](https://github.com/RAHUL-TKRCET/EVENTOPS-2026/issues/33). Once evidenced, move to Judge assignment integration, using [issue #30](https://github.com/RAHUL-TKRCET/EVENTOPS-2026/issues/30) as the known integration-test gap and confirm the current tracking issue/PR before coding.
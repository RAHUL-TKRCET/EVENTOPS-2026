# Implementation Plan Execution Tracker — Organization-Scoped Admin

## Phase 0: Baseline and root-cause diagnosis
- [x] Inspect frontend shell, role access map, event API, backend authentication/dependency path, judge API client, and judge screens.
- [x] Re-check live Supabase table/policy posture and current advisories.
- [ ] Establish a verified, safe implementation/test environment for code changes and capture all build/test results.

## Current verified findings
1. `components/layout/AppShell.tsx` only hides the sidebar for ORGANIZATION_ADMIN at the exact `/dashboard` route. `Topbar.tsx` uses the same exact-path condition for its hamburger and context header.
2. `lib/api/judges.ts` is entirely mocked: `getAll`, `getById`, `create`, and `updateStatus` operate on `mockJudges`; there is no backend judges router registered in `backend/app/api/v1/api.py`.
3. `app/judges/page.tsx` directly initializes from `mockJudges`; `app/judges/create/page.tsx` uses `mockEvents`, hardcoded demo defaults, never sends the form email, ignores the form's email/phone/event ID in its create call, and displays “invitation successfully dispatched” on mock promise resolution.
4. FastAPI has tenant-scope issues beyond the UI:
   - `get_current_tenant_user` accepts an `x-organization-id` from client and returns the same user when it matches `current_user.organization_id`, without checking the active org membership in that branch.
   - `/events` listing checks the client `organization_id` only if supplied; omitted scope can return every event after authentication, even when tenant dependency was applied.
   - Event detail, update, and member listing handlers do not enforce organization/event scope.
   - Event creation accepts payload.organizationId (untrusted) and allows EVENT_ADMIN, but doesn't validate organization/event ownership.
   - Evaluation submission obtains any judge record for the current user or falls back to the user ID, without checking JUDGE role, assigned event, event/team match, or user assignment. This must be fixed before declaring role separation secure.
5. Live Supabase project `kwttdfgxstazmtzpcjnu` currently has 24 public tables with RLS enabled and 0 RLS policies. The Security Advisor reports 24 `rls_enabled_no_policy` findings. Information-schema grants query shows broad table privileges for both `anon` and `authenticated`, including sensitive `users`; `users.password_hash` exists. Migration API reports no tracked migrations. Performance Advisor reports 20 unindexed FK findings and 16 unused-index findings. Do not blindly drop indexes or apply blanket policies. Supabase RLS custom claims must not be assumed to match the EVENTOPS custom PyJWT, and the API's DB role must be verified.
6. Repo: `main`, latest observed commit SHA `3da3b5c282ec4e6eaafebb188c4a7b62497631dc`. GitHub file-content connector reads/writes succeed for existing simple files, but a previous attempt to create an issue/file with the same account failed with `link_id must identify an eligible linked account`. No repository code changes have been committed in this execution yet.

## Ordered work
- [ ] Build/secure organization/event ownership primitives and add regression tests.
- [ ] Fix event create/list/detail/update/members tenant authorization.
- [ ] Restrict evaluation submission to authenticated JUDGE with a DB-backed Judge row assigned to the same event/team; protect score retrieval endpoints as needed.
- [ ] Add persistent backend judges list/create/detail/status and event assignment endpoints; add appropriate schemas and router registration.
- [ ] Replace mocked judge data/event choices with live API data; make invite messaging match what backend confirms.
- [ ] Hide sidebar across the complete explicit Organization Admin management route group and provide context navigation.
- [ ] Test frontend build, backend tests, cross-org access and judge scoring isolation.
- [ ] Create a checked-in migration/RLS matrix only after identity and DB privilege design is verified; stage RLS changes first, then production with backups and policy tests.
- [ ] Verify deployment SHA, workflow checks, smoke tests, and fresh Supabase advisors.

## Acceptance gate
No phase is marked complete until code, focused tests, RLS behavior, and deployment evidence demonstrate the intended behavior. Do not apply one-size-fits-all policies or change the production schema based on unverified custom JWT assumptions.
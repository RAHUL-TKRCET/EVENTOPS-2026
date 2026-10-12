# Route Inventory Audit — Baseline and First Slice

Generated against repository `main` tree `b720684f7cec8e63e2e5950d455116c542a047b7`; started as part of issue #35 and feature branch `feat/public-participant-entry`.

## Scope

- App Router page components inventoried: **124**.
- Inventory file: [route-inventory.csv](./route-inventory.csv).
- This is a static/source inventory, not a full manual certification. Every route must still be checked for actual links, API calls, role guards, state, direct-load and refresh behavior before removal or consolidation.
- Route code changes in this first slice are limited to participant entry discoverability, preserving the event context through the existing signup page, and correcting the public homepage's misleading Super Admin copy. No database migration is included.

## Confirmed first-slice changes

1. The homepage now exposes **Participant registration** through desktop and mobile navigation plus the main CTA area, linking to `/register?accountType=PARTICIPANT`.
2. The homepage account-creation copy describes organization creation instead of claiming public signup creates a Super Admin. The existing registration backend still assigns Organization Admin when creating an organization.
3. The public event portal now exposes **Register as a participant** and passes its current `eventId` to the existing registration route.
4. The registration page preselects the Participant account option from `accountType=PARTICIPANT` and preserves `eventId` after account creation in the participant route URL.
5. The registration form still creates an account only. It does not claim that the participant is enrolled in the event or belongs to a team; the event registration API/workflow is a separate implementation phase.

## Important unresolved product/API contract

- `/auth/register` creates a Participant account and does not itself create event registration or team membership.
- The public event DTO currently exposes general event status and deadline, but a deliberate event registration eligibility contract must be established before the CTA can safely declare that registration is open. Do not infer eligibility from a URL or hard-coded frontend condition.
- The homepage's "Open event" field currently navigates through the dynamic `/events/{code}/portal` shape even though Next.js uses `output: "export"`. Coordinate with issue #22 and #28; do not create a competing canonical URL scheme or silently remove compatibility.
- The nine implemented roles need manual route permissions and a full link target audit before duplicate pages are removed.

## Supabase audit (read-only)

- Project: `EVENTOPS-2026` (`kwttdfgxstazmtzpcjnu`), region `ap-south-1`.
- Tables already exist for events, event members, teams and team members, so a new registration table is not assumed by this phase.
- Migration ledger contains `20261011213317_lock_down_public_data_api_grants` and `20261011213523_create_secure_event_invitations`.
- Security Advisor currently reports 25 public tables with RLS enabled but no policies. Keep production security changes behind issue #24's runtime DB identity, grant model, backup/restore, staging and authorization tests. The current frontend uses a custom EVENTOPS JWT and FastAPI/SQLAlchemy data path; generic `auth.uid()` policies must not be applied blindly.
- Performance Advisor reports 21 foreign-key relationships without covering indexes. This is an independent review backlog, not a justification to make unrelated production schema changes in this slice.

## Next steps

1. Validate homepage, portal and registration flow locally/CI with the current static-export build.
2. Finish inventory by examining actual sidebar/topbar links, AppShell/route guards, API calls and tests for every route.
3. Resolve static event URL behavior under `output: "export"`.
4. Agree on event publish/registration-open states, team captain/join invitation rules, required fields, and duplicate/capacity behavior.
5. Build persisted event registration and team membership using existing backend models/contracts where possible; add a migration only if the audited contract requires it.
6. Run frontend build, backend tests and deployed browser flow as separate evidence.


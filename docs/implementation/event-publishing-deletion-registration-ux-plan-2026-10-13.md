# EVENTOPS-2026 — Event Publishing, Deletion & Registration UX Implementation Plan

**Status:** Draft — planning only  
**Date:** 2026-10-13  
**Repository:** [RAHUL-TKRCET/EVENTOPS-2026](https://github.com/RAHUL-TKRCET/EVENTOPS-2026)  
**Baseline:** PR #44 reported merged into `main`; verify its merge commit and current checks before implementation.  
**Scope:** Resolve missing event publish/delete controls and clarify participant account creation versus event enrollment.  
**Deployment:** Next.js static export on GitHub Pages; FastAPI backend. No production data/schema mutation is authorized by this plan.

> This document is a plan, not a claim that any proposed change has been implemented or deployed.

## 1. Problem statement

An Organization Admin created `Innovation Challenge 2026` (`evt-2ccd836e`) and sees it in `DRAFT` state. The event detail page exposes staff management and the control center, but no visible Publish or Delete action. The event registration page correctly blocks enrollment while the event is unpublished or registration is otherwise ineligible, yet still displays **Create participant account**, which can confuse users into thinking account creation is a way around the event's closed state.

Repository review supports these baseline findings:
- `backend/app/api/v1/events.py` creates new events with `status="DRAFT"`.
- The existing event update endpoint accepts a status field, but currently does not provide a dedicated lifecycle transition contract or publication validation.
- `app/events/detail/page.tsx` displays event status but has no Publish/Delete controls.
- There is no event delete endpoint in the reviewed `backend/app/api/v1/events.py` module.
- `app/events/register/page.tsx` correctly gates the enrollment form on published status and a future registration deadline, but always shows the participant account-creation button when the event loads.
- Participant account creation and event enrollment are separate backend operations. Event ID in a URL is context only, never authorization.

## 2. Non-negotiable constraints

1. Preserve tenant and event authorization in FastAPI. Frontend controls are not a security boundary.
2. Organization Admins may manage only events in their authorized organization. Preserve the existing event-scope rules for other roles; do not broaden permissions just to expose a button.
3. A client-supplied status must not bypass lifecycle validation. Define and validate allowed status transitions server-side.
4. Do not permanently delete events that have registrations, teams, evaluations, incidents, assignments, or other dependent operational/audit records. Inspect actual model relationships and foreign-key behavior before implementing deletion.
5. Do not add an unreviewed database migration, cascade-delete behavior, or production Supabase/RLS changes as part of this UI fix.
6. Account creation must never be represented as event enrollment. Enrollment is complete only after the backend persists the participant's event membership/registration.
7. Preserve event context through account creation where possible, but never let `eventId` grant access or bypass publication/deadline checks.
8. Keep URLs compatible with Next.js static export and GitHub Pages; use the established query-based `?eventId=` contract.
9. Do not claim success until the backend confirms persistence. Do not rely on mock data.
10. Work on a dedicated feature branch and PR; merge only through the established PR-completion process after checks and explicit user approval.

## 3. Phase 0 — Baseline and contract audit (P0; before coding)

### Tasks
- Verify PR #44 is merged, record the exact merge commit, and check current CI/Pages status.
- Inspect current `EventUpdate` schema, event status values, database model relationships, API client methods, route guards and existing tests.
- Search all status writes and lifecycle UI so the new controls do not conflict with another event workflow.
- Inspect foreign keys and dependent records for events, including event members, teams, rounds, criteria, time slots, rules, venues, judges, evaluations, incidents, invitations, audit logs and any other actual linked models.
- Inspect `app/register/page.tsx` to establish whether account creation already returns a new participant to the event registration URL or merely preserves the query string.
- Record which API routes are available in the deployed backend; do not infer that a frontend call exists because a type or button exists.

### Exit criteria
- Written list of supported statuses/transitions and the source of truth for registration-open eligibility.
- Verified dependency map for safe deletion.
- Baseline test/build status and exact main SHA recorded in the PR description or tracking issue.

## 4. Phase 1 — Publish workflow (P0)

### Backend
- Add a dedicated, clearly named publish operation or a tightly validated lifecycle transition using the existing API style; avoid unrestricted status updates.
- Reuse existing authorization helpers and validate the authenticated principal against the event's organization/event scope.
- Permit only intended roles to publish (at minimum, the authorized Organization Admin for that event; any Super Admin exception must match established policy).
- Validate required event metadata and chronology before publication:
  - start/end timestamps parse and start precedes end;
  - registration deadline is configured and follows the agreed rule (normally not later than event start);
  - required public details are present;
  - any other publish requirements discovered in existing product contracts are explicit.
- Return a clear validation response for missing/invalid fields. Keep the event a draft if validation fails.
- Enforce the same rules server-side even if a caller invokes the API directly.

### Frontend
- Add a visible **Publish event** action on the event details page for authorized users when the event is a draft.
- Explain the prerequisites before the action and show field-specific or API-provided errors.
- Ask for confirmation that publication makes the public event portal visible and may open registration when the deadline permits.
- Disable repeat submissions while publishing. Refresh/update event state only after confirmed API success.
- Replace the action with a truthful status/state view after publication; provide a deliberate, separately scoped unpublish/close flow only if the existing lifecycle contract supports it.

### Acceptance criteria
- Authorized Organization Admin can publish a valid draft in their organization.
- Missing deadline, invalid date ordering, or missing required data is rejected with an actionable message; status remains DRAFT.
- Unauthenticated, wrong-organization, unassigned event staff, and disallowed roles receive 401/403 as appropriate.
- Publishing one event cannot change another event.
- Public portal reflects the persisted status after reload.

## 5. Phase 2 — Safe event deletion / removal (P0, after dependency audit)

### Decision gate
Prefer permanent deletion only for a draft with no dependent operational records and only if the current data model permits safe deletion. If dependencies exist, block deletion and explain why. If the product needs removal for events with history, evaluate an explicit archive/cancel lifecycle state as a separate contract; do not silently implement a destructive cascade.

### Backend
- Add a dedicated delete endpoint only after model/foreign-key review.
- Authorize against the same verified event/organization scope used by event details and updates.
- Enforce the draft-only/no-dependent-record policy in the backend, not only the UI.
- Check for dependent records using the actual models and relationships; do not assume the visible roster or team count covers every dependency.
- Use a transaction and return a clear conflict response when deletion is unsafe. Preserve audit/history requirements.
- Add backend tests for successful eligible draft deletion, missing event, wrong organization, disallowed role, published event, and each relevant dependency class.

### Frontend
- Add a clearly labelled **Delete draft** action in event management, visually separated from normal actions.
- Require an explicit confirmation that names the event and warns that deletion cannot be undone.
- Show the backend's blocked-deletion reason and the recommended next action.
- After confirmed deletion, navigate to the organization Events list and show success only after API success.
- Do not show Delete for published/operational events unless a separately reviewed archive/cancel policy explicitly allows it.

### Acceptance criteria
- An eligible empty draft can be deleted by its authorized admin.
- A draft with any protected dependency cannot be deleted.
- Published/active events cannot be permanently deleted through UI or direct API calls.
- Cross-organization and unauthorized deletion attempts are denied.
- No related records are orphaned and no broad cascade is introduced.

## 6. Phase 3 — Participant account creation and registration messaging (P1)

### Frontend behavior
- Keep the account-creation action available only if product intent supports creating a general participant account while an event is closed; otherwise disable/hide it based on the agreed UX contract.
- Preferred clarity if account creation remains available: label it **Create participant account (does not register you)** and explain that enrollment is currently closed for this event.
- Distinguish these states instead of one combined message:
  - event is a draft/unpublished;
  - event is published but deadline is missing;
  - registration deadline has passed;
  - event data/service could not be loaded.
- Keep the public portal link available and offer a clear return path.
- Preserve `eventId` through account creation and return to `/events/register?eventId=…` after successful account creation when this is a supported path; do not auto-enroll solely because an account was created.
- Once the event is eligible, allow a signed-in participant to explicitly enroll and show confirmation only after the backend persists registration.

### Backend contract
- Treat frontend eligibility as presentation only; retain backend enforcement for published status and deadline.
- Review and test duplicate registration/idempotency, participant-role checks, event scope and inactive membership behavior.
- Do not add a new registration table unless the existing EventMember/registration contract is shown to be insufficient.

### Acceptance criteria
- Closed/draft event pages state the exact reason enrollment is unavailable.
- Account creation cannot bypass event eligibility or create event membership by itself.
- Event context survives the account-creation journey without granting authorization.
- For an eligible event, a participant can create/sign in to an account, explicitly enroll, and see a persisted registration confirmation.
- Duplicate submissions do not create duplicate memberships.

## 7. Phase 4 — Verification and release (P0 gate)

### Automated checks
- Backend unit/integration tests for publish/delete authorization, lifecycle validation and dependency conflicts.
- Frontend lint and static export build.
- Test the production API contract from the frontend client; avoid tests that only mock away authorization behavior.
- Add/update route and API tests for public event status and participant registration state.

### Browser acceptance matrix
1. Organization Admin opens the event from Events list and direct `/events/detail?eventId=…`; refresh works.
2. Authorized admin publishes a valid draft and sees the persisted status after reload.
3. Invalid publication is blocked with a useful message.
4. Authorized admin deletes an empty draft after confirmation; deleted event disappears from list.
5. Deletion is blocked for published events and drafts with dependent records.
6. Another organization's admin cannot publish, edit or delete the event.
7. Signed-out visitor opens public portal and registration links directly on GitHub Pages.
8. Draft/unpublished and expired/missing-deadline states explain why enrollment is closed.
9. Participant account creation preserves event context but does not enroll automatically.
10. Eligible participant explicitly enrolls and receives confirmation from persisted backend state.
11. Missing `eventId`, unknown event, backend unavailable, 401, 403 and 409/conflict paths are clear and non-misleading.
12. Copy/open/refresh/back navigation works with the repository base path on GitHub Pages.

### Release gate
- Open a feature branch and PR; record changed files, API contracts, migrations (expected none unless separately approved), checks and manual evidence.
- Verify the exact PR head's required checks and review feedback.
- Do not merge or deploy until the user explicitly confirms the exact PR/head and merge method under the established PR completion process.
- After merge, verify the main commit's GitHub Pages workflow and deployed behavior separately; a passing build is not proof of live browser correctness.

## 8. Dependencies, priorities and scope boundaries

| Priority | Work | Depends on |
|---|---|---|
| P0 | Phase 0 baseline/contract audit | PR #44 merge verification |
| P0 | Publish workflow | Phase 0; agreed lifecycle and required fields |
| P0 | Safe delete/blocked-delete workflow | Phase 0 dependency/FK audit |
| P1 | Registration account-creation messaging/return path | Existing registration/auth contract audit |
| P0 | Tests, direct-route acceptance and PR release gate | Phases 1–3 |

**Explicitly out of scope:** Supabase RLS/security remediation, broad event schema redesign, automatic participant enrollment on account creation, destructive cascading deletion, changing event URL conventions, and unrelated dashboard/role redesign. Track security/RLS work through its existing reviewed gate.

## 9. Definition of done

- [ ] PR #44 merge and current main baseline verified.
- [ ] Event lifecycle and delete eligibility documented from real models/contracts.
- [ ] Publish is visible to authorized admins and validated on the backend.
- [ ] Delete is safe, confirmed, authorized, and blocked when dependencies/history require it.
- [ ] Registration messaging separates account creation from enrollment and preserves event context.
- [ ] Backend authorization and denial cases are tested.
- [ ] Frontend lint/static export and backend tests pass on the exact PR head.
- [ ] Signed-out and role-aware browser acceptance evidence is recorded.
- [ ] Roadmap/tracking issue updated with completed evidence and remaining blockers.
- [ ] No production database changes or live deployment claims without separate verification.

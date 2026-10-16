# Screenshot Issues — Evidence Baseline

Date: 2026-10-16
Branch: fix/screenshot-registration-issues-2026-10-16
Base: current main after PR #52
Status: issue #1 and issue #3 confirmed from source; issue #2 is intentionally blocked pending exact symptom.

## Issue 1 — Participant CTA routing

Source evidence:
- `app/page.tsx` sends the CTA to `/register?accountType=PARTICIPANT`.
- `app/register/page.tsx` detects that flag and redirects to `/events` when no eventId exists.
- `app/events/page.tsx` loads `eventsApi.getAll()` and renders "Managed events & programs", a signed-in organization workspace.
- Public event portal is implemented at `/events/portal?eventId=...`; it uses `eventsApi.getPublicById(eventId)` and links to registration.

Proposed safe fix:
- The homepage participant CTA should lead to a public event discovery route; it must not silently route to the organization managed-events workspace.
- A no-eventId redirect must preserve a public participant intention and provide a public path to event discovery.
- Preserve eventId query strings on event-specific portal/register links.
- Do not combine participant auth with staff event-role login.

Open design decision:
- Whether to implement a dedicated public event list at `/events` or redirect the legacy CTA to an existing public catalogue route must be derived from current route inventory and API availability before making edits. Do not repurpose an authenticated route without checking authorization.

## Issue 2 — Event-role login

Explicitly blocked. User confirmed the prior guess ("participant login option is missing") was wrong. No change to event-role login is authorized until the exact observed unexpected behavior and expected result are recorded or reproduced. The existing six staff roles remain separate from participant registration/authentication.

## Issue 3 — Public registration HTTP 409 semantics

Source evidence:
- `backend/app/api/v1/auth.py` public registration currently emits HTTP 409 for multiple distinct situations:
  - Event not published.
  - Registration deadline absent/expired.
  - Existing User email/account.
  - Existing participant EventMember.
  - Database IntegrityError.
- `app/events/register/page.tsx` maps every HTTP 409 to the same message implying an existing participant account.
- HTTP 503 for email delivery failure is handled separately.
- `lib/api/config.ts` throws Error with `status` and the backend detail string but has no structured error code contract.

Safe implementation direction:
- Add stable typed error codes to FastAPI error detail bodies while keeping existing status codes and human-readable detail where possible.
- Frontend should inspect the typed code and display safe, distinct user guidance.
- If a code is absent, use the existing safe generic message; do not infer business meaning from freeform exception text.
- Do not reveal SQL/internal identifiers or account existence to unauthorized callers beyond the approved UX contract.
- Do not add migrations or alter production data.
- Preserve identity + membership transaction behavior, SMTP rollback, rate-limit audit writes, role protections, and retry behavior.

## Validation required
- Run backend test suite, frontend build/static export, and targeted regressions.
- Test with isolated fixtures and a valid published event with open deadline.
- Live SMTP/browser verification is separate from passing CI.
- Issue #2 remains blocked until the reporter supplies the exact symptom.

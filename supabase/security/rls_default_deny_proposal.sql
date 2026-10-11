-- PROPOSAL ONLY: do not apply to production without backup/restore proof and staging approval.
-- Purpose: immediately close direct Supabase Data API access while EVENTOPS uses a
-- custom string-ID user model and FastAPI-issued JWTs that are not Supabase Auth JWTs.
-- This is intentionally default-deny: no anon/authenticated policies are granted.
-- FastAPI database queries still require per-request authorization and must use a
-- trusted server-side connection. Verify the real production DATABASE_URL role first.
--
-- No production SQL has been executed by the authoring of this proposal.

BEGIN;

DO $rls_lockdown$
DECLARE
    target_table text;
BEGIN
    FOREACH target_table IN ARRAY ARRAY[
        'organizations',
        'audit_logs',
        'users',
        'organization_memberships',
        'events',
        'event_members',
        'rounds',
        'event_rules',
        'venues',
        'judges',
        'allocation_constraints',
        'volunteers',
        'resources',
        'incidents',
        'round_criteria',
        'time_slots',
        'benches',
        'allocation_results',
        'volunteer_tasks',
        'teams',
        'team_members',
        'evaluations',
        'attendance_records',
        'resource_distributions'
    ]
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);
        EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated', target_table);
        EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC', target_table);
    END LOOP;
END
$rls_lockdown$;

COMMIT;

-- Rollout requirements:
-- 1. Capture/restore-test a backup and reconcile migration history first.
-- 2. Confirm browser code does not use Supabase Data API directly (current frontend
--    client in the repository calls FastAPI; recheck before deployment).
-- 3. Confirm FastAPI connects via DATABASE_URL using a server-only role and keeps
--    object/event authorization enabled on every request.
-- 4. Apply to a staging clone, execute supabase/tests/rls_privilege_gate.test.sql,
--    exercise every role workflow, and inspect security advisor output.
-- 5. Only then consider production rollout during an approved change window.
-- 6. This is an interim API lockdown, not the final per-user auth.uid() policy set.
--    Proper per-table policies require an explicit Supabase-Auth-to-EVENTOPS-user
--    identity mapping and role/action matrix; do not compare auth.uid() directly
--    with the current varchar public.users.id.

-- Portable PostgreSQL CI assertions for the EVENTOPS default-deny RLS proposal.
-- Run only against a disposable test database after:
--   1. backend metadata has created the EVENTOPS public tables;
--   2. event_invitations_schema_proposal.sql was applied; and
--   3. rls_default_deny_proposal.sql was applied.
-- This file intentionally avoids pgTAP so the same assertions run in vanilla PostgreSQL CI.
-- It does NOT establish that the FastAPI connection role is subject to RLS.

DO $assertions$
DECLARE
    rls_disabled_count integer;
    api_privilege_count integer;
BEGIN
    SELECT count(*) INTO rls_disabled_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND NOT c.relrowsecurity;

    IF rls_disabled_count <> 0 THEN
        RAISE EXCEPTION 'RLS gate failed: % public base/partitioned tables have RLS disabled',
            rls_disabled_count;
    END IF;

    IF to_regclass('public.event_invitations') IS NULL THEN
        RAISE EXCEPTION 'RLS gate failed: public.event_invitations does not exist';
    END IF;

    SELECT count(*) INTO api_privilege_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND (
        has_table_privilege('anon', c.oid, 'SELECT')
        OR has_table_privilege('anon', c.oid, 'INSERT')
        OR has_table_privilege('anon', c.oid, 'UPDATE')
        OR has_table_privilege('anon', c.oid, 'DELETE')
        OR has_table_privilege('anon', c.oid, 'TRUNCATE')
        OR has_table_privilege('authenticated', c.oid, 'SELECT')
        OR has_table_privilege('authenticated', c.oid, 'INSERT')
        OR has_table_privilege('authenticated', c.oid, 'UPDATE')
        OR has_table_privilege('authenticated', c.oid, 'DELETE')
        OR has_table_privilege('authenticated', c.oid, 'TRUNCATE')
      );

    IF api_privilege_count <> 0 THEN
        RAISE EXCEPTION 'RLS gate failed: anon/authenticated retain direct privileges on % public tables',
            api_privilege_count;
    END IF;

    RAISE NOTICE 'RLS gate passed: RLS enabled and no direct anon/authenticated table privileges on all public base/partitioned tables.';
END
$assertions$;

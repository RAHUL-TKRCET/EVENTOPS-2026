-- pgTAP release gate for supabase/security/rls_default_deny_proposal.sql.
-- Run against staging only after applying the proposal; requires pgTAP.
BEGIN;
SELECT plan(3);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT c.relrowsecurity
  ),
  'every public base table has row-level security enabled'
);

SELECT is(
  (
    SELECT count(*)::bigint
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND (
        has_table_privilege('anon', c.oid, 'SELECT')
        OR has_table_privilege('anon', c.oid, 'INSERT')
        OR has_table_privilege('anon', c.oid, 'UPDATE')
        OR has_table_privilege('anon', c.oid, 'DELETE')
        OR has_table_privilege('anon', c.oid, 'TRUNCATE')
      )
  ),
  0::bigint,
  'anon has no direct read or write privileges on public base tables'
);

SELECT is(
  (
    SELECT count(*)::bigint
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND (
        has_table_privilege('authenticated', c.oid, 'SELECT')
        OR has_table_privilege('authenticated', c.oid, 'INSERT')
        OR has_table_privilege('authenticated', c.oid, 'UPDATE')
        OR has_table_privilege('authenticated', c.oid, 'DELETE')
        OR has_table_privilege('authenticated', c.oid, 'TRUNCATE')
      )
  ),
  0::bigint,
  'authenticated has no direct read or write privileges on public base tables'
);

SELECT * FROM finish();
ROLLBACK;

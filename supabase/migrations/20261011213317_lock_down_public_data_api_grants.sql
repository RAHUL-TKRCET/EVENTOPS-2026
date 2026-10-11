-- Applied on Supabase project kwttdfgxstazmtzpcjnu
-- Migration version: 20261011213317
-- EVENTOPS browser app uses FastAPI + SQLAlchemy; it has no Supabase JS client.
-- The custom EVENTOPS JWT is not a Supabase Auth JWT, so do not attach generic
-- auth.jwt() policies until the identity integration is redesigned and verified.
-- RLS stays enabled as defense in depth; anon/authenticated cannot reach public tables
-- through Supabase's Data API. FastAPI uses its separately configured DB connection.

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

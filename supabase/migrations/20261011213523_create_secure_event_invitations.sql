-- Applied on Supabase project kwttdfgxstazmtzpcjnu
-- Migration version: 20261011213523
-- Secure event / organization invitation records. Raw tokens are never stored.

CREATE TABLE IF NOT EXISTS public.invitations (
  id varchar(64) PRIMARY KEY,
  email varchar(255) NOT NULL,
  role varchar(32) NOT NULL,
  organization_id varchar(64) NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id varchar(64) NULL REFERENCES public.events(id) ON DELETE CASCADE,
  invited_by varchar(64) NULL REFERENCES public.users(id) ON DELETE SET NULL,
  token_hash varchar(64) NOT NULL UNIQUE,
  status varchar(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACCEPTED','REVOKED','EXPIRED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz NULL,
  revoked_at timestamptz NULL,
  CHECK ((role = 'ORGANIZATION_ADMIN' AND event_id IS NULL) OR (role <> 'ORGANIZATION_ADMIN' AND event_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS invitations_org_status_created_idx ON public.invitations (organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS invitations_event_status_idx ON public.invitations (event_id, status) WHERE event_id IS NOT NULL;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.invitations FROM anon, authenticated;

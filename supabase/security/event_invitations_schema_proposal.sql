-- PROPOSAL ONLY: review and apply only after schema baseline + restore test.
-- The app's current migration history is empty even though public tables contain data.
-- This file is not in supabase/migrations and has not been executed on production.

CREATE TABLE IF NOT EXISTS public.event_invitations (
    id varchar(64) PRIMARY KEY,
    token_hash varchar(64) NOT NULL UNIQUE,
    event_id varchar(64) NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    event_member_id varchar(64) NOT NULL UNIQUE REFERENCES public.event_members(id) ON DELETE CASCADE,
    invited_by_user_id varchar(64) NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    email varchar(255) NOT NULL,
    role varchar(32) NOT NULL,
    expires_at timestamptz NOT NULL,
    redeemed_at timestamptz NULL,
    revoked_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT event_invitations_role_check
      CHECK (role IN ('EVENT_ADMIN','COORDINATOR','JUDGE','VOLUNTEER','PARTICIPANT','TECHNICAL_STAFF','RESOURCE_MANAGER'))
);

CREATE INDEX IF NOT EXISTS ix_event_invitations_event_id
    ON public.event_invitations(event_id);
CREATE INDEX IF NOT EXISTS ix_event_invitations_email
    ON public.event_invitations(email);
CREATE INDEX IF NOT EXISTS ix_event_invitations_token_hash
    ON public.event_invitations(token_hash);

ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.event_invitations FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.event_invitations FROM PUBLIC;

-- No anon/authenticated policies are created by design. The application currently
-- uses custom EVENTOPS users and server-side SQLAlchemy. Use the trusted backend
-- connection only, and enforce authorization for every request.

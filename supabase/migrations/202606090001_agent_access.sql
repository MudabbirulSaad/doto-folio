-- Scoped CLI agent access for portfolio/admin APIs.

CREATE TABLE IF NOT EXISTS agent_access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  requested_scopes TEXT[] NOT NULL DEFAULT '{}',
  approved_scopes TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  code_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  approved_by UUID DEFAULT NULL,
  rejected_by UUID DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES agent_access_requests(id) ON DELETE SET NULL,
  invitation_id UUID DEFAULT NULL,
  agent_name TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_label TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  instructions_md TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'revoked')),
  code_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_by UUID NOT NULL,
  claimed_token_id UUID REFERENCES agent_tokens(id) ON DELETE SET NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE agent_tokens
  ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES agent_invitations(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS agent_audit_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('agent', 'admin', 'system')),
  action TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('success', 'failure')),
  agent_token_id UUID REFERENCES agent_tokens(id) ON DELETE SET NULL,
  access_request_id UUID REFERENCES agent_access_requests(id) ON DELETE SET NULL,
  invitation_id UUID REFERENCES agent_invitations(id) ON DELETE SET NULL,
  admin_user_id UUID DEFAULT NULL,
  scope TEXT DEFAULT NULL,
  route TEXT DEFAULT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_access_requests_status ON agent_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_agent_access_requests_code_hash ON agent_access_requests(code_hash);
CREATE INDEX IF NOT EXISTS idx_agent_access_requests_expires_at ON agent_access_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_agent_invitations_status ON agent_invitations(status);
CREATE INDEX IF NOT EXISTS idx_agent_invitations_code_hash ON agent_invitations(code_hash);
CREATE INDEX IF NOT EXISTS idx_agent_invitations_expires_at ON agent_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_agent_tokens_token_hash ON agent_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_agent_tokens_invitation_id ON agent_tokens(invitation_id);
CREATE INDEX IF NOT EXISTS idx_agent_tokens_active ON agent_tokens(expires_at, revoked_at);
CREATE INDEX IF NOT EXISTS idx_agent_audit_events_created_at ON agent_audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_audit_events_action ON agent_audit_events(action);

ALTER TABLE agent_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_audit_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agent_access_requests'
      AND policyname = 'Authenticated users can read agent access requests'
  ) THEN
    CREATE POLICY "Authenticated users can read agent access requests"
      ON agent_access_requests FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agent_invitations'
      AND policyname = 'Authenticated users can read agent invitations'
  ) THEN
    CREATE POLICY "Authenticated users can read agent invitations"
      ON agent_invitations FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agent_tokens'
      AND policyname = 'Authenticated users can read agent tokens'
  ) THEN
    CREATE POLICY "Authenticated users can read agent tokens"
      ON agent_tokens FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agent_audit_events'
      AND policyname = 'Authenticated users can read agent audit events'
  ) THEN
    CREATE POLICY "Authenticated users can read agent audit events"
      ON agent_audit_events FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_agent_access_requests_updated_at ON agent_access_requests;
CREATE TRIGGER update_agent_access_requests_updated_at
  BEFORE UPDATE ON agent_access_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_invitations_updated_at ON agent_invitations;
CREATE TRIGGER update_agent_invitations_updated_at
  BEFORE UPDATE ON agent_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

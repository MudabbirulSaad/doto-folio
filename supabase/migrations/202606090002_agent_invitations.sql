-- Invite-first agent access extension. Safe to run after the original agent access migration.

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

ALTER TABLE agent_tokens
  ALTER COLUMN expires_at DROP NOT NULL;

ALTER TABLE agent_invitations
  ALTER COLUMN token_expires_at DROP NOT NULL;

ALTER TABLE agent_audit_events
  ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES agent_invitations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agent_invitations_status ON agent_invitations(status);
CREATE INDEX IF NOT EXISTS idx_agent_invitations_code_hash ON agent_invitations(code_hash);
CREATE INDEX IF NOT EXISTS idx_agent_invitations_expires_at ON agent_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_agent_tokens_invitation_id ON agent_tokens(invitation_id);

ALTER TABLE agent_invitations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
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
END $$;

DROP TRIGGER IF EXISTS update_agent_invitations_updated_at ON agent_invitations;
CREATE TRIGGER update_agent_invitations_updated_at
  BEFORE UPDATE ON agent_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Skills as Evidence / Capability Matrix.
-- Adds first-class capability groups and proof points for the public portfolio.

CREATE TABLE IF NOT EXISTS skill_capabilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Sparkles',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_evidence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  capability_id UUID NOT NULL REFERENCES skill_capabilities(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  proof_label TEXT DEFAULT NULL,
  proof_url TEXT DEFAULT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT skill_evidence_capability_label_unique UNIQUE (capability_id, label),
  CONSTRAINT skill_evidence_proof_url_format CHECK (
    proof_url IS NULL OR proof_url = '' OR proof_url LIKE '/%' OR proof_url ~* '^https?://'
  )
);

CREATE INDEX IF NOT EXISTS idx_skill_capabilities_display_order ON skill_capabilities(display_order);
CREATE INDEX IF NOT EXISTS idx_skill_capabilities_published_order ON skill_capabilities(is_published, display_order);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_capability_order ON skill_evidence(capability_id, display_order);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_published_order ON skill_evidence(is_published, display_order);

ALTER TABLE skill_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_evidence ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'skill_capabilities' AND policyname = 'Public can read published skill capabilities'
  ) THEN
    CREATE POLICY "Public can read published skill capabilities" ON skill_capabilities
      FOR SELECT USING (is_published = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'skill_evidence' AND policyname = 'Public can read published skill evidence'
  ) THEN
    CREATE POLICY "Public can read published skill evidence" ON skill_evidence
      FOR SELECT USING (
        is_published = true AND EXISTS (
          SELECT 1 FROM skill_capabilities
          WHERE skill_capabilities.id = skill_evidence.capability_id
          AND skill_capabilities.is_published = true
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'skill_capabilities' AND policyname = 'Authenticated users can manage skill capabilities'
  ) THEN
    CREATE POLICY "Authenticated users can manage skill capabilities" ON skill_capabilities
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'skill_evidence' AND policyname = 'Authenticated users can manage skill evidence'
  ) THEN
    CREATE POLICY "Authenticated users can manage skill evidence" ON skill_evidence
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

CREATE TRIGGER update_skill_capabilities_updated_at
  BEFORE UPDATE ON skill_capabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skill_evidence_updated_at
  BEFORE UPDATE ON skill_evidence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO skill_capabilities (title, summary, icon_name, display_order, is_published) VALUES
('Product Frontend', 'I turn portfolio and product requirements into responsive, polished interfaces that recruiters can skim and engineers can trust.', 'LayoutDashboard', 1, true),
('Backend & API Design', 'I design Next.js API boundaries, validation, rate limiting, and response contracts around real workflows.', 'Route', 2, true),
('Auth & Access Control', 'I build scoped access flows with clear authentication, authorization, and revocation boundaries.', 'ShieldCheck', 3, true),
('Data & Content Systems', 'I model content so public pages, admin tools, and backend repositories all share durable source-of-truth data.', 'Database', 4, true),
('AI-Native Product Thinking', 'I design agent-facing experiences with public context, private instructions, and operational guardrails.', 'Bot', 5, true)
ON CONFLICT (title) DO UPDATE SET
  summary = EXCLUDED.summary,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published;

INSERT INTO skill_evidence (capability_id, label, description, technologies, proof_label, proof_url, display_order, is_published)
SELECT capability.id, evidence.label, evidence.description, evidence.technologies, evidence.proof_label, evidence.proof_url, evidence.display_order, true
FROM skill_capabilities capability
JOIN (
  VALUES
  ('Product Frontend', 'Public portfolio sections', 'Backend-managed hero, about, projects, skills, contact, and footer sections render as one coherent product surface.', ARRAY['Next.js', 'React', 'TypeScript', 'Tailwind CSS'], 'View portfolio', '/', 1),
  ('Product Frontend', 'Admin content workflows', 'Admin pages manage content, projects, comments, blog taxonomy, and agent access through typed client workflows.', ARRAY['React', 'Framer Motion', 'shadcn/ui'], NULL, NULL, 2),
  ('Backend & API Design', 'Scoped content APIs', 'Thin Next.js routes authorize requests, delegate to application use cases, and keep Supabase concerns inside adapters.', ARRAY['Next.js API Routes', 'Zod', 'TypeScript'], NULL, NULL, 1),
  ('Backend & API Design', 'Operational guards', 'Rate limiting, response envelopes, and route tests keep public and admin workflows predictable.', ARRAY['API Design', 'Validation', 'Testing'], 'Health check', '/api/health', 2),
  ('Auth & Access Control', 'Invite-first agent access', 'Agents claim one-time invitations, receive scoped bearer tokens, and inspect only the context allowed by their scopes.', ARRAY['Bearer Tokens', 'Supabase', 'RLS'], 'Agent entrypoint', '/skill.md', 1),
  ('Auth & Access Control', 'Admin authorization', 'Admin APIs use scoped authorization before loading private content or mutating CMS records.', ARRAY['HttpOnly Auth', 'RBAC', 'Next.js'], 'Agent docs', '/api/agent/public-context', 2),
  ('Data & Content Systems', 'Supabase-backed CMS', 'Portfolio content, projects, skills, contacts, blog posts, comments, and agent access are modeled as managed records.', ARRAY['Supabase', 'Postgres', 'Repository Pattern'], 'Public context', '/api/agent/public-context', 1),
  ('Data & Content Systems', 'Hexagonal architecture', 'Server application ports and Supabase adapters separate domain workflow rules from database details.', ARRAY['TypeScript', 'Ports & Adapters', 'Testing'], NULL, NULL, 2),
  ('AI-Native Product Thinking', 'Agent onboarding contract', 'A public skill document tells agents how to join safely without requesting Supabase credentials.', ARRAY['Agent UX', 'API Contracts', 'Security'], 'Read skill.md', '/skill.md', 1),
  ('AI-Native Product Thinking', 'Scope-aware private context', 'Private agent instructions and portfolio context are exposed through token-authenticated API routes.', ARRAY['AI Agents', 'Access Scopes', 'Next.js'], 'Agent context API', '/api/agent/context', 2)
) AS evidence(capability_title, label, description, technologies, proof_label, proof_url, display_order)
ON capability.title = evidence.capability_title
ON CONFLICT (capability_id, label) DO UPDATE SET
  description = EXCLUDED.description,
  technologies = EXCLUDED.technologies,
  proof_label = EXCLUDED.proof_label,
  proof_url = EXCLUDED.proof_url,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published;

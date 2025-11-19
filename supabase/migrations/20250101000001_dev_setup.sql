-- Development Setup: Disable RLS temporarily for easier testing
-- IMPORTANT: Re-enable RLS before production deployment!

-- Temporarily disable RLS for development
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_docs DISABLE ROW LEVEL SECURITY;
ALTER TABLE ecp_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs DISABLE ROW LEVEL SECURITY;

-- Create a dummy user for development
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'dev@example.com',
  'dummy',
  now(),
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Add comment to remind to re-enable RLS
COMMENT ON TABLE projects IS 'RLS DISABLED FOR DEV - Re-enable before production!';

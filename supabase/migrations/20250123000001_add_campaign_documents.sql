-- Add campaign_id to knowledge_base_docs for campaign-specific documents
-- Documents without campaign_id are project-level (apply to all campaigns)
-- Documents with campaign_id are campaign-specific

-- Add optional campaign_id column
ALTER TABLE knowledge_base_docs
ADD COLUMN campaign_id UUID REFERENCES ecp_campaigns(id) ON DELETE CASCADE;

-- Create index for efficient filtering
CREATE INDEX idx_kb_docs_campaign_id ON knowledge_base_docs(campaign_id);

-- Update RLS policy to include campaign ownership check
DROP POLICY IF EXISTS "Users manage docs in own projects" ON knowledge_base_docs;

CREATE POLICY "Users manage docs in own projects"
  ON knowledge_base_docs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = knowledge_base_docs.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON COLUMN knowledge_base_docs.campaign_id IS 'Optional: If set, document is campaign-specific. If NULL, document applies to all campaigns in the project.';

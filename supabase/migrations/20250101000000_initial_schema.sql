-- ECP Generation System - Initial Schema
-- Version: 1.0.0
-- Description: Hierarchical project management with document-based context control

-- ============================================================================
-- TYPES
-- ============================================================================

CREATE TYPE doc_category AS ENUM ('product', 'competitor', 'research', 'output');

-- ============================================================================
-- TABLES
-- ============================================================================

-- PROJECTS: Client configuration and process definition
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- CONTEXT CONFIGURATION
  -- Structure: { "step_1": ["doc_uuid_1", "doc_uuid_2"], "step_2": ["doc_uuid_3"], ... }
  -- Defines which documents are used in each step
  context_config JSONB DEFAULT '{}'::jsonb,

  -- EDITABLE MASTER PROMPTS
  prompt_deep_research TEXT NOT NULL DEFAULT 'Conduct a thorough analysis of the unmet financial need for ECP: ''{{ecp_name}}'' with Pain: ''{{problem_core}}'' in {{country}} {{industry}} market...',
  prompt_1_find_place TEXT NOT NULL DEFAULT 'ACT AS: Senior Strategist. SOURCE MATERIAL: Use ONLY the Market Context provided. RESTRICTION: Do NOT refer to client product yet. TASK: Identify Value Criteria...',
  prompt_2_select_assets TEXT NOT NULL DEFAULT 'ACT AS: Product Owner. SOURCE MATERIAL: Use ONLY the Product Context provided. TASK: Map existing assets to the criteria from previous step...',
  prompt_3_proof_legit TEXT NOT NULL DEFAULT 'ACT AS: Brand Strategist. TASK: Define Proof Points for the selected assets...',
  prompt_4_final_output TEXT NOT NULL DEFAULT 'ACT AS: Copywriter. TASK: Generate VP and USPs in English and Spanish for the {{country}} market...',

  -- STEP GUIDANCE (NEW: Instructions for users at each step)
  step_1_guidance TEXT DEFAULT 'Select market research documents and competitor analysis. These will help identify where your solution fits in the market.',
  step_2_guidance TEXT DEFAULT 'Select product documentation and feature descriptions. These will be mapped to market opportunities identified in Step 1.',
  step_3_guidance TEXT DEFAULT 'Select proof points, case studies, and validation documents. These support the claims from Step 2.',
  step_4_guidance TEXT DEFAULT 'Review outputs from previous steps and select final messaging guidelines or brand voice documents.',

  CONSTRAINT projects_name_check CHECK (char_length(name) >= 1 AND char_length(name) <= 200)
);

-- KNOWLEDGE BASE: Document storage with extracted content
CREATE TABLE knowledge_base_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  category doc_category NOT NULL,
  extracted_content TEXT NOT NULL,
  file_size_bytes BIGINT,
  token_count INTEGER, -- Estimated tokens (chars/4 approximation)
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT kb_docs_filename_check CHECK (char_length(filename) >= 1),
  CONSTRAINT kb_docs_content_check CHECK (char_length(extracted_content) >= 1)
);

-- ECP CAMPAIGNS: Niche-specific execution sessions
CREATE TABLE ecp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,

  -- NICHE INPUTS
  ecp_name TEXT NOT NULL,
  problem_core TEXT NOT NULL,
  country TEXT NOT NULL,
  industry TEXT NOT NULL,

  -- STATE AND MEMORY
  status TEXT DEFAULT 'pending_research' CHECK (status IN (
    'pending_research',
    'research_complete',
    'step_1_running',
    'step_1_complete',
    'step_2_running',
    'step_2_complete',
    'step_3_running',
    'step_3_complete',
    'step_4_running',
    'completed',
    'error'
  )),

  -- RESEARCH PHASE
  deep_research_text TEXT,
  deep_research_tokens INTEGER,

  -- STEP OUTPUTS
  output_1_find_place TEXT,
  output_1_tokens INTEGER,
  output_2_select_assets TEXT,
  output_2_tokens INTEGER,
  output_3_proof_legit TEXT,
  output_3_tokens INTEGER,
  output_final_messages TEXT,
  output_final_tokens INTEGER,

  -- METADATA
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  error_message TEXT,

  CONSTRAINT campaigns_ecp_name_check CHECK (char_length(ecp_name) >= 1),
  CONSTRAINT campaigns_problem_check CHECK (char_length(problem_core) >= 1)
);

-- EXECUTION LOGS: Detailed tracking of each generation step
CREATE TABLE execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES ecp_campaigns(id) ON DELETE CASCADE NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'error')),
  input_tokens INTEGER,
  output_tokens INTEGER,
  duration_ms INTEGER,
  model_used TEXT,
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_kb_docs_project_id ON knowledge_base_docs(project_id);
CREATE INDEX idx_kb_docs_category ON knowledge_base_docs(category);
CREATE INDEX idx_campaigns_project_id ON ecp_campaigns(project_id);
CREATE INDEX idx_campaigns_status ON ecp_campaigns(status);
CREATE INDEX idx_execution_logs_campaign_id ON execution_logs(campaign_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only see/modify their own projects
CREATE POLICY "Users manage own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id);

-- Knowledge Base: Access through project ownership
CREATE POLICY "Users manage docs in own projects"
  ON knowledge_base_docs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = knowledge_base_docs.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Campaigns: Access through project ownership
CREATE POLICY "Users manage campaigns in own projects"
  ON ecp_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = ecp_campaigns.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Execution Logs: Access through campaign ownership
CREATE POLICY "Users view logs for own campaigns"
  ON execution_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ecp_campaigns
      JOIN projects ON projects.id = ecp_campaigns.project_id
      WHERE ecp_campaigns.id = execution_logs.campaign_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON ecp_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Token estimation on insert/update
CREATE OR REPLACE FUNCTION estimate_tokens()
RETURNS TRIGGER AS $$
BEGIN
  NEW.token_count = CEIL(char_length(NEW.extracted_content)::numeric / 4);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kb_docs_estimate_tokens
  BEFORE INSERT OR UPDATE OF extracted_content ON knowledge_base_docs
  FOR EACH ROW
  EXECUTE FUNCTION estimate_tokens();

-- ============================================================================
-- SEED DATA (Optional - Default prompts are in table definition)
-- ============================================================================

COMMENT ON TABLE projects IS 'Client configuration container with reusable prompts';
COMMENT ON TABLE knowledge_base_docs IS 'Uploaded documents with extracted text content';
COMMENT ON TABLE ecp_campaigns IS 'Niche-specific campaign execution sessions';
COMMENT ON TABLE execution_logs IS 'Detailed audit trail of AI generation steps';
COMMENT ON COLUMN projects.context_config IS 'JSONB mapping of step_key -> [doc_ids] for granular context control';
COMMENT ON COLUMN knowledge_base_docs.token_count IS 'Approximate token count (chars/4) for context size management';

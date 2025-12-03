-- Add research_prompt field to ecp_campaigns
-- This stores the prompt that users should use to execute deep research for this campaign

ALTER TABLE ecp_campaigns
ADD COLUMN IF NOT EXISTS research_prompt TEXT;

-- Add comment for documentation
COMMENT ON COLUMN ecp_campaigns.research_prompt IS 'The prompt that users should use to execute deep research for this campaign. Can be imported from CSV or set manually.';

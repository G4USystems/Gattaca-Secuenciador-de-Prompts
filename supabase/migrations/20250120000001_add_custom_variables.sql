-- Migration: Add custom_variables to campaigns
-- Allows users to define custom variables that will be replaced in prompts

-- Add custom_variables column to campaigns table
ALTER TABLE ecp_campaigns ADD COLUMN IF NOT EXISTS custom_variables JSONB DEFAULT '{}'::jsonb;

-- Comment explaining the system
COMMENT ON COLUMN ecp_campaigns.custom_variables IS
'Custom variables defined by user when creating campaign.
These are replaced in prompts using {{variable_name}} syntax.
Example: {"target_audience": "CTOs", "budget_range": "$100k-$500k"}
Variables are replaced in prompts before execution.';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_campaigns_custom_variables ON ecp_campaigns USING GIN (custom_variables);

-- Add deep_research_prompts field to projects table
-- These are prompt templates that users can copy with campaign variables substituted
-- to help generate the additional research documents needed for each campaign

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deep_research_prompts JSONB DEFAULT '[]'::jsonb;

-- Comment explaining the structure
COMMENT ON COLUMN projects.deep_research_prompts IS
'Array of research prompt templates for generating campaign-specific documents.
Structure: [{"id": "uuid", "name": "Prompt Name", "content": "Prompt with {{variables}}..."}]
Example: [
  {"id": "abc-123", "name": "Análisis de Competidores", "content": "Analiza cómo los competidores abordan el problema de {{problem_core}} en {{country}}..."},
  {"id": "def-456", "name": "Research de Mercado", "content": "Investiga el mercado de {{industry}} en {{country}} para el segmento..."}
]
Users can copy these prompts with campaign variables replaced to generate research documents.';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_deep_research_prompts ON projects USING GIN (deep_research_prompts);

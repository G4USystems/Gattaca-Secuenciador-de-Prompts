-- Migration: Add expiration and limit fields to OpenRouter tokens
-- Description: Store token expiration and credit limit information from OpenRouter

-- Add expires_at column to track when tokens expire (nullable - can be null if no expiration)
ALTER TABLE user_openrouter_tokens
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

-- Add limit column to track credit limit if provided by OpenRouter (nullable)
ALTER TABLE user_openrouter_tokens
ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT NULL;

-- Add limit_remaining column to track remaining credits (nullable)
ALTER TABLE user_openrouter_tokens
ADD COLUMN IF NOT EXISTS limit_remaining NUMERIC DEFAULT NULL;

-- Add usage column to track total usage (nullable)
ALTER TABLE user_openrouter_tokens
ADD COLUMN IF NOT EXISTS usage NUMERIC DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN user_openrouter_tokens.expires_at IS 'Token expiration date from OpenRouter (ISO 8601 timestamp). NULL means no expiration.';
COMMENT ON COLUMN user_openrouter_tokens.credit_limit IS 'Credit limit in USD for this token if provided by OpenRouter. NULL means no limit set.';
COMMENT ON COLUMN user_openrouter_tokens.limit_remaining IS 'Remaining credit balance in USD. NULL means no limit tracking.';
COMMENT ON COLUMN user_openrouter_tokens.usage IS 'Total OpenRouter credit usage in USD.';

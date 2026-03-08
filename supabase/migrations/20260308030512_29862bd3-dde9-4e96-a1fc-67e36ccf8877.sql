
-- Add needs_review and original_source_content columns to trends
ALTER TABLE public.trends ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT true;
ALTER TABLE public.trends ADD COLUMN IF NOT EXISTS original_source_content text;

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

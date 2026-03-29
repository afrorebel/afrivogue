
-- Add source_url column to moodboard_items for linking to source/social profile
ALTER TABLE public.moodboard_items ADD COLUMN IF NOT EXISTS source_url text;

-- Add meta_description column to article_submissions for SEO
ALTER TABLE public.article_submissions ADD COLUMN IF NOT EXISTS meta_description text;


-- Add image and source fields to trends
ALTER TABLE public.trends 
  ADD COLUMN IF NOT EXISTS featured_image_url text,
  ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_name text;

-- Create storage bucket for trend images
INSERT INTO storage.buckets (id, name, public) VALUES ('trend-images', 'trend-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read trend images
CREATE POLICY "Anyone can read trend images"
ON storage.objects FOR SELECT
USING (bucket_id = 'trend-images');

-- Allow admins to upload trend images
CREATE POLICY "Admins can upload trend images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'trend-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete trend images
CREATE POLICY "Admins can delete trend images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'trend-images' AND public.has_role(auth.uid(), 'admin'));

-- Create newsletter_subscribers table
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  source text DEFAULT 'popup'
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers FOR INSERT
WITH CHECK (true);

-- Admins can view subscribers
CREATE POLICY "Admins can view subscribers"
ON public.newsletter_subscribers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

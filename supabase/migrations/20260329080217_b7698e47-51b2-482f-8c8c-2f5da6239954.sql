
-- Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'contributor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'publisher';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';

-- Create categories table with subcategory support
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default categories
INSERT INTO public.categories (name) VALUES
  ('Fashion'), ('Beauty'), ('Luxury'), ('Art & Design'), ('Culture'), ('Business'), ('Entertainment'), ('Lifestyle')
ON CONFLICT (name) DO NOTHING;

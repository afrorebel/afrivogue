
-- Moodboard items table
CREATE TABLE public.moodboard_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  related_trend_id UUID REFERENCES public.trends(id) ON DELETE SET NULL,
  submitted_by UUID,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.moodboard_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved items
CREATE POLICY "Anyone can read approved moodboard items"
  ON public.moodboard_items FOR SELECT TO public
  USING (approved = true);

-- Admins full access
CREATE POLICY "Admins can manage all moodboard items"
  ON public.moodboard_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can submit (insert only)
CREATE POLICY "Users can submit moodboard items"
  ON public.moodboard_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

-- Users can see own pending submissions
CREATE POLICY "Users can view own submissions"
  ON public.moodboard_items FOR SELECT TO authenticated
  USING (auth.uid() = submitted_by);

-- Saved moodboard items table
CREATE TABLE public.saved_moodboard_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  moodboard_item_id UUID NOT NULL REFERENCES public.moodboard_items(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, moodboard_item_id)
);

ALTER TABLE public.saved_moodboard_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved moodboard items"
  ON public.saved_moodboard_items FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

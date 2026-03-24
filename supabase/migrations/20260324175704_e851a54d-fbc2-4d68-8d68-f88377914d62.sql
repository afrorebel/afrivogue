
CREATE TABLE public.favorite_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  author_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, author_id)
);

ALTER TABLE public.favorite_authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
ON public.favorite_authors
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read favorite counts"
ON public.favorite_authors
FOR SELECT
TO public
USING (true);

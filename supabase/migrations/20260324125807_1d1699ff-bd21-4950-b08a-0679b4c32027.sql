
CREATE TABLE public.trivia_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  category text DEFAULT 'All',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trivia_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read trivia scores" ON public.trivia_scores FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can insert own scores" ON public.trivia_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all scores" ON public.trivia_scores FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_trivia_scores_score ON public.trivia_scores (score DESC);
CREATE INDEX idx_trivia_scores_user ON public.trivia_scores (user_id);

CREATE TABLE public.trivia_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL,
  explanation text NOT NULL DEFAULT '',
  category text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium',
  fun_fact text,
  source_trend_id uuid REFERENCES public.trends(id) ON DELETE SET NULL,
  published boolean NOT NULL DEFAULT true,
  needs_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trivia_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published trivia" ON public.trivia_questions
  FOR SELECT TO public USING (published = true);

CREATE POLICY "Admins can manage all trivia" ON public.trivia_questions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_trivia_updated_at
  BEFORE UPDATE ON public.trivia_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
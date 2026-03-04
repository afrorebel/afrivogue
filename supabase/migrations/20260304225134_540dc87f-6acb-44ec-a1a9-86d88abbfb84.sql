
-- Role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can view roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trends table
CREATE TABLE public.trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL,
  cultural_significance TEXT NOT NULL,
  geo_relevance TEXT NOT NULL CHECK (geo_relevance IN ('Africa', 'Diaspora', 'Global')),
  urgency TEXT NOT NULL CHECK (urgency IN ('Breaking', 'Emerging', 'Slow-Burn')),
  category TEXT NOT NULL CHECK (category IN ('Fashion', 'Beauty', 'Luxury', 'Art & Design', 'Culture', 'Business')),
  content_tier TEXT NOT NULL CHECK (content_tier IN ('Daily Brief', 'Editorial Feature', 'Premium Long-Form', 'Cultural Forecast', 'Story Mode')),
  image_hint TEXT,
  editorial_content JSONB,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published trends" ON public.trends
  FOR SELECT USING (published = true);

CREATE POLICY "Admins can do everything with trends" ON public.trends
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Forecasts table
CREATE TABLE public.forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  projection TEXT NOT NULL,
  evidence TEXT NOT NULL,
  implications TEXT NOT NULL,
  domain TEXT NOT NULL,
  horizon TEXT NOT NULL CHECK (horizon IN ('6Months', '1-2 Years', '3-5 Years')),
  signal_strength TEXT NOT NULL CHECK (signal_strength IN ('Definitive', 'High Confidence', 'Early Signal')),
  region TEXT NOT NULL CHECK (region IN ('Africa', 'Diaspora', 'Global')),
  published BOOLEAN NOT NULL DEFAULT false,
  published_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published forecasts" ON public.forecasts
  FOR SELECT USING (published = true);

CREATE POLICY "Admins can do everything with forecasts" ON public.forecasts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Site settings (key-value store for customization)
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_trends_updated_at BEFORE UPDATE ON public.trends FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forecasts_updated_at BEFORE UPDATE ON public.forecasts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('hero', '{"subtitle": "Global Trend Intelligence", "title": "The Pulse of African & Global Fashion", "description": "Curated signals from the frontlines of fashion, beauty, culture, and the creative economy — centering African and Black voices."}'::jsonb),
  ('footer', '{"tagline": "© 2026 Afrivogue. Global Trend Intelligence Engine.", "subtitle": "Africa & the Diaspora · Luxury · Culture · Foresight"}'::jsonb),
  ('nav_links', '[{"label": "Trends", "href": "/"}, {"label": "Forecast", "href": "/forecast"}, {"label": "Story Mode", "href": "/story/4"}, {"label": "Culture", "href": "/forecast#culture"}, {"label": "About", "href": "/#about"}]'::jsonb);

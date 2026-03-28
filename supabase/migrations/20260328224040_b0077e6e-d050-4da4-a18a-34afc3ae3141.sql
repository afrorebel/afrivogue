
-- Product bundles table
CREATE TABLE public.product_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  discount_percentage numeric NOT NULL DEFAULT 10,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bundle items (which products in each bundle)
CREATE TABLE public.bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.product_bundles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  UNIQUE(bundle_id, product_id)
);

-- Cross-sell rules
CREATE TABLE public.cross_sell_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  recommended_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_product_id, recommended_product_id)
);

-- Customer segments
CREATE TABLE public.customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  color text NOT NULL DEFAULT '#D4A853',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Segment membership
CREATE TABLE public.segment_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id uuid NOT NULL REFERENCES public.customer_segments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(segment_id, user_id)
);

-- RLS
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_sell_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_members ENABLE ROW LEVEL SECURITY;

-- Bundles: public read, admin manage
CREATE POLICY "Anyone can read published bundles" ON public.product_bundles FOR SELECT TO public USING (published = true);
CREATE POLICY "Admins can manage bundles" ON public.product_bundles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read bundle items" ON public.bundle_items FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage bundle items" ON public.bundle_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read cross sell" ON public.cross_sell_rules FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage cross sell" ON public.cross_sell_rules FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage segments" ON public.customer_segments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage segment members" ON public.segment_members FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

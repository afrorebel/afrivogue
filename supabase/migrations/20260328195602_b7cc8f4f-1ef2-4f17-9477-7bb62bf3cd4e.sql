ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz DEFAULT NULL;

CREATE TABLE IF NOT EXISTS crm_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  template_name text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE crm_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage CRM logs" ON crm_email_log FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
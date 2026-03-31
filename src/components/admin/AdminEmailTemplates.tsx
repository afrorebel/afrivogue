import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Save, Mail, Eye, EyeOff, FileText, Send } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
import ImageUrlUpload from "./ImageUrlUpload";

interface EmailTemplateOverride {
  subject?: string;
  heading?: string;
  body_text?: string;
  button_label?: string;
  footer_text?: string;
  logo_url?: string;
  primary_color?: string;
  font_family?: string;
}

type TemplateOverrides = Record<string, EmailTemplateOverride>;

const TEMPLATE_CONFIGS = [
  { key: "contact-confirmation", label: "Contact Confirmation", description: "Sent when someone submits the contact form" },
  { key: "welcome", label: "Welcome Email", description: "Sent after a new user signs up" },
  { key: "order-receipt", label: "Order Receipt", description: "Sent after a successful purchase" },
];

const DEFAULT_OVERRIDE: EmailTemplateOverride = {
  subject: "",
  heading: "",
  body_text: "",
  button_label: "",
  footer_text: "",
  logo_url: "",
  primary_color: "#D4A243",
  font_family: "'Playfair Display', Georgia, serif",
};

const AdminEmailTemplates = () => {
  const qc = useQueryClient();
  const [previewing, setPreviewing] = useState<string | null>(null);

  const { data: overrides, isLoading } = useQuery({
    queryKey: ["admin-email-overrides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "email_template_overrides")
        .maybeSingle();
      if (error) throw error;
      return (data?.value as unknown as TemplateOverrides) || {};
    },
  });

  const [localOverrides, setLocalOverrides] = useState<TemplateOverrides>({});

  const getOverride = (key: string): EmailTemplateOverride => ({
    ...DEFAULT_OVERRIDE,
    ...(overrides?.[key] || {}),
    ...(localOverrides[key] || {}),
  });

  const updateField = (templateKey: string, field: keyof EmailTemplateOverride, value: string) => {
    setLocalOverrides((prev) => ({
      ...prev,
      [templateKey]: {
        ...DEFAULT_OVERRIDE,
        ...(overrides?.[templateKey] || {}),
        ...(prev[templateKey] || {}),
        [field]: value,
      },
    }));
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const merged: TemplateOverrides = { _global: getOverride("_global") };
      for (const t of TEMPLATE_CONFIGS) {
        merged[t.key] = getOverride(t.key);
      }
      const { data, error } = await supabase
        .from("site_settings")
        .update({ value: merged as unknown as Json })
        .eq("key", "email_template_overrides")
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        const { error: insertError } = await supabase
          .from("site_settings")
          .insert({ key: "email_template_overrides", value: merged as unknown as Json });
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-email-overrides"] });
      setLocalOverrides({});
      toast({ title: "Email templates saved" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const sendTestMut = useMutation({
    mutationFn: async (templateName: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No email found for current user");
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName,
          recipientEmail: user.email,
          idempotencyKey: `test-${templateName}-${Date.now()}`,
          templateData: { name: "Admin Test" },
        },
      });
      if (error) throw error;
    },
    onSuccess: () => toast({ title: "Test email queued!", description: "Check your inbox shortly." }),
    onError: (e) => toast({ title: "Error sending test", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Email Templates</h2>
          <p className="font-body text-sm text-muted-foreground">
            Customize the content and branding of your app emails.
          </p>
        </div>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          <Save className="mr-1 h-4 w-4" /> Save All Templates
        </Button>
      </div>

      {/* Global branding */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Mail className="h-4 w-4 text-gold" /> Global Email Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={getOverride("_global").logo_url || ""}
                onChange={(e) => updateField("_global", "logo_url", e.target.value)}
                placeholder="https://your-domain.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">Used at the top of all emails. Current default: Afrivogue logo in storage.</p>
            </div>
            <div className="space-y-2">
              <Label>Primary Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={getOverride("_global").primary_color || "#D4A243"}
                  onChange={(e) => updateField("_global", "primary_color", e.target.value)}
                  className="h-10 w-14 p-1"
                />
                <Input
                  value={getOverride("_global").primary_color || "#D4A243"}
                  onChange={(e) => updateField("_global", "primary_color", e.target.value)}
                  placeholder="#D4A243"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Font Family</Label>
            <Input
              value={getOverride("_global").font_family || ""}
              onChange={(e) => updateField("_global", "font_family", e.target.value)}
              placeholder="'Playfair Display', Georgia, serif"
            />
          </div>
        </CardContent>
      </Card>

      {/* Per-template overrides */}
      <Tabs defaultValue={TEMPLATE_CONFIGS[0].key}>
        <TabsList className="flex-wrap">
          {TEMPLATE_CONFIGS.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="gap-1.5">
              <FileText className="h-3 w-3" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TEMPLATE_CONFIGS.map((t) => {
          const ov = getOverride(t.key);
          return (
            <TabsContent key={t.key} value={t.key}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-display text-lg">{t.label}</CardTitle>
                      <p className="font-body text-sm text-muted-foreground mt-1">{t.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewing(previewing === t.key ? null : t.key)}
                      >
                        {previewing === t.key ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
                        {previewing === t.key ? "Hide" : "Preview"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendTestMut.mutate(t.key)}
                        disabled={sendTestMut.isPending}
                      >
                        <Send className="mr-1 h-4 w-4" /> Test
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Subject Line</Label>
                      <Input
                        value={ov.subject || ""}
                        onChange={(e) => updateField(t.key, "subject", e.target.value)}
                        placeholder="Default subject used if empty"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Heading</Label>
                      <Input
                        value={ov.heading || ""}
                        onChange={(e) => updateField(t.key, "heading", e.target.value)}
                        placeholder="Default heading used if empty"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Body Text</Label>
                    <Textarea
                      value={ov.body_text || ""}
                      onChange={(e) => updateField(t.key, "body_text", e.target.value)}
                      placeholder="Default body text used if empty"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Button Label</Label>
                      <Input
                        value={ov.button_label || ""}
                        onChange={(e) => updateField(t.key, "button_label", e.target.value)}
                        placeholder="e.g. Start Exploring"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Footer Text</Label>
                      <Input
                        value={ov.footer_text || ""}
                        onChange={(e) => updateField(t.key, "footer_text", e.target.value)}
                        placeholder="e.g. — The Afrivogue Team"
                      />
                    </div>
                  </div>

                  {previewing === t.key && (
                    <div className="rounded-lg border border-border bg-white p-6 text-black">
                      <div className="mx-auto max-w-lg space-y-4">
                        {(getOverride("_global").logo_url) && (
                          <img src={getOverride("_global").logo_url} alt="Logo" className="h-10 object-contain" />
                        )}
                        <hr className="border-[#E8E0D4]" />
                        <h1 style={{ fontFamily: getOverride("_global").font_family || "'Playfair Display', Georgia, serif", color: "#1A1710", fontSize: "24px", fontWeight: "bold" }}>
                          {ov.heading || `[Default heading for ${t.label}]`}
                        </h1>
                        <p style={{ color: "#6B6158", fontSize: "15px", lineHeight: "1.6" }}>
                          {ov.body_text || `[Default body text for ${t.label}]`}
                        </p>
                        {ov.button_label && (
                          <div>
                            <span style={{
                              backgroundColor: getOverride("_global").primary_color || "#D4A243",
                              color: "#1A1710",
                              padding: "12px 24px",
                              borderRadius: "4px",
                              fontWeight: "bold",
                              fontSize: "14px",
                              display: "inline-block",
                            }}>
                              {ov.button_label}
                            </span>
                          </div>
                        )}
                        <p style={{ color: "#998F85", fontSize: "12px", marginTop: "32px" }}>
                          {ov.footer_text || `[Default footer for ${t.label}]`}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default AdminEmailTemplates;

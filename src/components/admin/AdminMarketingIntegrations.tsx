import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Save, Plus, Trash2, Mail, BarChart3, MessageSquare, Megaphone } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Integration {
  id: string;
  name: string;
  type: "email_marketing" | "analytics" | "chat" | "advertising";
  enabled: boolean;
  api_key: string;
  list_id: string;
  notes: string;
}

interface MarketingSettings {
  integrations: Integration[];
  recommended_stack: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  email_marketing: Mail,
  analytics: BarChart3,
  chat: MessageSquare,
  advertising: Megaphone,
};

const TYPE_LABELS: Record<string, string> = {
  email_marketing: "Email Marketing",
  analytics: "Analytics",
  chat: "Chat / Support",
  advertising: "Advertising",
};

const RECOMMENDED_SERVICES = [
  { name: "Mailchimp", type: "email_marketing" as const, desc: "Popular all-in-one email marketing with automation, templates, and audience segmentation." },
  { name: "ConvertKit", type: "email_marketing" as const, desc: "Creator-focused email platform with powerful tagging, sequences, and landing pages." },
  { name: "Brevo (Sendinblue)", type: "email_marketing" as const, desc: "Affordable email + SMS marketing with CRM and automation workflows." },
  { name: "Klaviyo", type: "email_marketing" as const, desc: "E-commerce focused with deep analytics, segmentation, and product recommendations." },
  { name: "Google Analytics", type: "analytics" as const, desc: "Free web analytics for traffic, conversions, and user behavior insights." },
  { name: "Hotjar", type: "analytics" as const, desc: "Heatmaps, recordings, and surveys to understand user experience." },
  { name: "Tawk.to", type: "chat" as const, desc: "Free live chat widget with agent dashboard and ticketing." },
  { name: "Meta Pixel", type: "advertising" as const, desc: "Facebook/Instagram ad tracking for conversions and retargeting." },
];

const DEFAULT_SETTINGS: MarketingSettings = {
  integrations: [],
  recommended_stack: "",
};

const AdminMarketingIntegrations = () => {
  const qc = useQueryClient();
  const [settings, setSettings] = useState<MarketingSettings>(DEFAULT_SETTINGS);

  const { data: saved, isLoading } = useQuery({
    queryKey: ["admin-marketing-integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "marketing_integrations")
        .maybeSingle();
      if (error) throw error;
      return (data?.value as unknown as MarketingSettings) || DEFAULT_SETTINGS;
    },
  });

  useEffect(() => {
    if (saved) setSettings({ ...DEFAULT_SETTINGS, ...saved });
  }, [saved]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .update({ value: settings as unknown as Json })
        .eq("key", "marketing_integrations")
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        const { error: insertError } = await supabase
          .from("site_settings")
          .insert({ key: "marketing_integrations", value: settings as unknown as Json });
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-marketing-integrations"] });
      toast({ title: "Marketing settings saved" });
    },
    onError: (e) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addIntegration = (name: string, type: Integration["type"]) => {
    setSettings((prev) => ({
      ...prev,
      integrations: [
        ...prev.integrations,
        { id: crypto.randomUUID(), name, type, enabled: true, api_key: "", list_id: "", notes: "" },
      ],
    }));
  };

  const removeIntegration = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      integrations: prev.integrations.filter((i) => i.id !== id),
    }));
  };

  const updateIntegration = (id: string, updates: Partial<Integration>) => {
    setSettings((prev) => ({
      ...prev,
      integrations: prev.integrations.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }));
  };

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      {/* Recommended Services */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" /> Recommended Marketing Stack
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-body text-sm text-muted-foreground">
            These services handle bulk newsletters, drip funnels, ad tracking, and analytics.
            Add them here and use the <strong>Code Injection</strong> tab to paste their tracking scripts.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {RECOMMENDED_SERVICES.map((svc) => {
              const Icon = TYPE_ICONS[svc.type];
              const alreadyAdded = settings.integrations.some(
                (i) => i.name.toLowerCase() === svc.name.toLowerCase()
              );
              return (
                <div
                  key={svc.name}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm font-medium text-foreground">{svc.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {TYPE_LABELS[svc.type]}
                      </Badge>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">{svc.desc}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={alreadyAdded}
                    onClick={() => addIntegration(svc.name, svc.type)}
                    className="shrink-0"
                  >
                    {alreadyAdded ? "Added" : <><Plus className="h-3 w-3 mr-1" /> Add</>}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" /> Your Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.integrations.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">
              No integrations added yet. Pick from the recommended stack above or add a custom one below.
            </p>
          ) : (
            settings.integrations.map((integ) => {
              const Icon = TYPE_ICONS[integ.type] || Mail;
              return (
                <div
                  key={integ.id}
                  className="rounded-lg border border-border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-display text-sm font-bold text-foreground">
                        {integ.name}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {TYPE_LABELS[integ.type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={integ.enabled}
                        onCheckedChange={(v) => updateIntegration(integ.id, { enabled: v })}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIntegration(integ.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">API Key / ID</Label>
                      <Input
                        type="password"
                        placeholder="Paste API key here…"
                        value={integ.api_key}
                        onChange={(e) => updateIntegration(integ.id, { api_key: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">List / Audience ID</Label>
                      <Input
                        placeholder="Optional"
                        value={integ.list_id}
                        onChange={(e) => updateIntegration(integ.id, { list_id: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Notes</Label>
                    <Input
                      placeholder="e.g., Connected to 'Premium Members' audience"
                      value={integ.notes}
                      onChange={(e) => updateIntegration(integ.id, { notes: e.target.value })}
                    />
                  </div>
                </div>
              );
            })
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => addIntegration("Custom Service", "email_marketing")}
          >
            <Plus className="h-3 w-3 mr-1" /> Add Custom Integration
          </Button>
        </CardContent>
      </Card>

      <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
        <Save className="mr-1 h-4 w-4" /> Save Marketing Settings
      </Button>
    </div>
  );
};

export default AdminMarketingIntegrations;

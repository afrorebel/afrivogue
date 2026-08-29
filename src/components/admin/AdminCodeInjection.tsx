import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Save, Code, AlertTriangle } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface CodeInjectionSettings {
  head_code: string;
  body_start_code: string;
  body_end_code: string;
}

const DEFAULT_SETTINGS: CodeInjectionSettings = {
  head_code: "",
  body_start_code: "",
  body_end_code: "",
};

const AdminCodeInjection = () => {
  const qc = useQueryClient();
  const [settings, setSettings] = useState<CodeInjectionSettings>(DEFAULT_SETTINGS);

  const { data: saved, isLoading } = useQuery({
    queryKey: ["admin-code-injection"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "code_injection")
        .maybeSingle();
      if (error) throw error;
      return (data?.value as unknown as CodeInjectionSettings) || DEFAULT_SETTINGS;
    },
  });

  useEffect(() => {
    if (saved) setSettings(saved);
  }, [saved]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .update({ value: settings as unknown as Json })
        .eq("key", "code_injection")
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        const { error: insertError } = await supabase
          .from("site_settings")
          .insert({ key: "code_injection", value: settings as unknown as Json });
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-code-injection"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Code injection settings saved" });
    },
    onError: (e) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <div className="font-body text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Use with caution</p>
          <p>
            Code added here will be injected into every page. Use this for verification tags
            (Google Search Console, Meta Pixel, etc.), analytics scripts, or chat widgets.
            Invalid code may break your site.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" /> Head Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-body text-xs text-muted-foreground">
            Inserted inside <code className="bg-muted px-1 rounded">&lt;head&gt;</code>.
            Use for meta verification tags, analytics, fonts, or stylesheets.
          </p>
          <Label>HTML / Script</Label>
          <Textarea
            rows={6}
            placeholder={'<meta name="google-site-verification" content="..." />\n<script async src="https://..."></script>'}
            value={settings.head_code}
            onChange={(e) => setSettings({ ...settings, head_code: e.target.value })}
            className="font-mono text-xs"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" /> Body Start Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-body text-xs text-muted-foreground">
            Inserted right after the opening <code className="bg-muted px-1 rounded">&lt;body&gt;</code>.
            Use for noscript tags, GTM containers, or early-loading widgets.
          </p>
          <Label>HTML / Script</Label>
          <Textarea
            rows={4}
            placeholder={'<!-- Google Tag Manager (noscript) -->\n<noscript>...</noscript>'}
            value={settings.body_start_code}
            onChange={(e) => setSettings({ ...settings, body_start_code: e.target.value })}
            className="font-mono text-xs"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" /> Body End Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-body text-xs text-muted-foreground">
            Inserted before the closing <code className="bg-muted px-1 rounded">&lt;/body&gt;</code>.
            Use for chat widgets, tracking pixels, or deferred scripts.
          </p>
          <Label>HTML / Script</Label>
          <Textarea
            rows={4}
            placeholder={'<script src="https://widget.example.com/chat.js"></script>'}
            value={settings.body_end_code}
            onChange={(e) => setSettings({ ...settings, body_end_code: e.target.value })}
            className="font-mono text-xs"
          />
        </CardContent>
      </Card>

      <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
        <Save className="mr-1 h-4 w-4" /> Save Code Injection Settings
      </Button>
    </div>
  );
};

export default AdminCodeInjection;

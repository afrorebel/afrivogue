import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Save, Plus, Trash2, FileText } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Stat { label: string; value: string; }
interface Package { name: string; deliverables: string; investment: string; }
interface MediaKitData {
  about: string;
  audience_description: string;
  primary_markets: string;
  stats: Stat[];
  packages: Package[];
  coverage_areas: string;
  inspiration_brands: string;
  cta_headline: string;
  cta_email: string;
}

const DEFAULTS: MediaKitData = {
  about: "",
  audience_description: "",
  primary_markets: "",
  stats: [{ label: "", value: "" }],
  packages: [{ name: "", deliverables: "", investment: "" }],
  coverage_areas: "",
  inspiration_brands: "",
  cta_headline: "Let's Build Something Iconic",
  cta_email: "contact@afrivogue.com",
};

const AdminMediaKit = () => {
  const qc = useQueryClient();
  const [kit, setKit] = useState<MediaKitData>(DEFAULTS);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-media-kit"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("setting_key", "media_kit").maybeSingle();
      return data?.value ? (data.value as unknown as MediaKitData) : null;
    },
  });

  useEffect(() => {
    if (data) setKit({ ...DEFAULTS, ...data });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase.from("site_settings").update({ value: kit as unknown as Json }).eq("setting_key", "media_kit").select();
      if (!existing || existing.length === 0) {
        await supabase.from("site_settings").insert({ setting_key: "media_kit", value: kit as unknown as Json });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-media-kit"] });
      qc.invalidateQueries({ queryKey: ["media-kit"] });
      toast({ title: "Media kit saved" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const setStat = (i: number, key: keyof Stat, val: string) => {
    const s = [...kit.stats]; s[i] = { ...s[i], [key]: val }; setKit({ ...kit, stats: s });
  };
  const setPkg = (i: number, key: keyof Package, val: string) => {
    const p = [...kit.packages]; p[i] = { ...p[i], [key]: val }; setKit({ ...kit, packages: p });
  };

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      {/* About & Audience */}
      <Card>
        <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> About & Audience</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>About Text</Label>
            <Textarea rows={4} value={kit.about} onChange={(e) => setKit({ ...kit, about: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Audience Description</Label>
            <Textarea rows={2} value={kit.audience_description} onChange={(e) => setKit({ ...kit, audience_description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Primary Markets</Label>
            <Input value={kit.primary_markets} onChange={(e) => setKit({ ...kit, primary_markets: e.target.value })} placeholder="Nigeria · UK · USA" />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Reach & Stats</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {kit.stats.map((s, i) => (
            <div key={i} className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <Label>Value</Label>
                <Input value={s.value} onChange={(e) => setStat(i, "value", e.target.value)} placeholder="5K+" />
              </div>
              <div className="flex-1 space-y-1">
                <Label>Label</Label>
                <Input value={s.label} onChange={(e) => setStat(i, "label", e.target.value)} placeholder="Instagram followers" />
              </div>
              <Button variant="ghost" size="icon" onClick={() => setKit({ ...kit, stats: kit.stats.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setKit({ ...kit, stats: [...kit.stats, { label: "", value: "" }] })}><Plus className="mr-1 h-4 w-4" /> Add Stat</Button>
        </CardContent>
      </Card>

      {/* Packages */}
      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Partnership Packages</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {kit.packages.map((p, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1"><Label>Name</Label><Input value={p.name} onChange={(e) => setPkg(i, "name", e.target.value)} /></div>
                <div className="flex-1 space-y-1"><Label>Investment</Label><Input value={p.investment} onChange={(e) => setPkg(i, "investment", e.target.value)} /></div>
                <Button variant="ghost" size="icon" onClick={() => setKit({ ...kit, packages: kit.packages.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-1"><Label>Deliverables</Label><Textarea rows={2} value={p.deliverables} onChange={(e) => setPkg(i, "deliverables", e.target.value)} /></div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setKit({ ...kit, packages: [...kit.packages, { name: "", deliverables: "", investment: "" }] })}><Plus className="mr-1 h-4 w-4" /> Add Package</Button>
        </CardContent>
      </Card>

      {/* Coverage & CTA */}
      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Coverage & CTA</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>What We Cover</Label><Input value={kit.coverage_areas} onChange={(e) => setKit({ ...kit, coverage_areas: e.target.value })} /></div>
          <div className="space-y-2"><Label>Inspiration Brands</Label><Input value={kit.inspiration_brands} onChange={(e) => setKit({ ...kit, inspiration_brands: e.target.value })} /></div>
          <div className="space-y-2"><Label>CTA Headline</Label><Input value={kit.cta_headline} onChange={(e) => setKit({ ...kit, cta_headline: e.target.value })} /></div>
          <div className="space-y-2"><Label>Contact Email</Label><Input value={kit.cta_email} onChange={(e) => setKit({ ...kit, cta_email: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
        <Save className="h-4 w-4" /> Save Media Kit
      </Button>
    </div>
  );
};

export default AdminMediaKit;

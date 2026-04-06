import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Save, Lock, Image, Crown, DollarSign } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface FooterSettings {
  tagline: string;
  subtitle: string;
}

interface NavLink {
  label: string;
  href: string;
}

interface MembershipSettings {
  pricing_enabled: boolean;
  monthly_price: string;
  yearly_price: string;
  monthly_label: string;
  yearly_label: string;
}

const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Editorials", href: "/editorials" },
  { label: "Moodboard", href: "/moodboard" },
  { label: "Shop", href: "/shop" },
  { label: "Forecast", href: "/forecast" },
  { label: "Voices", href: "/contributors" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const CATEGORIES = ["Fashion", "Beauty", "Luxury", "Art & Design", "Culture", "Business"];

const DEFAULT_MEMBERSHIP: MembershipSettings = {
  pricing_enabled: false,
  monthly_price: "1",
  yearly_price: "10",
  monthly_label: "Monthly",
  yearly_label: "Annual",
};

const AdminSiteSettings = () => {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      const map: Record<string, Json> = {};
      data.forEach((row) => { map[row.setting_key] = row.value; });
      return map;
    },
  });

  const { data: trends = [] } = useQuery({
    queryKey: ["admin-all-trends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trends")
        .select("id, headline, category, content_tier, featured_image_url")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const [footer, setFooter] = useState<FooterSettings>({ tagline: "", subtitle: "" });
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);
  const [paywalledCategories, setPaywalledCategories] = useState<string[]>([]);
  const [heroTrendId, setHeroTrendId] = useState<string>("");
  const [membership, setMembership] = useState<MembershipSettings>(DEFAULT_MEMBERSHIP);

  useEffect(() => {
    if (settings) {
      if (settings.footer) setFooter(settings.footer as unknown as FooterSettings);
      if (settings.nav_links) setNavLinks(settings.nav_links as unknown as NavLink[]);
      else setNavLinks(DEFAULT_NAV_LINKS);
      if (settings.paywalled_categories) setPaywalledCategories(settings.paywalled_categories as unknown as string[]);
      if (settings.hero_trend_id) setHeroTrendId(settings.hero_trend_id as unknown as string);
      if (settings.membership) setMembership({ ...DEFAULT_MEMBERSHIP, ...(settings.membership as unknown as MembershipSettings) });
    }
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Json }) => {
      const { data, error } = await supabase.from("site_settings").update({ value }).eq("setting_key", key).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        const { error: insertError } = await supabase.from("site_settings").insert({ setting_key: key, value });
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-site-settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      qc.invalidateQueries({ queryKey: ["hero-trend-id"] });
      qc.invalidateQueries({ queryKey: ["membership-settings"] });
      toast({ title: "Settings saved" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleCategory = (cat: string) => {
    setPaywalledCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const selectedHeroTrend = trends.find((t) => t.id === heroTrendId);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      {/* Hero Content Picker */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Image className="h-4 w-4 text-gold" /> Hero Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-body text-sm text-muted-foreground">
            Select which published article/editorial appears in the homepage hero. If none is selected, the most recent article is used.
          </p>
          <div className="space-y-2">
            <Label>Featured Story</Label>
            <Select value={heroTrendId || "auto"} onValueChange={(v) => setHeroTrendId(v === "auto" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Auto (most recent)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto — Most Recent</SelectItem>
                {trends.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.headline} ({t.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedHeroTrend && (
            <div className="rounded-lg border border-border p-3 flex items-center gap-3">
              {selectedHeroTrend.featured_image_url && (
                <img src={selectedHeroTrend.featured_image_url} alt="" className="h-16 w-24 rounded object-cover" />
              )}
              <div>
                <p className="font-display text-sm font-bold text-foreground">{selectedHeroTrend.headline}</p>
                <p className="font-body text-xs text-muted-foreground">{selectedHeroTrend.category} · {selectedHeroTrend.content_tier}</p>
              </div>
            </div>
          )}
          <Button size="sm" onClick={() => saveMut.mutate({ key: "hero_trend_id", value: (heroTrendId || "") as unknown as Json })} disabled={saveMut.isPending}>
            <Save className="mr-1 h-4 w-4" /> Save Hero
          </Button>
        </CardContent>
      </Card>

      {/* Membership Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Crown className="h-4 w-4 text-gold" /> Membership Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="font-body text-sm font-medium text-foreground">Enable Paid Pricing</p>
              <p className="font-body text-xs text-muted-foreground">
                When off, membership is free (email signup only). When on, Stripe checkout is used.
              </p>
            </div>
            <Switch
              checked={membership.pricing_enabled}
              onCheckedChange={(v) => setMembership({ ...membership, pricing_enabled: v })}
            />
          </div>
          {membership.pricing_enabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Monthly Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={membership.monthly_price}
                  onChange={(e) => setMembership({ ...membership, monthly_price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Yearly Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={membership.yearly_price}
                  onChange={(e) => setMembership({ ...membership, yearly_price: e.target.value })}
                />
              </div>
            </div>
          )}
          <Button size="sm" onClick={() => saveMut.mutate({ key: "membership", value: membership as unknown as Json })} disabled={saveMut.isPending}>
            <Save className="mr-1 h-4 w-4" /> Save Membership Settings
          </Button>
        </CardContent>
      </Card>

      {/* Category Paywall Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Lock className="h-4 w-4 text-gold" /> Category Paywall Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-body text-sm text-muted-foreground">
            Toggle categories to require membership. All articles in a paywalled category will be gated for non-subscribers.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="font-body text-sm text-foreground">{cat}</span>
                <Switch
                  checked={paywalledCategories.includes(cat)}
                  onCheckedChange={() => toggleCategory(cat)}
                />
              </div>
            ))}
          </div>
          <Button size="sm" onClick={() => saveMut.mutate({ key: "paywalled_categories", value: paywalledCategories as unknown as Json })} disabled={saveMut.isPending}>
            <Save className="mr-1 h-4 w-4" /> Save Paywall Settings
          </Button>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Footer</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input value={footer.tagline} onChange={(e) => setFooter({ ...footer, tagline: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input value={footer.subtitle} onChange={(e) => setFooter({ ...footer, subtitle: e.target.value })} />
          </div>
          <Button size="sm" onClick={() => saveMut.mutate({ key: "footer", value: footer as unknown as Json })} disabled={saveMut.isPending}>
            <Save className="mr-1 h-4 w-4" /> Save Footer
          </Button>
        </CardContent>
      </Card>

      {/* Nav Links */}
      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Navigation Links</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {navLinks.map((link, i) => (
            <div key={i} className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <Label>Label</Label>
                <Input value={link.label} onChange={(e) => {
                  const updated = [...navLinks];
                  updated[i] = { ...updated[i], label: e.target.value };
                  setNavLinks(updated);
                }} />
              </div>
              <div className="flex-1 space-y-1">
                <Label>URL</Label>
                <Input value={link.href} onChange={(e) => {
                  const updated = [...navLinks];
                  updated[i] = { ...updated[i], href: e.target.value };
                  setNavLinks(updated);
                }} />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setNavLinks(navLinks.filter((_, j) => j !== i))}>✕</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setNavLinks([...navLinks, { label: "", href: "/" }])}>
            + Add Link
          </Button>
          <div>
            <Button size="sm" onClick={() => saveMut.mutate({ key: "nav_links", value: navLinks as unknown as Json })} disabled={saveMut.isPending}>
              <Save className="mr-1 h-4 w-4" /> Save Navigation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSiteSettings;

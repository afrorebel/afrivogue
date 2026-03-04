import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface HeroSettings {
  subtitle: string;
  title: string;
  description: string;
}

interface FooterSettings {
  tagline: string;
  subtitle: string;
}

interface NavLink {
  label: string;
  href: string;
}

const AdminSiteSettings = () => {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      const map: Record<string, Json> = {};
      data.forEach((row) => { map[row.key] = row.value; });
      return map;
    },
  });

  const [hero, setHero] = useState<HeroSettings>({ subtitle: "", title: "", description: "" });
  const [footer, setFooter] = useState<FooterSettings>({ tagline: "", subtitle: "" });
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);

  useEffect(() => {
    if (settings) {
      if (settings.hero) setHero(settings.hero as unknown as HeroSettings);
      if (settings.footer) setFooter(settings.footer as unknown as FooterSettings);
      if (settings.nav_links) setNavLinks(settings.nav_links as unknown as NavLink[]);
    }
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Json }) => {
      const { error } = await supabase.from("site_settings").update({ value }).eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-site-settings"] });
      toast({ title: "Settings saved" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Hero Section</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Subtitle (kicker)</Label>
            <Input value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={hero.description} onChange={(e) => setHero({ ...hero, description: e.target.value })} />
          </div>
          <Button size="sm" onClick={() => saveMut.mutate({ key: "hero", value: hero as unknown as Json })} disabled={saveMut.isPending}>
            <Save className="mr-1 h-4 w-4" /> Save Hero
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

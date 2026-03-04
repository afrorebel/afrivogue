import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Trend = Tables<"trends">;

const CATEGORIES = ["Fashion", "Beauty", "Luxury", "Art & Design", "Culture", "Business"];
const URGENCIES = ["Breaking", "Emerging", "Slow-Burn"];
const GEO_OPTIONS = ["Africa", "Diaspora", "Global"];
const CONTENT_TIERS = ["Daily Brief", "Editorial Feature", "Premium Long-Form", "Cultural Forecast", "Story Mode"];

const emptyTrend: Partial<TablesInsert<"trends">> = {
  headline: "",
  cultural_significance: "",
  geo_relevance: "Africa",
  urgency: "Breaking",
  category: "Fashion",
  content_tier: "Daily Brief",
  image_hint: "",
  published: false,
};

const AdminTrends = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Trend | null>(null);
  const [form, setForm] = useState(emptyTrend);

  const { data: trends = [], isLoading } = useQuery({
    queryKey: ["admin-trends"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trends").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Trend[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: Partial<TablesInsert<"trends">>) => {
      if (editing) {
        const { error } = await supabase.from("trends").update(values).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("trends").insert(values as TablesInsert<"trends">);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-trends"] });
      toast({ title: editing ? "Trend updated" : "Trend created" });
      closeDialog();
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trends").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-trends"] });
      toast({ title: "Trend deleted" });
    },
  });

  const openEdit = (t: Trend) => {
    setEditing(t);
    setForm({
      headline: t.headline,
      cultural_significance: t.cultural_significance,
      geo_relevance: t.geo_relevance,
      urgency: t.urgency,
      category: t.category,
      content_tier: t.content_tier,
      image_hint: t.image_hint || "",
      published: t.published,
    });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyTrend);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate(form);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Trends</h2>
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Trend</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Trend" : "New Trend"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Headline</Label>
                <Input value={form.headline || ""} onChange={(e) => setForm({ ...form, headline: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Cultural Significance</Label>
                <Textarea rows={5} value={form.cultural_significance || ""} onChange={(e) => setForm({ ...form, cultural_significance: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{URGENCIES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Geo Relevance</Label>
                  <Select value={form.geo_relevance} onValueChange={(v) => setForm({ ...form, geo_relevance: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GEO_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Content Tier</Label>
                  <Select value={form.content_tier} onValueChange={(v) => setForm({ ...form, content_tier: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CONTENT_TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Image Hint</Label>
                <Input value={form.image_hint || ""} onChange={(e) => setForm({ ...form, image_hint: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
                <Label>Published</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button type="submit" disabled={upsert.isPending}>{editing ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : trends.length === 0 ? (
        <p className="text-muted-foreground">No trends yet. Create your first one.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Headline</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trends.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="max-w-[300px] truncate font-medium">{t.headline}</TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell>{t.urgency}</TableCell>
                <TableCell>
                  <Badge variant={t.published ? "default" : "secondary"}>
                    {t.published ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AdminTrends;

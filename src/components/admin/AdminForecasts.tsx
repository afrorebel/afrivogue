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

type Forecast = Tables<"forecasts">;

const DOMAINS = ["Fashion", "Beauty", "Luxury", "Art & Design", "Culture", "Digital", "Commerce"];
const HORIZONS = ["6Months", "1-2 Years", "3-5 Years"];
const SIGNALS = ["Definitive", "High Confidence", "Early Signal"];
const REGIONS = ["Africa", "Diaspora", "Global"];

const emptyForecast: Partial<TablesInsert<"forecasts">> = {
  title: "", projection: "", evidence: "", implications: "",
  domain: "Fashion", horizon: "6Months", signal_strength: "Early Signal",
  region: "Africa", published: false,
};

const AdminForecasts = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Forecast | null>(null);
  const [form, setForm] = useState(emptyForecast);

  const { data: forecasts = [], isLoading } = useQuery({
    queryKey: ["admin-forecasts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("forecasts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Forecast[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: Partial<TablesInsert<"forecasts">>) => {
      if (editing) {
        const { error } = await supabase.from("forecasts").update(values).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("forecasts").insert(values as TablesInsert<"forecasts">);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-forecasts"] });
      toast({ title: editing ? "Forecast updated" : "Forecast created" });
      closeDialog();
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("forecasts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-forecasts"] });
      toast({ title: "Forecast deleted" });
    },
  });

  const openEdit = (f: Forecast) => {
    setEditing(f);
    setForm({
      title: f.title, projection: f.projection, evidence: f.evidence, implications: f.implications,
      domain: f.domain, horizon: f.horizon, signal_strength: f.signal_strength,
      region: f.region, published: f.published,
    });
    setOpen(true);
  };

  const closeDialog = () => { setOpen(false); setEditing(null); setForm(emptyForecast); };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); upsert.mutate(form); };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Cultural Forecasts</h2>
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Forecast</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "Edit Forecast" : "New Forecast"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Projection</Label>
                <Textarea rows={3} value={form.projection || ""} onChange={(e) => setForm({ ...form, projection: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Evidence</Label>
                <Textarea rows={3} value={form.evidence || ""} onChange={(e) => setForm({ ...form, evidence: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Implications</Label>
                <Textarea rows={3} value={form.implications || ""} onChange={(e) => setForm({ ...form, implications: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Select value={form.domain} onValueChange={(v) => setForm({ ...form, domain: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Horizon</Label>
                  <Select value={form.horizon} onValueChange={(v) => setForm({ ...form, horizon: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{HORIZONS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Signal Strength</Label>
                  <Select value={form.signal_strength} onValueChange={(v) => setForm({ ...form, signal_strength: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SIGNALS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
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
      ) : forecasts.length === 0 ? (
        <p className="text-muted-foreground">No forecasts yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Signal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forecasts.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="max-w-[300px] truncate font-medium">{f.title}</TableCell>
                <TableCell>{f.domain}</TableCell>
                <TableCell>{f.signal_strength}</TableCell>
                <TableCell>
                  <Badge variant={f.published ? "default" : "secondary"}>
                    {f.published ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default AdminForecasts;

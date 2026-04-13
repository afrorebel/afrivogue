import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Users, RefreshCw } from "lucide-react";

const CRITERIA_TYPES = [
  { value: "has_ordered", label: "Has placed an order" },
  { value: "premium_member", label: "Is premium member" },
  { value: "high_spender", label: "Spent over $X" },
  { value: "cart_abandoner", label: "Abandoned cart" },
  { value: "new_user", label: "Joined in last 30 days" },
  { value: "inactive", label: "No activity in 30+ days" },
  { value: "reviewer", label: "Has left a review" },
  { value: "wishlist_user", label: "Has wishlist items" },
];

const COLORS = ["#D4A853", "#B85C38", "#4A90D9", "#50C878", "#9B59B6", "#E74C3C", "#F39C12", "#1ABC9C"];

const AdminSegmentation = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [criteriaType, setCriteriaType] = useState("");
  const [criteriaValue, setCriteriaValue] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const { data: segments = [] } = useQuery({
    queryKey: ["admin-segments"],
    queryFn: async () => {
      const { data: segs } = await supabase.from("customer_segments").select("*").order("created_at", { ascending: false });
      if (!segs?.length) return [];
      const ids = segs.map((s: any) => s.id);
      const { data: members } = await supabase.from("segment_members").select("segment_id").in("segment_id", ids);
      const counts: Record<string, number> = {};
      (members || []).forEach((m: any) => { counts[m.segment_id] = (counts[m.segment_id] || 0) + 1; });
      return segs.map((s: any) => ({ ...s, memberCount: counts[s.id] || 0 }));
    },
  });

  const saveSegment = async () => {
    if (!name || !criteriaType) { toast({ title: "Name and criteria required", variant: "destructive" }); return; }
    const criteria = { type: criteriaType, value: criteriaValue || null };
    const { error } = await supabase.from("customer_segments").insert({ name, description: desc, criteria, color });
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    qc.invalidateQueries({ queryKey: ["admin-segments"] });
    setOpen(false); setName(""); setDesc(""); setCriteriaType(""); setCriteriaValue("");
    toast({ title: "Segment created!" });
  };

  const deleteSegment = async (id: string) => {
    await supabase.from("customer_segments").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-segments"] });
    toast({ title: "Segment deleted" });
  };

  const populateSegment = async (segment: any) => {
    const criteria = segment.criteria as any;
    let userIds: string[] = [];

    if (criteria.type === "has_ordered") {
      const { data } = await supabase.from("orders").select("user_id");
      userIds = [...new Set((data || []).map((o: any) => o.user_id))] as string[];
    } else if (criteria.type === "premium_member") {
      const { data } = await supabase.from("site_settings").select("value").eq("setting_key", "manual_premium_users").maybeSingle();
      userIds = (data?.value as string[]) || [];
    } else if (criteria.type === "high_spender") {
      const threshold = parseFloat(criteria.value) || 100;
      const { data } = await supabase.from("orders").select("user_id, total").eq("status", "paid");
      const totals: Record<string, number> = {};
      (data || []).forEach((o: any) => { totals[o.user_id] = (totals[o.user_id] || 0) + Number(o.total); });
      userIds = Object.entries(totals).filter(([, t]) => t >= threshold).map(([id]) => id);
    } else if (criteria.type === "cart_abandoner") {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data } = await supabase.from("cart_items").select("user_id").lt("created_at", oneHourAgo);
      userIds = [...new Set((data || []).map((c: any) => c.user_id))] as string[];
    } else if (criteria.type === "new_user") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.from("profiles").select("id").gte("created_at", thirtyDaysAgo);
      userIds = (data || []).map((p: any) => p.id);
    } else if (criteria.type === "inactive") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: active } = await supabase.from("reading_history").select("user_id").gte("read_at", thirtyDaysAgo);
      const activeIds = new Set((active || []).map((r: any) => r.user_id));
      const { data: all } = await supabase.from("profiles").select("id");
      userIds = (all || []).filter((p: any) => !activeIds.has(p.id)).map((p: any) => p.id);
    } else if (criteria.type === "reviewer") {
      const { data } = await supabase.from("product_reviews").select("user_id");
      userIds = [...new Set((data || []).map((r: any) => r.user_id))] as string[];
    } else if (criteria.type === "wishlist_user") {
      const { data } = await supabase.from("wishlists").select("user_id");
      userIds = [...new Set((data || []).map((w: any) => w.user_id))] as string[];
    }

    // Clear existing and insert new
    await supabase.from("segment_members").delete().eq("segment_id", segment.id);
    if (userIds.length > 0) {
      const rows = userIds.map((uid) => ({ segment_id: segment.id, user_id: uid }));
      await supabase.from("segment_members").insert(rows);
    }
    qc.invalidateQueries({ queryKey: ["admin-segments"] });
    toast({ title: `${userIds.length} users added to "${segment.name}"` });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-gold" /> Customer Segments
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Segment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Segment</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Segment Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VIP Customers" /></div>
              <div><Label>Description</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional description" /></div>
              <div>
                <Label>Criteria</Label>
                <Select value={criteriaType} onValueChange={setCriteriaType}>
                  <SelectTrigger><SelectValue placeholder="Select criteria" /></SelectTrigger>
                  <SelectContent>
                    {CRITERIA_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {criteriaType === "high_spender" && (
                <div><Label>Minimum Spend ($)</Label><Input type="number" value={criteriaValue} onChange={(e) => setCriteriaValue(e.target.value)} placeholder="100" /></div>
              )}
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-1">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)}
                      className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={saveSegment} className="w-full">Create Segment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {segments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 font-body text-sm">No segments yet. Create one to start grouping customers.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segment</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.map((s: any) => {
                const criteria = s.criteria as any;
                const label = CRITERIA_TYPES.find((c) => c.value === criteria?.type)?.label || criteria?.type || "—";
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                        <div>
                          <p className="font-body text-xs font-medium">{s.name}</p>
                          {s.description && <p className="font-body text-[10px] text-muted-foreground">{s.description}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{label}</Badge>
                      {criteria?.value && <span className="ml-1 font-body text-[10px] text-muted-foreground">(${criteria.value}+)</span>}
                    </TableCell>
                    <TableCell className="font-body text-xs font-bold text-gold">{s.memberCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => populateSegment(s)} title="Refresh members">
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteSegment(s.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminSegmentation;

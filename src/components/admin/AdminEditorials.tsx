import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Check, X, Eye, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageUrlUpload from "./ImageUrlUpload";
import { useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import ImageUpload from "@/components/shop/ImageUpload";

const URGENCIES = ["Breaking", "Emerging", "Slow-Burn"];
const GEO_OPTIONS = ["Africa", "Diaspora", "Global"];
const CONTENT_TIERS = ["Editorial Feature", "Premium Long-Form"];

const AdminEditorials = () => {
  const qc = useQueryClient();
  const [preview, setPreview] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "published">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newCat, setNewCat] = useState("");

  // New editorial form state
  const [form, setForm] = useState({
    headline: "",
    content: "",
    category: "Fashion",
    content_tier: "Editorial Feature",
    urgency: "Emerging",
    geo_relevance: "Global",
    meta_description: "",
    featured_image_url: "",
    images: [] as string[],
    published: false,
    members_only: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("name").is("parent_id", null).order("name");
      return data?.map((c: any) => c.name) || [];
    },
  });

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["admin-submissions", filter],
    queryFn: async () => {
      let q = supabase.from("article_submissions").select("*, profiles(display_name, avatar_url)").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data } = await q;
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updates: any = { status };
      if (notes) updates.admin_notes = notes;
      if (status === "approved") updates.points_awarded = 50;
      const { error } = await supabase.from("article_submissions").update(updates).eq("id", id);
      if (error) throw error;

      // Auto-upgrade user to publisher on first approval
      if (status === "approved") {
        const sub = submissions.find((s: any) => s.id === id);
        if (sub) {
          // Check if user already has publisher or higher role
          const { data: existingRoles } = await supabase.from("user_roles").select("role").eq("user_id", sub.user_id);
          const roles = existingRoles?.map((r: any) => r.role) || [];
          if (!roles.includes("publisher") && !roles.includes("editor") && !roles.includes("admin")) {
            // Remove contributor role if exists, add publisher
            if (roles.includes("contributor")) {
              await supabase.from("user_roles").delete().eq("user_id", sub.user_id).eq("role", "contributor");
            }
            await supabase.from("user_roles").insert({ user_id: sub.user_id, role: "publisher" });
          }
        }
      }

      // If publishing, create a trend from the submission
      if (status === "published") {
        const sub = submissions.find((s: any) => s.id === id);
        if (sub) {
          const { error: tErr } = await supabase.from("trends").insert({
            headline: sub.title,
            cultural_significance: sub.meta_description || sub.content.substring(0, 200),
            category: sub.category,
            content_tier: "Editorial Feature",
            urgency: "Emerging",
            geo_relevance: "Global",
            editorial_content: { body: sub.content },
            images: sub.images || [],
            published: true,
            needs_review: false,
          });
          if (tErr) throw tErr;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-submissions"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Updated" });
    },
  });

  const deleteSub = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("article_submissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-submissions"] });
      toast({ title: "Deleted" });
    },
  });

  const createEditorial = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("trends").insert({
        headline: form.headline,
        cultural_significance: form.meta_description || form.content.replace(/<[^>]*>/g, "").substring(0, 200),
        category: form.category,
        content_tier: form.content_tier,
        urgency: form.urgency,
        geo_relevance: form.geo_relevance,
        editorial_content: { body: form.content },
        featured_image_url: form.featured_image_url || null,
        images: form.images,
        published: form.published,
        members_only: form.members_only,
        needs_review: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-trends"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Editorial created" });
      setCreateOpen(false);
      setForm({
        headline: "", content: "", category: "Fashion", content_tier: "Editorial Feature",
        urgency: "Emerging", geo_relevance: "Global", meta_description: "",
        featured_image_url: "", images: [], published: false, members_only: false,
      });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addCategory = async () => {
    if (!newCat.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: newCat.trim() });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Category added" });
      qc.invalidateQueries({ queryKey: ["categories-list"] });
      setForm({ ...form, category: newCat.trim() });
      setNewCat("");
    }
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    approved: "bg-green-500/20 text-green-400",
    rejected: "bg-destructive/20 text-destructive",
    published: "bg-gold/20 text-gold",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-lg font-bold text-foreground">Editorials</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {(["all", "pending", "approved", "published", "rejected"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize text-xs">
                {f}
              </Button>
            ))}
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> New Editorial
          </Button>
        </div>
      </div>

      {/* Submissions list */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : submissions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No submissions found.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s: any) => (
            <div key={s.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={statusColor[s.status] || ""}>{s.status}</Badge>
                    <Badge variant="outline" className="text-[10px]">{s.category}</Badge>
                  </div>
                  <h3 className="font-display text-sm font-bold text-foreground truncate">{s.title}</h3>
                  {s.meta_description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.meta_description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    By {(s as any).profiles?.display_name || "Unknown"} · {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setPreview(s)} title="Preview">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {s.status === "pending" && (
                    <>
                      <Button size="sm" variant="ghost" className="text-green-400" onClick={() => updateStatus.mutate({ id: s.id, status: "approved" })} title="Approve">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus.mutate({ id: s.id, status: "rejected" })} title="Reject">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {s.status === "approved" && (
                    <Button size="sm" variant="outline" className="text-gold text-xs" onClick={() => updateStatus.mutate({ id: s.id, status: "published" })}>
                      Publish
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteSub.mutate(s.id)} title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{preview?.title}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="outline">{preview.category}</Badge>
                <Badge className={statusColor[preview.status] || ""}>{preview.status}</Badge>
              </div>
              {preview.meta_description && (
                <p className="text-sm text-muted-foreground italic">{preview.meta_description}</p>
              )}
              {preview.images && (preview.images as string[]).length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {(preview.images as string[]).map((img: string, i: number) => (
                    <img key={i} src={img} alt="" className="h-24 w-24 rounded object-cover border border-border" />
                  ))}
                </div>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none font-body" dangerouslySetInnerHTML={{ __html: preview.content }} />
              {preview.admin_notes && (
                <div className="rounded border border-border p-3 bg-muted/30">
                  <p className="text-xs font-bold text-muted-foreground">Admin Notes</p>
                  <p className="text-sm text-foreground mt-1">{preview.admin_notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {preview.status === "pending" && (
                  <>
                    <Button className="bg-green-600" onClick={() => { updateStatus.mutate({ id: preview.id, status: "approved" }); setPreview(null); }}>Approve</Button>
                    <Button variant="destructive" onClick={() => { updateStatus.mutate({ id: preview.id, status: "rejected" }); setPreview(null); }}>Reject</Button>
                  </>
                )}
                {preview.status === "approved" && (
                  <Button className="bg-gold text-primary-foreground" onClick={() => { updateStatus.mutate({ id: preview.id, status: "published" }); setPreview(null); }}>Publish to Feed</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Editorial Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Create New Editorial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Editorial headline…" />
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea rows={2} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} placeholder="Brief summary for SEO…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category…" className="text-xs h-8" />
                  <Button size="sm" variant="outline" onClick={addCategory} className="h-8 text-xs shrink-0">Add</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Content Tier</Label>
                <Select value={form.content_tier} onValueChange={(v) => setForm({ ...form, content_tier: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTENT_TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
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
            </div>
            <div className="space-y-2">
              <Label>Featured Image URL</Label>
              <Input value={form.featured_image_url} onChange={(e) => setForm({ ...form, featured_image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Additional Images</Label>
              <ImageUpload bucket="trend-images" folder="editorials" value={form.images} onChange={(imgs) => setForm({ ...form, images: imgs })} />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <RichTextEditor content={form.content} onChange={(html) => setForm({ ...form, content: html })} placeholder="Write your editorial…" />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
                <Label>Publish immediately</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.members_only} onCheckedChange={(v) => setForm({ ...form, members_only: v })} />
                <Label>Members Only</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => createEditorial.mutate()} disabled={!form.headline || !form.content || createEditorial.isPending}>
                {createEditorial.isPending ? "Creating…" : "Create Editorial"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEditorials;

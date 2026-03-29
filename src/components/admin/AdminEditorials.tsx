import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Check, X, Eye, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

const AdminEditorials = () => {
  const qc = useQueryClient();
  const [preview, setPreview] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "published">("all");

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

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    approved: "bg-green-500/20 text-green-400",
    rejected: "bg-destructive/20 text-destructive",
    published: "bg-gold/20 text-gold",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Editorial Submissions</h2>
        <div className="flex gap-1">
          {(["all", "pending", "approved", "published", "rejected"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize text-xs">
              {f}
            </Button>
          ))}
        </div>
      </div>

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
    </div>
  );
};

export default AdminEditorials;

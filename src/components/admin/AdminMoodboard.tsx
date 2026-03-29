import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Check, Trash2, X as XIcon, ExternalLink, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminMoodboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isIngesting, setIsIngesting] = useState(false);
  const [filter, setFilter] = useState<"all" | "needs_review" | "user_submitted" | "rejected">("all");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-moodboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moodboard_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Fetch submitter profiles
  const submitterIds = [...new Set(items.filter((i: any) => i.submitted_by).map((i: any) => i.submitted_by))];
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-moodboard-profiles", submitterIds],
    enabled: submitterIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", submitterIds);
      return data || [];
    },
  });
  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("moodboard_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-moodboard"] });
      toast({ title: "Deleted" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("moodboard_items")
        .update({ needs_review: false, approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-moodboard"] });
      toast({ title: approved ? "Approved" : "Rejected" });
    },
  });

  const triggerIngestion = async () => {
    setIsIngesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ingest-moodboard");
      if (error) throw error;
      toast({ title: "Pipeline Complete", description: `Ingested ${data?.ingested || 0} images` });
      queryClient.invalidateQueries({ queryKey: ["admin-moodboard"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsIngesting(false);
    }
  };

  const userSubmitted = items.filter((i: any) => i.submitted_by);
  const needsReview = items.filter((i: any) => i.needs_review);
  const rejected = items.filter((i: any) => !i.approved && !i.needs_review);

  const filtered = filter === "needs_review" ? needsReview
    : filter === "user_submitted" ? userSubmitted
    : filter === "rejected" ? rejected
    : items;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            All ({items.length})
          </Button>
          <Button variant={filter === "needs_review" ? "default" : "outline"} size="sm" onClick={() => setFilter("needs_review")}>
            Needs Review ({needsReview.length})
          </Button>
          <Button variant={filter === "user_submitted" ? "default" : "outline"} size="sm" onClick={() => setFilter("user_submitted")}>
            User Submitted ({userSubmitted.length})
          </Button>
          <Button variant={filter === "rejected" ? "default" : "outline"} size="sm" onClick={() => setFilter("rejected")}>
            Rejected ({rejected.length})
          </Button>
        </div>
        <Button onClick={triggerIngestion} disabled={isIngesting} size="sm" className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${isIngesting ? "animate-spin" : ""}`} />
          {isIngesting ? "Running…" : "Run Moodboard Pipeline"}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((item: any) => {
            const submitter = item.submitted_by ? profileMap[item.submitted_by] : null;
            return (
              <div key={item.id} className="relative group rounded-lg overflow-hidden border border-border">
                <img src={item.image_url} alt={item.caption} className="w-full aspect-square object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex gap-1 justify-end">
                    {item.needs_review && (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400 hover:text-green-300"
                          onClick={() => reviewMutation.mutate({ id: item.id, approved: true })} title="Approve">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-orange-400 hover:text-orange-300"
                          onClick={() => reviewMutation.mutate({ id: item.id, approved: false })} title="Reject">
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300"
                      onClick={() => deleteMutation.mutate(item.id)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <p className="text-white text-[10px] line-clamp-2">{item.caption}</p>
                    {submitter && (
                      <div className="flex items-center gap-1 mt-1">
                        <User className="h-3 w-3 text-blue-300" />
                        <span className="text-[9px] text-blue-300">{submitter.display_name || "User"}</span>
                      </div>
                    )}
                    {item.source_url && (
                      <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                        className="text-[9px] text-gold hover:underline flex items-center gap-0.5 mt-0.5"
                        onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="h-2.5 w-2.5" /> Source
                      </a>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-[9px] text-gold border-gold/30">{item.category}</Badge>
                      {item.needs_review && <Badge variant="outline" className="text-[9px] text-yellow-400 border-yellow-400/30">Review</Badge>}
                      {!item.approved && !item.needs_review && <Badge variant="outline" className="text-[9px] text-red-400 border-red-400/30">Rejected</Badge>}
                      {item.submitted_by && <Badge variant="outline" className="text-[9px] text-blue-400 border-blue-400/30">User</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminMoodboard;

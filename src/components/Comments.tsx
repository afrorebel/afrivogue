import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Trash2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

interface CommentsProps {
  trendId: string;
}

const Comments = ({ trendId }: CommentsProps) => {
  const { user, subscribed, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", trendId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles:user_id(display_name, avatar_url)")
        .eq("trend_id", trendId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login required");
      const trimmed = content.trim();
      if (!trimmed || trimmed.length > 2000) throw new Error("Comment must be 1-2000 characters");
      const { error } = await supabase.from("comments").insert({
        trend_id: trendId,
        user_id: user.id,
        content: trimmed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["comments", trendId] });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", trendId] }),
  });

  const canComment = user && (subscribed || isAdmin);

  return (
    <div className="mt-12 border-t border-border pt-10">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground mb-6">
        <MessageSquare className="h-5 w-5 text-gold" />
        Discussion
        {comments.length > 0 && (
          <span className="font-body text-xs text-muted-foreground">({comments.length})</span>
        )}
      </h3>

      {/* Comment form — members only */}
      {canComment ? (
        <div className="mb-8 space-y-3">
          <Textarea
            placeholder="Share your thoughts…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <span className="font-body text-[10px] text-muted-foreground">{content.length}/2000</span>
            <Button
              size="sm"
              disabled={!content.trim() || addComment.isPending}
              onClick={() => addComment.mutate()}
              className="bg-gold text-primary-foreground hover:bg-gold/90 gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> {addComment.isPending ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>
      ) : user ? (
        <div className="mb-8 rounded-lg border border-border bg-card p-4 text-center">
          <p className="font-body text-sm text-muted-foreground">
            Join the <Link to="/membership" className="text-gold hover:underline">Afrivogue Collective</Link> to participate in discussions.
          </p>
        </div>
      ) : (
        <div className="mb-8 rounded-lg border border-border bg-card p-4 text-center">
          <p className="font-body text-sm text-muted-foreground">
            <Link to="/auth" className="text-gold hover:underline">Sign in</Link> to join the discussion.
          </p>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <p className="font-body text-sm text-muted-foreground">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground">No comments yet. Be the first to share your perspective.</p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {comments.map((comment: any) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-lg border border-border bg-card/50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 mb-2">
                    {comment.profiles?.avatar_url ? (
                      <img src={comment.profiles.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gold/20 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-gold">
                          {(comment.profiles?.display_name || "U")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="font-body text-xs font-medium text-foreground">
                      {comment.profiles?.display_name || "Member"}
                    </span>
                    <span className="font-body text-[10px] text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  {(user?.id === comment.user_id || isAdmin) && (
                    <button
                      onClick={() => deleteComment.mutate(comment.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="font-body text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {comment.content}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Comments;

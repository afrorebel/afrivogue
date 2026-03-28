import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  productId: string;
}

const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`h-4 w-4 ${s <= rating ? "fill-gold text-gold" : "text-muted-foreground"} ${interactive ? "cursor-pointer" : ""}`}
        onClick={() => interactive && onRate?.(s)}
      />
    ))}
  </div>
);

const ProductReviews = ({ productId }: Props) => {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles for reviewers
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds);
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));

      return (data || []).map((r: any) => ({
        ...r,
        profile: profileMap[r.user_id] || { display_name: "Anonymous", avatar_url: null },
      }));
    },
  });

  const addReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in first");
      if (!content.trim()) throw new Error("Review content required");
      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        user_id: user.id,
        rating,
        title: title.trim() || null,
        content: content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-reviews", productId] });
      toast({ title: "Review posted!" });
      setRating(5);
      setTitle("");
      setContent("");
      setShowForm(false);
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteReview = async (id: string) => {
    await supabase.from("product_reviews").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["product-reviews", productId] });
    toast({ title: "Review deleted" });
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Reviews</h3>
          {reviews.length > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <StarRating rating={Math.round(avgRating)} />
              <span className="font-body text-sm text-muted-foreground">
                {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}
        </div>
        {user && !showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>Write a Review</Button>
        )}
      </div>

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 rounded-lg border border-border p-4"
          >
            <div className="space-y-1">
              <p className="font-body text-xs font-medium">Your Rating</p>
              <StarRating rating={rating} onRate={setRating} interactive />
            </div>
            <Input
              placeholder="Review title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-body text-sm"
            />
            <Textarea
              placeholder="Share your experience…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="font-body text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addReview.mutate()} disabled={addReview.isPending}>
                Post Review
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews list */}
      {isLoading ? (
        <p className="font-body text-sm text-muted-foreground">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground">No reviews yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r: any) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-border p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={r.profile.avatar_url} />
                    <AvatarFallback className="font-body text-xs">
                      {(r.profile.display_name || "A").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-body text-xs font-medium">{r.profile.display_name || "Anonymous"}</p>
                    <p className="font-body text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={r.rating} />
                  {(user?.id === r.user_id || isAdmin) && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteReview(r.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
              {r.title && <p className="mt-2 font-body text-sm font-medium text-foreground">{r.title}</p>}
              <p className="mt-1 font-body text-sm text-muted-foreground">{r.content}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;

import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Heart, PenLine, Calendar, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

const AuthorProfile = () => {
  const { authorId } = useParams<{ authorId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["author-profile", authorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authorId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!authorId,
  });

  const { data: articles } = useQuery({
    queryKey: ["author-articles", authorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("article_submissions")
        .select("id, title, category, created_at")
        .eq("user_id", authorId!)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!authorId,
  });

  const { data: favoriteCount } = useQuery({
    queryKey: ["author-fav-count", authorId],
    queryFn: async () => {
      const { count } = await supabase
        .from("favorite_authors")
        .select("id", { count: "exact", head: true })
        .eq("author_id", authorId!);
      return count || 0;
    },
    enabled: !!authorId,
  });

  const { data: isFavorited } = useQuery({
    queryKey: ["author-is-fav", authorId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("favorite_authors")
        .select("id")
        .eq("user_id", user.id)
        .eq("author_id", authorId!)
        .maybeSingle();
      return !!data;
    },
    enabled: !!authorId && !!user,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to favorite authors");
      if (isFavorited) {
        await supabase
          .from("favorite_authors")
          .delete()
          .eq("user_id", user.id)
          .eq("author_id", authorId!);
      } else {
        await supabase
          .from("favorite_authors")
          .insert({ user_id: user.id, author_id: authorId! });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["author-is-fav", authorId] });
      queryClient.invalidateQueries({ queryKey: ["author-fav-count", authorId] });
      toast({
        title: isFavorited ? "Removed from favorites" : "Added to favorites",
        description: isFavorited
          ? "This author has been removed from your favorites."
          : "You'll see this author in your favorites!",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const { data: preferences } = useQuery({
    queryKey: ["author-preferences", authorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("categories")
        .eq("user_id", authorId!)
        .single();
      return (data?.categories as string[]) || [];
    },
    enabled: !!authorId,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 pb-20 pt-28">
        {isLoading ? (
          <div className="space-y-6 text-center">
            <Skeleton className="mx-auto h-28 w-28 rounded-full" />
            <Skeleton className="mx-auto h-8 w-56" />
            <Skeleton className="mx-auto h-4 w-72" />
          </div>
        ) : !profile ? (
          <p className="text-center font-body text-muted-foreground">Author not found.</p>
        ) : (
          <>
            {/* Author Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <Avatar className="mx-auto h-28 w-28 border-2 border-gold">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.display_name || ""} />
                ) : null}
                <AvatarFallback className="bg-gold/10 text-gold">
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>

              <h1 className="mt-5 font-display text-3xl font-bold text-foreground md:text-4xl">
                {profile.display_name || "Afrivogue Writer"}
              </h1>

              {profile.bio && (
                <p className="mx-auto mt-3 max-w-lg font-body text-sm leading-relaxed text-muted-foreground">
                  {profile.bio}
                </p>
              )}

              <div className="mt-4 flex items-center justify-center gap-4 font-body text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1">
                  <PenLine className="h-3 w-3" />
                  {articles?.length || 0} article{(articles?.length || 0) !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-destructive" />
                  {favoriteCount || 0} follower{(favoriteCount || 0) !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Favorite button */}
              {user && user.id !== authorId && (
                <Button
                  onClick={() => toggleFavorite.mutate()}
                  disabled={toggleFavorite.isPending}
                  variant={isFavorited ? "default" : "outline"}
                  className={`mt-5 gap-2 ${isFavorited ? "bg-gold text-foreground hover:bg-gold/90" : "border-gold text-gold hover:bg-gold/10"}`}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
                  {isFavorited ? "Following" : "Follow Author"}
                </Button>
              )}

              {!user && (
                <Link to="/auth">
                  <Button variant="outline" className="mt-5 gap-2 border-gold text-gold hover:bg-gold/10">
                    <Heart className="h-4 w-4" /> Sign in to follow
                  </Button>
                </Link>
              )}

              {/* Interests */}
              {preferences && preferences.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 font-body text-xs uppercase tracking-wider text-muted-foreground">Interests</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {preferences.map((cat) => (
                      <span key={cat} className="rounded-full border border-gold/30 px-3 py-1 font-body text-xs text-gold">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Published Articles */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-12">
              <h2 className="mb-6 font-display text-xl font-bold text-foreground">
                Published Articles
              </h2>

              {!articles || articles.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground">No published articles yet.</p>
              ) : (
                <div className="space-y-4">
                  {articles.map((article, i) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:border-gold/50"
                    >
                      <div>
                        <h3 className="font-body text-sm font-medium text-foreground">{article.title}</h3>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="secondary" className="font-body text-xs">{article.category}</Badge>
                          <span className="font-body text-xs text-muted-foreground">
                            {new Date(article.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AuthorProfile;

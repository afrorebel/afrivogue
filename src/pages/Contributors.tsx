import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, PenLine, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface ContributorData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  article_count: number;
  favorite_count: number;
}

const Contributors = () => {
  const { data: contributors, isLoading } = useQuery({
    queryKey: ["contributors"],
    queryFn: async () => {
      // Get all users who have at least one approved article submission
      const { data: submissions, error } = await supabase
        .from("article_submissions")
        .select("user_id")
        .eq("status", "approved");

      if (error) throw error;
      if (!submissions || submissions.length === 0) return [];

      // Count articles per author
      const authorCounts: Record<string, number> = {};
      submissions.forEach((s) => {
        authorCounts[s.user_id] = (authorCounts[s.user_id] || 0) + 1;
      });

      const authorIds = Object.keys(authorCounts);

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", authorIds);

      // Fetch favorite counts
      const { data: favorites } = await supabase
        .from("favorite_authors")
        .select("author_id");

      const favCounts: Record<string, number> = {};
      favorites?.forEach((f) => {
        favCounts[f.author_id] = (favCounts[f.author_id] || 0) + 1;
      });

      const result: ContributorData[] = (profiles || []).map((p) => ({
        id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        bio: p.bio,
        created_at: p.created_at,
        article_count: authorCounts[p.id] || 0,
        favorite_count: favCounts[p.id] || 0,
      }));

      // Sort by article count descending
      result.sort((a, b) => b.article_count - a.article_count);
      return result;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
            Our <span className="text-gold">Voices</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-body text-sm leading-relaxed text-muted-foreground">
            The cultural commentators, writers, and creators shaping the Afrivogue narrative. Discover their perspectives and follow your favorites.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : !contributors || contributors.length === 0 ? (
          <div className="py-20 text-center">
            <PenLine className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />
            <p className="font-body text-muted-foreground">
              No contributors yet. Be the first —{" "}
              <Link to="/submit" className="text-gold hover:underline">
                submit an article
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {contributors.map((author, i) => (
              <motion.div
                key={author.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/author/${author.id}`}
                  className="group block rounded-xl border border-border bg-card p-6 transition-all hover:border-gold/50 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 border-2 border-gold/30">
                      {author.avatar_url ? (
                        <AvatarImage src={author.avatar_url} alt={author.display_name || ""} />
                      ) : null}
                      <AvatarFallback className="bg-gold/10 text-gold">
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-bold text-foreground group-hover:text-gold transition-colors truncate">
                        {author.display_name || "Afrivogue Writer"}
                      </h3>
                      <p className="font-body text-xs text-muted-foreground">
                        Member since {new Date(author.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {author.bio && (
                    <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground line-clamp-2">
                      {author.bio}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-4">
                    <Badge variant="secondary" className="gap-1 font-body text-xs">
                      <PenLine className="h-3 w-3" /> {author.article_count} article{author.article_count !== 1 ? "s" : ""}
                    </Badge>
                    {author.favorite_count > 0 && (
                      <span className="flex items-center gap-1 font-body text-xs text-muted-foreground">
                        <Heart className="h-3 w-3 text-destructive" /> {author.favorite_count}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Contributors;

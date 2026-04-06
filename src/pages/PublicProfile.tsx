import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Gamepad2, Trophy, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: preferences } = useQuery({
    queryKey: ["profile-preferences", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("categories")
        .eq("user_id", userId!)
        .single();
      return (data?.categories as string[]) || [];
    },
    enabled: !!userId,
  });

  const { data: isPremium } = useQuery({
    queryKey: ["profile-premium", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("setting_key", "manual_premium_users")
        .maybeSingle();
      return ((data?.value as string[]) || []).includes(userId!);
    },
    enabled: !!userId,
  });

  const { data: triviaScores } = useQuery({
    queryKey: ["profile-trivia", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("trivia_scores")
        .select("score, total_questions, category, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!userId,
  });

  const totalScore = triviaScores?.reduce((sum, s) => sum + s.score, 0) || 0;
  const totalQuestions = triviaScores?.reduce((sum, s) => sum + s.total_questions, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pb-20 pt-28">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="mx-auto h-24 w-24 rounded-full" />
            <Skeleton className="mx-auto h-6 w-48" />
            <Skeleton className="mx-auto h-4 w-64" />
          </div>
        ) : !profile ? (
          <p className="text-center font-body text-muted-foreground">Profile not found.</p>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-gold bg-card">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name || ""} className="h-full w-full rounded-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-gold" />
              )}
            </div>

            <h1 className="font-display text-3xl font-bold text-foreground">
              {profile.display_name || "Afrivogue Member"}
            </h1>

            {isPremium && (
              <Badge className="mt-2 inline-flex items-center gap-1 bg-gold/20 text-gold border-gold/30">
                <Crown className="h-3 w-3" /> Premium Member
              </Badge>
            )}

            {profile.bio && (
              <p className="mx-auto mt-3 max-w-md font-body text-sm leading-relaxed text-muted-foreground">
                {profile.bio}
              </p>
            )}

            <p className="mt-2 font-body text-xs text-muted-foreground">
              Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>

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

            {/* Trivia Scores */}
            {triviaScores && triviaScores.length > 0 && (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-gold" />
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Trivia Performance</p>
                </div>

                <div className="mx-auto mb-4 flex max-w-xs justify-center gap-6">
                  <div className="text-center">
                    <p className="font-display text-2xl font-bold text-gold">{totalScore}</p>
                    <p className="font-body text-xs text-muted-foreground">Total Score</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-2xl font-bold text-foreground">{totalQuestions}</p>
                    <p className="font-body text-xs text-muted-foreground">Questions</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-2xl font-bold text-foreground">
                      {totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0}%
                    </p>
                    <p className="font-body text-xs text-muted-foreground">Accuracy</p>
                  </div>
                </div>

                <div className="mx-auto max-w-sm space-y-2">
                  {triviaScores.slice(0, 5).map((s, i) => (
                    <div key={i} className="flex items-center justify-between rounded border border-border px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-3 w-3 text-gold" />
                        <span className="font-body text-xs text-muted-foreground">{s.category || "All"}</span>
                      </div>
                      <Badge variant="secondary" className="font-body text-xs">
                        {s.score}/{s.total_questions}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default PublicProfile;

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal } from "lucide-react";

interface ScoreEntry {
  user_id: string;
  score: number;
  total_questions: number;
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
}

const TriviaLeaderboard = () => {
  const { data: scores = [], isLoading } = useQuery({
    queryKey: ["trivia-leaderboard"],
    queryFn: async () => {
      // Get top scores joined with profiles
      const { data, error } = await supabase
        .from("trivia_scores")
        .select("user_id, score, total_questions, created_at")
        .order("score", { ascending: false })
        .limit(20);
      if (error) throw error;

      // Fetch profile names
      const userIds = [...new Set((data || []).map((s) => s.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.id, p])
      );

      return (data || []).map((s) => ({
        ...s,
        display_name: (profileMap.get(s.user_id) as any)?.display_name || "Anonymous",
        avatar_url: (profileMap.get(s.user_id) as any)?.avatar_url || null,
      })) as ScoreEntry[];
    },
    staleTime: 30_000,
  });

  const rankIcon = (i: number) => {
    if (i === 0) return <Trophy className="h-4 w-4 text-gold" />;
    if (i === 1) return <Medal className="h-4 w-4 text-muted-foreground" />;
    if (i === 2) return <Medal className="h-4 w-4 text-amber-700" />;
    return <span className="font-body text-xs text-muted-foreground w-4 text-center">{i + 1}</span>;
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-6">
        <p className="text-sm text-muted-foreground text-center">Loading leaderboard…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-gold" />
        <h3 className="font-display text-lg font-bold">Leaderboard</h3>
      </div>

      {scores.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No scores yet — be the first to play!
        </p>
      ) : (
        <div className="space-y-2">
          {scores.map((entry, i) => (
            <div
              key={entry.user_id + entry.created_at}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                i === 0 ? "bg-gold/10 border border-gold/20" : "hover:bg-muted/50"
              }`}
            >
              <div className="flex h-6 w-6 items-center justify-center shrink-0">
                {rankIcon(i)}
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {entry.avatar_url ? (
                  <img
                    src={entry.avatar_url}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {(entry.display_name || "?")[0].toUpperCase()}
                  </div>
                )}
                <span className="font-body text-sm truncate">{entry.display_name}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-display text-sm font-bold text-gold">{entry.score}</span>
                <span className="font-body text-[10px] text-muted-foreground">/{entry.total_questions}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TriviaLeaderboard;

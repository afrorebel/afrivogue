import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "lucide-react";
import { motion } from "framer-motion";

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
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default PublicProfile;

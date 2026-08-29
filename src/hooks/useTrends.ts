import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DbTrend {
  id: string;
  headline: string;
  cultural_significance: string;
  geo_relevance: string;
  urgency: string;
  category: string;
  content_tier: string;
  created_at: string;
  updated_at: string;
  image_hint: string | null;
  published: boolean;
  editorial_content: any;
  featured_image_url: string | null;
  images: string[];
  source_url: string | null;
  source_name: string | null;
  needs_review: boolean;
  original_source_content: string | null;
}

export function useTrends() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["trends-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trends")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DbTrend[];
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("trends-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trends" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["trends-public"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

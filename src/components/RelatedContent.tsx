import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TrendCard from "@/components/TrendCard";
import { motion } from "framer-motion";

interface RelatedContentProps {
  currentId: string;
  category: string;
  geoRelevance?: string;
  contentTier?: string;
}

const RelatedContent = ({ currentId, category, geoRelevance, contentTier }: RelatedContentProps) => {
  const { data: related = [] } = useQuery({
    queryKey: ["related-content", currentId, category, geoRelevance],
    queryFn: async () => {
      // 1. Try same category + same geo — tightest match
      const { data: exactMatch } = await supabase
        .from("trends")
        .select("*")
        .eq("published", true)
        .eq("category", category)
        .neq("id", currentId)
        ...(geoRelevance ? eq("geo_relevance", geoRelevance) : this)
        .order("created_at", { ascending: false })
        .limit(6);

      // We'll build results in priority tiers
      let results = exactMatch || [];

      // 2. If not enough, broaden to same category (any geo)
      if (results.length < 3) {
        const { data: catMatch } = await supabase
          .from("trends")
          .select("*")
          .eq("published", true)
          .eq("category", category)
          .neq("id", currentId)
          .order("created_at", { ascending: false })
          .limit(6);

        const existingIds = new Set(results.map((r) => r.id));
        (catMatch || []).forEach((t) => {
          if (!existingIds.has(t.id)) results.push(t);
        });
      }

      // 3. If still not enough, same geo (any category)
      if (results.length < 3 && geoRelevance) {
        const { data: geoMatch } = await supabase
          .from("trends")
          .select("*")
          .eq("published", true)
          .eq("geo_relevance", geoRelevance)
          .neq("id", currentId)
          .order("created_at", { ascending: false })
          .limit(6);

        const existingIds = new Set(results.map((r) => r.id));
        (geoMatch || []).forEach((t) => {
          if (!existingIds.has(t.id)) results.push(t);
        });
      }

      return results.slice(0, 3);
    },
    enabled: !!currentId && !!category,
  });

  if (related.length === 0) return null;

  return (
    <section className="border-t border-border px-6 py-16 md:px-16 lg:px-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-2 flex items-center gap-3">
          <span className="h-px flex-1 bg-gold/20" />
          <span className="font-body text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
            Read Next
          </span>
          <span className="h-px flex-1 bg-gold/20" />
        </div>
        <h2 className="mb-10 text-center font-display text-2xl font-bold text-foreground md:text-3xl">
          Continue the Conversation
        </h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {related.map((t, i) => (
            <TrendCard key={t.id} trend={t} index={i} />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default RelatedContent;

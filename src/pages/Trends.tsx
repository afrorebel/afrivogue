import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import TrendCard from "@/components/TrendCard";
import Footer from "@/components/Footer";
import { useTrends } from "@/hooks/useTrends";
import { trends as fallbackTrends } from "@/lib/trendData";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const categories = ["All", "Fashion", "Beauty", "Luxury", "Culture", "Art & Design", "Entertainment"];

const Trends = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const { data: dbTrends, isLoading } = useTrends();

  const { data: paywalledCategories = [] } = useQuery({
    queryKey: ["paywalled-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "paywalled_categories")
        .maybeSingle();
      return (data?.value as string[]) || [];
    },
  });

  const allTrends = useMemo(() => {
    if (dbTrends && dbTrends.length > 0) return dbTrends;
    return fallbackTrends.map((t) => ({
      id: t.id,
      headline: t.headline,
      cultural_significance: t.culturalSignificance,
      geo_relevance: t.geoRelevance,
      urgency: t.urgency,
      category: t.category,
      content_tier: t.contentTier,
      created_at: t.timestamp,
      image_hint: t.imageHint || null,
      published: true,
      updated_at: t.timestamp,
      editorial_content: null,
      featured_image_url: null,
      images: [],
      source_url: null,
      source_name: null,
    }));
  }, [dbTrends]);

  const filtered = activeCategory === "All"
    ? allTrends
    : allTrends.filter((t) => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-14 px-6 md:px-16 lg:px-24">
        <div className="mb-8">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-gold">Explore</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground md:text-4xl">Latest Stories</h1>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? "bg-gold text-primary-foreground hover:bg-gold/90" : ""}
            >
              {cat}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((trend, i) => (
              <TrendCard
                key={trend.id}
                trend={trend}
                index={i}
                isPaywalled={paywalledCategories.includes(trend.category)}
              />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <p className="py-20 text-center font-body text-muted-foreground">No trends found in this category.</p>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Trends;

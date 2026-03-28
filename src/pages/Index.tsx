import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FilterBar from "@/components/FilterBar";
import TrendCard from "@/components/TrendCard";
import LeadGenWidget from "@/components/LeadGenWidget";
import NewsletterPopup from "@/components/NewsletterPopup";
import TrendingTicker from "@/components/TrendingTicker";
import FeaturedProducts from "@/components/shop/FeaturedProducts";
import Footer from "@/components/Footer";
import { useTrends } from "@/hooks/useTrends";
import { trends as fallbackTrends } from "@/lib/trendData";
import type { Category, Urgency, GeoRelevance, ContentTier } from "@/lib/trendData";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [category, setCategory] = useState<Category | "All">("All");
  const [urgency, setUrgency] = useState<Urgency | "All">("All");
  const [geo, setGeo] = useState<GeoRelevance | "All">("All");
  const [contentTier, setContentTier] = useState<ContentTier | "All">("All");

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
    if (dbTrends && dbTrends.length > 0) {
      return dbTrends;
    }
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

  const filtered = useMemo(() => {
    return allTrends.filter((t) => {
      if (category !== "All" && t.category !== category) return false;
      if (urgency !== "All" && t.urgency !== urgency) return false;
      if (geo !== "All" && t.geo_relevance !== geo) return false;
      if (contentTier !== "All" && t.content_tier !== contentTier) return false;
      return true;
    });
  }, [allTrends, category, urgency, geo, contentTier]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <TrendingTicker />
      <NewsletterPopup />

      <main className="py-12">
        <FilterBar
          activeCategory={category}
          activeUrgency={urgency}
          activeGeo={geo}
          activeContentTier={contentTier}
          onCategoryChange={setCategory}
          onUrgencyChange={setUrgency}
          onGeoChange={setGeo}
          onContentTierChange={setContentTier}
        />

        {isLoading ? (
          <div className="mt-10 grid gap-6 px-6 md:grid-cols-2 md:px-16 lg:px-24 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-6 px-6 md:grid-cols-2 md:px-16 lg:px-24 xl:grid-cols-3">
              {filtered.slice(0, 6).map((trend, i) => (
                <TrendCard key={trend.id} trend={trend} index={i} isPaywalled={paywalledCategories.includes(trend.category)} />
              ))}
            </div>

            {filtered.length > 3 && (
              <div className="px-6 md:px-16 lg:px-24">
                <LeadGenWidget variant="banner" />
              </div>
            )}

            {filtered.length > 6 && (
              <div className="mt-6 grid gap-6 px-6 md:grid-cols-2 md:px-16 lg:px-24 xl:grid-cols-3">
                {filtered.slice(6).map((trend, i) => (
                  <TrendCard key={trend.id} trend={trend} index={i + 6} isPaywalled={paywalledCategories.includes(trend.category)} />
                ))}
              </div>
            )}
          </>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="mt-16 text-center">
            <p className="font-display text-xl text-muted-foreground">No trends match your filters.</p>
            <p className="mt-2 font-body text-sm text-muted-foreground">Try broadening your selection.</p>
          </div>
        )}
        {/* Featured Products */}
        <FeaturedProducts />
      </main>

      <Footer />
    </div>
  );
};

export default Index;

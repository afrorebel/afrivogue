import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FilterBar from "@/components/FilterBar";
import TrendCard from "@/components/TrendCard";
import LeadGenWidget from "@/components/LeadGenWidget";
import NewsletterPopup from "@/components/NewsletterPopup";
import { useTrends } from "@/hooks/useTrends";
import { trends as fallbackTrends } from "@/lib/trendData";
import type { Category, Urgency, GeoRelevance, ContentTier } from "@/lib/trendData";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [category, setCategory] = useState<Category | "All">("All");
  const [urgency, setUrgency] = useState<Urgency | "All">("All");
  const [geo, setGeo] = useState<GeoRelevance | "All">("All");
  const [contentTier, setContentTier] = useState<ContentTier | "All">("All");

  const { data: dbTrends, isLoading } = useTrends();

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
                <TrendCard key={trend.id} trend={trend} index={i} />
              ))}
            </div>

            {/* Lead gen banner after first 6 cards */}
            {filtered.length > 3 && (
              <div className="px-6 md:px-16 lg:px-24">
                <LeadGenWidget variant="banner" />
              </div>
            )}

            {/* Remaining cards */}
            {filtered.length > 6 && (
              <div className="mt-6 grid gap-6 px-6 md:grid-cols-2 md:px-16 lg:px-24 xl:grid-cols-3">
                {filtered.slice(6).map((trend, i) => (
                  <TrendCard key={trend.id} trend={trend} index={i + 6} />
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

        <footer id="about" className="mt-24 border-t border-border px-6 py-10 md:px-16 lg:px-24">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="font-display text-lg font-bold text-foreground">
              AFRI<span className="text-gold">VOGUE</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center md:items-end">
              <p className="font-body text-xs text-muted-foreground">
                © 2026 Afrivogue. All rights reserved.
              </p>
              <p className="font-body text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
                Africa &amp; the Diaspora · Luxury · Culture · Foresight
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;

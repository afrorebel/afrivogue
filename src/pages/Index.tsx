import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import afrivogueIcon from "@/assets/afrivogue-icon.png";
import Navbar from "@/components/Navbar";
import TrendCard from "@/components/TrendCard";
import LeadGenWidget from "@/components/LeadGenWidget";
import NewsletterPopup from "@/components/NewsletterPopup";
import TrendingTicker from "@/components/TrendingTicker";
import FeaturedProducts from "@/components/shop/FeaturedProducts";
import Footer from "@/components/Footer";
import { useTrends } from "@/hooks/useTrends";
import { trends as fallbackTrends } from "@/lib/trendData";
import type { Category } from "@/lib/trendData";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { getCategoryImage } from "@/lib/categoryImages";

const Index = () => {
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

  // Fetch admin-selected hero trend ID
  const { data: heroTrendId } = useQuery({
    queryKey: ["hero-trend-id"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero_trend_id")
        .maybeSingle();
      return (data?.value as string) || "";
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

  // Hero: use admin-selected trend if set, otherwise first
  const hero = useMemo(() => {
    if (heroTrendId) {
      const found = allTrends.find((t) => t.id === heroTrendId);
      if (found) return found;
    }
    return allTrends[0];
  }, [allTrends, heroTrendId]);

  // Trends section = 6 items excluding hero
  const trendCards = useMemo(() => {
    return allTrends.filter((t) => t.id !== hero?.id).slice(0, 6);
  }, [allTrends, hero]);

  // Editorials
  const editorials = allTrends
    .filter((t) => ["Editorial Feature", "Premium Long-Form"].includes(t.content_tier))
    .slice(0, 6);

  const heroImage = (hero?.featured_image_url && hero.featured_image_url.trim() !== "")
    ? hero.featured_image_url
    : getCategoryImage(hero?.category || "Fashion");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <TrendingTicker />
      <NewsletterPopup />

      {/* ── Cinematic Hero ── */}
      {hero && (
        <section className="relative h-[75vh] min-h-[520px] overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImage} alt={hero.headline} className="h-full w-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          </div>
          <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-14 md:px-16 lg:px-24">
            <p className="mb-3 font-body text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              {hero.category} · {hero.urgency}
            </p>
            <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.08] text-foreground md:text-5xl lg:text-6xl">
              {hero.headline}
            </h1>
            <p className="mt-4 max-w-xl font-body text-base text-muted-foreground md:text-lg line-clamp-2">
              {hero.cultural_significance}
            </p>
            <div className="mt-6">
              <Button asChild className="bg-gold text-primary-foreground hover:bg-gold/90 font-body text-sm uppercase tracking-wider">
                <Link to={hero.content_tier === "Premium Long-Form" ? `/editorial/${hero.id}` : `/trend/${hero.id}`}>
                  Read Story <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <main>
        {/* ── Trends Section ── */}
        <section className="py-14 px-6 md:px-16 lg:px-24">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="font-body text-xs uppercase tracking-[0.2em] text-gold">What's Moving</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-foreground md:text-3xl">Latest Trends</h2>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/trends">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
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
              {trendCards.map((trend, i) => (
                <TrendCard key={trend.id} trend={trend} index={i} isPaywalled={paywalledCategories.includes(trend.category)} />
              ))}
            </div>
          )}
        </section>

        {/* ── Newsletter Block ── */}
        <section className="px-6 md:px-16 lg:px-24">
          <LeadGenWidget variant="banner" />
        </section>

        {/* ── Editorials ── */}
        {editorials.length > 0 && (
          <section className="py-14 px-6 md:px-16 lg:px-24">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="font-body text-xs uppercase tracking-[0.2em] text-gold">Deep Reads</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-foreground md:text-3xl">Editorials</h2>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/editorials">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {editorials.map((trend, i) => (
                <TrendCard key={trend.id} trend={trend} index={i} isPaywalled={paywalledCategories.includes(trend.category)} />
              ))}
            </div>
          </section>
        )}

        {/* ── Shop Promotion ── */}
        <FeaturedProducts />

        {/* ── Membership CTA ── */}
        <section className="py-16 px-6 md:px-16 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-lg border border-gold/30 bg-card p-10 md:p-14 text-center"
          >
            <Crown className="mx-auto h-10 w-10 text-gold mb-4" />
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Join the <span className="text-gold">Afrivogue Collective</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-body text-base text-muted-foreground">
              Unlock premium editorials, earn from your contributions, and join a global community of culture shapers.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild className="bg-gold text-primary-foreground hover:bg-gold/90 px-8">
                <Link to="/membership">Become a Member</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;

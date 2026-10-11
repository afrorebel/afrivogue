import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import afrivogueIcon from "@/assets/afrivogue-icon.png";
import Navbar from "@/components/Navbar";
import TrendCard from "@/components/TrendCard";
import EditorialTile from "@/components/EditorialTile";
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
import SectionRule from "@/components/editorial/SectionRule";
import MembershipCTA from "@/components/editorial/MembershipCTA";

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

      {/* ── Editorial Masthead + Hero ── */}
      <div className="px-6 pt-28 md:px-12 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-center justify-between border-b border-border/60 pb-4">
            <span className="font-body text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              Afrivogue Feed
            </span>
            <span className="hidden font-body text-[9px] uppercase tracking-[0.4em] text-muted-foreground md:block">
              Global Fashion · Culture · Lifestyle
            </span>
            <span className="font-body text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              Lagos / London
            </span>
          </div>
          <h1 className="mb-16 text-center font-display text-[14vw] italic uppercase leading-[0.8] tracking-tighter text-foreground md:text-[10vw]">
            Afri<span className="text-gold">Vogue</span>
          </h1>
        </div>
      </div>

      {hero && (
        <section className="px-6 md:px-12 lg:px-16">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <div className="overflow-hidden">
                <img
                  src={heroImage}
                  alt={hero.headline}
                  className="aspect-[4/5] w-full bg-surface object-cover transition-transform duration-[1400ms] ease-out hover:scale-[1.03]"
                  onError={(e) => {
                    e.currentTarget.src = afrivogueIcon;
                    e.currentTarget.className = "aspect-[4/5] w-full bg-surface object-contain p-24 opacity-40";
                  }}
                />
              </div>
              <div className="mt-6 flex items-start justify-between border-t border-gold/30 pt-4">
                <div>
                  <p className="mb-1 font-body text-[10px] uppercase tracking-[0.2em] text-gold">
                    {hero.category} · {hero.urgency}
                  </p>
                  <h2 className="font-display text-3xl italic text-foreground md:text-4xl">{hero.headline}</h2>
                </div>
                <p className="font-body text-[9px] uppercase tracking-widest text-muted-foreground">Current Cover</p>
              </div>
            </div>

            <div className="md:col-span-5 md:pl-16 md:pt-32">
              <div className="max-w-xs">
                <p className="mb-8 font-body text-xs uppercase leading-relaxed tracking-[0.2em] text-foreground line-clamp-6">
                  {hero.cultural_significance}
                </p>
                <Link
                  to={hero.content_tier === "Premium Long-Form" ? `/editorial/${hero.id}` : `/trend/${hero.id}`}
                  className="group inline-flex items-center gap-4"
                >
                  <span className="font-body text-[10px] uppercase tracking-[0.4em] text-foreground">Read Story</span>
                  <span className="h-px w-12 bg-gold transition-all duration-500 group-hover:w-20" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <main>
        {/* ── Latest Stories ── */}
        <section className="px-6 py-24 md:px-12 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <SectionRule label="Latest Stories" className="mb-20" />


            {isLoading ? (
              <div className="grid grid-cols-1 gap-12 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[3/4] w-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-12 gap-y-24 md:grid-cols-3 lg:grid-cols-4">
                {trendCards.map((trend, i) => {
                  const pattern = i % 3;
                  const size = pattern === 0 ? "lead" : pattern === 1 ? "mood" : "tall";
                  const offset =
                    pattern === 0 ? "lg:col-span-2" : pattern === 1 ? "md:pt-40" : "lg:-mt-20";
                  return (
                    <div key={trend.id} className={offset}>
                      <EditorialTile
                        trend={trend as any}
                        index={i}
                        size={size}
                        isPaywalled={paywalledCategories.includes(trend.category)}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-20 flex justify-center">
              <Link
                to="/trends"
                className="border-b border-border pb-1 font-body text-[10px] uppercase tracking-[0.4em] text-foreground transition-colors hover:border-gold hover:text-gold"
              >
                View All Stories
              </Link>
            </div>
          </div>
        </section>

        {/* ── Newsletter Block ── */}
        <section className="px-6 md:px-16 lg:px-24">
          <LeadGenWidget variant="banner" />
        </section>

        {/* ── Editorials ── */}
        {editorials.length > 0 && (
          <section className="px-6 py-24 md:px-12 lg:px-16">
            <div className="mx-auto max-w-7xl">
              <SectionRule label="Afrivogue Editorials" className="mb-20" />

              <div className="grid grid-cols-1 gap-x-12 gap-y-20 md:grid-cols-3">
                {editorials.map((trend, i) => (
                  <EditorialTile
                    key={trend.id}
                    trend={trend as any}
                    index={i}
                    size="mood"
                    isPaywalled={paywalledCategories.includes(trend.category)}
                  />
                ))}
              </div>
              <div className="mt-20 flex justify-center">
                <Link
                  to="/editorials"
                  className="border-b border-border pb-1 font-body text-[10px] uppercase tracking-[0.4em] text-foreground transition-colors hover:border-gold hover:text-gold"
                >
                  All Editorials
                </Link>
              </div>
            </div>
          </section>
        )}


        {/* ── Shop Promotion ── */}
        <FeaturedProducts />

        {/* ── Membership CTA ── */}
        <MembershipCTA />

      </main>

      <Footer />
    </div>
  );
};

export default Index;

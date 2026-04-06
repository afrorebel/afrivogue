import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import TrendCard from "@/components/TrendCard";
import Footer from "@/components/Footer";
import FeaturedProducts from "@/components/shop/FeaturedProducts";
import { useTrends } from "@/hooks/useTrends";
import { trends as fallbackTrends } from "@/lib/trendData";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Crown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const PER_PAGE = 12;

const Trends = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [page, setPage] = useState(1);
  const { data: dbTrends, isLoading } = useTrends();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("name").is("parent_id", null).order("name");
      return data?.map((c: any) => c.name) || [];
    },
  });

  const { data: paywalledCategories = [] } = useQuery({
    queryKey: ["paywalled-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("setting_key", "paywalled_categories")
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const allCategories = ["All", ...categories];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-14 px-6 md:px-16 lg:px-24">
        <div className="mb-8">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-gold">Explore</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground md:text-4xl">Latest Stories</h1>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => { setActiveCategory(cat); setPage(1); }}
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
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {paged.map((trend, i) => (
                <TrendCard
                  key={trend.id}
                  trend={trend}
                  index={i}
                  isPaywalled={paywalledCategories.includes(trend.category)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage(safePage - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <span className="font-body text-sm text-muted-foreground">
                  Page {safePage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(safePage + 1)}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {!isLoading && paged.length === 0 && (
          <p className="py-20 text-center font-body text-muted-foreground">No trends found in this category.</p>
        )}
      </section>

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Membership CTA */}
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

      <Footer />
    </div>
  );
};

export default Trends;

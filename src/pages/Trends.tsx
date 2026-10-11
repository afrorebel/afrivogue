import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EditorialTile from "@/components/EditorialTile";
import PageMasthead from "@/components/editorial/PageMasthead";
import MembershipCTA from "@/components/editorial/MembershipCTA";
import FeaturedProducts from "@/components/shop/FeaturedProducts";
import { useTrends } from "@/hooks/useTrends";
import { trends as fallbackTrends } from "@/lib/trendData";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const allCategories = ["All", ...categories];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageMasthead
        eyebrow="Afrivogue Feed"
        title="Latest"
        accent="Stories"
        intro="The current record of fashion, culture and lifestyle across Africa and its diaspora — updated as the story moves."
      />

      <main className="px-6 md:px-12 lg:px-16">
        <div className="mx-auto max-w-7xl">
          {/* Category rail */}
          <div className="mb-16 flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-border/60 pb-4">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setPage(1); }}
                className={`border-b pb-1 font-body text-[9px] uppercase tracking-[0.3em] transition-colors ${
                  activeCategory === cat
                    ? "border-gold text-gold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-x-12 gap-y-20 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/5] w-full" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : paged.length === 0 ? (
            <p className="py-24 text-center font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
              No stories in this category yet.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-x-12 gap-y-20 md:grid-cols-2 lg:grid-cols-3">
                {paged.map((trend, i) => (
                  <EditorialTile
                    key={trend.id}
                    trend={trend as any}
                    index={i}
                    size="mood"
                    isPaywalled={paywalledCategories.includes(trend.category)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-24 flex items-center justify-between border-t border-border/60 pt-6">
                  <button
                    disabled={safePage <= 1}
                    onClick={() => setPage(safePage - 1)}
                    className="inline-flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.3em] text-foreground transition-colors hover:text-gold disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3 w-3" /> Previous
                  </button>
                  <span className="font-body text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    disabled={safePage >= totalPages}
                    onClick={() => setPage(safePage + 1)}
                    className="inline-flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.3em] text-foreground transition-colors hover:text-gold disabled:pointer-events-none disabled:opacity-30"
                  >
                    Next <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <FeaturedProducts />
        <MembershipCTA />
      </main>

      <Footer />
    </div>
  );
};

export default Trends;

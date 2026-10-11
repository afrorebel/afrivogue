import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EditorialTile, { MASONRY_ASPECTS } from "@/components/EditorialTile";
import Pager from "@/components/editorial/Pager";
import PageMasthead from "@/components/editorial/PageMasthead";
import MembershipCTA from "@/components/editorial/MembershipCTA";
import FeaturedProducts from "@/components/shop/FeaturedProducts";
import { useTrends } from "@/hooks/useTrends";
import { trends as fallbackTrends } from "@/lib/trendData";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/integrations/api/client";
import { categoryColor } from "@/lib/categoryColors";

const PER_PAGE = 12;

const Trends = () => {
  // The active category lives in the URL (?category=Beauty) so category links elsewhere land pre-filtered.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "All";
  const [page, setPage] = useState(1);
  const setActiveCategory = (cat: string) => {
    setSearchParams(cat === "All" ? {} : { category: cat }, { replace: true });
  };
  const { data: dbTrends, isLoading } = useTrends();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const { data } = await api.from("categories").select("name").is("parent_id", null).order("name");
      return data?.map((c: any) => c.name) || [];
    },
  });

  const { data: paywalledCategories = [] } = useQuery({
    queryKey: ["paywalled-categories"],
    queryFn: async () => {
      const { data } = await api
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
        eyebrow="The feed"
        title="Latest"
        accent="Stories"
        intro="What is moving fashion, beauty and culture across Africa and the diaspora right now, updated as the story unfolds."
      />

      <main className="px-4 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          {/* Category pills */}
          <div className="-mx-4 mb-10 flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar md:mx-0 md:flex-wrap md:px-0">
            {allCategories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setPage(1); }}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 font-body text-sm font-medium transition-all ${
                    active ? "border-transparent text-white shadow-soft" : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                  style={active ? { backgroundColor: cat === "All" ? "hsl(var(--foreground))" : categoryColor(cat), color: cat === "All" ? "hsl(var(--background))" : undefined } : undefined}
                >
                  {cat !== "All" && !active && (
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryColor(cat) }} />
                  )}
                  {cat}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="columns-2 gap-4 md:columns-3 md:gap-6 xl:columns-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="mb-6 break-inside-avoid space-y-3">
                  <Skeleton className={`w-full rounded-2xl ${MASONRY_ASPECTS[i % MASONRY_ASPECTS.length]}`} />
                  <Skeleton className="h-5 w-4/5 rounded-full" />
                  <Skeleton className="h-3 w-1/2 rounded-full" />
                </div>
              ))}
            </div>
          ) : paged.length === 0 ? (
            <p className="py-24 text-center font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
              No stories in this category yet.
            </p>
          ) : (
            <>
              <div className="columns-2 gap-4 md:columns-3 md:gap-6 xl:columns-4">
                {paged.map((trend, i) => (
                  <EditorialTile
                    key={trend.id}
                    trend={trend as any}
                    index={i}
                    aspect={MASONRY_ASPECTS[i % MASONRY_ASPECTS.length]}
                    isPaywalled={paywalledCategories.includes(trend.category)}
                  />
                ))}
              </div>
              <Pager page={safePage} totalPages={totalPages} onChange={(n) => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
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

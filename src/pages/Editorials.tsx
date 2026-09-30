import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EditorialTile from "@/components/EditorialTile";
import PageMasthead from "@/components/editorial/PageMasthead";
import MembershipCTA from "@/components/editorial/MembershipCTA";
import FeaturedProducts from "@/components/shop/FeaturedProducts";
import { useTrends } from "@/hooks/useTrends";
import { trends as fallbackTrends } from "@/lib/trendData";
import { Skeleton } from "@/components/ui/skeleton";

const EDITORIAL_TIERS = ["Editorial Feature", "Premium Long-Form"];
const PER_PAGE = 12;

const Editorials = () => {
  const { data: dbTrends, isLoading } = useTrends();
  const [page, setPage] = useState(1);

  const editorials = useMemo(() => {
    const source = dbTrends && dbTrends.length > 0
      ? dbTrends
      : fallbackTrends.map((t) => ({
          id: t.id,
          headline: t.headline,
          cultural_significance: t.culturalSignificance,
          geo_relevance: t.geoRelevance,
          urgency: t.urgency,
          category: t.category,
          content_tier: t.contentTier,
          created_at: t.timestamp,
          image_hint: t.imageHint || null,
          featured_image_url: null as string | null,
          published: true,
        }));

    return source.filter((t) => EDITORIAL_TIERS.includes(t.content_tier) && t.published);
  }, [dbTrends]);

  const totalPages = Math.max(1, Math.ceil(editorials.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = editorials.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageMasthead
        eyebrow="Afrivogue Editorials"
        title="The"
        accent="Editorials"
        intro="Long-form features and premium essays on the cultural forces reshaping African and diaspora fashion, beauty and luxury."
      />

      <main className="px-6 md:px-12 lg:px-16">
        <div className="mx-auto max-w-7xl">
          {isLoading ? (
            <div className="grid gap-x-12 gap-y-20 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/5] w-full" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="font-display text-2xl italic text-muted-foreground">No editorials published yet.</p>
              <Link
                to="/"
                className="mt-6 border-b border-border pb-1 font-body text-[10px] uppercase tracking-[0.3em] text-foreground transition-colors hover:border-gold hover:text-gold"
              >
                Back to the Feed
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-x-12 gap-y-20 md:grid-cols-2 lg:grid-cols-3">
                {paged.map((editorial, i) => (
                  <EditorialTile key={editorial.id} trend={editorial as any} index={i} size="mood" />
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

export default Editorials;

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
        eyebrow="Long reads"
        title="The"
        accent="Editorials"
        intro="Deep, beautifully told features on the people and ideas reshaping style. Pour something good and stay a while."
      />

      <main className="px-4 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          {isLoading ? (
            <div className="columns-2 gap-4 md:columns-3 md:gap-6 xl:columns-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="mb-6 break-inside-avoid space-y-3">
                  <Skeleton className={`w-full rounded-2xl ${MASONRY_ASPECTS[i % MASONRY_ASPECTS.length]}`} />
                  <Skeleton className="h-5 w-4/5 rounded-full" />
                  <Skeleton className="h-3 w-1/2 rounded-full" />
                </div>
              ))}
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="font-display text-2xl italic text-muted-foreground">No editorials published yet.</p>
              <Link
                to="/"
                className="mt-6 rounded-full border border-border px-5 py-2.5 font-body text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold"
              >
                Back to the Feed
              </Link>
            </div>
          ) : (
            <>
              <div className="columns-2 gap-4 md:columns-3 md:gap-6 xl:columns-4">
                {paged.map((editorial, i) => (
                  <EditorialTile key={editorial.id} trend={editorial as any} index={i} aspect={MASONRY_ASPECTS[i % MASONRY_ASPECTS.length]} />
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

export default Editorials;

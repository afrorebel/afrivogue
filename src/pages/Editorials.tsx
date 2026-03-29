import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Crown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeaturedProducts from "@/components/shop/FeaturedProducts";
import { useTrends } from "@/hooks/useTrends";
import { trends as fallbackTrends } from "@/lib/trendData";
import { getCategoryImage } from "@/lib/categoryImages";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

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

    return source.filter(
      (t) => EDITORIAL_TIERS.includes(t.content_tier) && t.published
    );
  }, [dbTrends]);

  const totalPages = Math.max(1, Math.ceil(editorials.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = editorials.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <header className="relative z-10 px-6 pb-12 pt-28 md:px-16 lg:px-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-block rounded-sm border border-gold/30 px-4 py-1.5 font-body text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
            Editorials
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl">
            Afrivogue <span className="text-gold">Editorials</span>
          </h1>
          <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-muted-foreground sm:text-lg">
            In-depth editorial features and premium long-form pieces exploring the cultural forces reshaping African and Diaspora fashion, beauty, and luxury.
          </p>
        </motion.div>
        <motion.div className="mt-8 h-px w-24 origin-left bg-gold/40" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.3 }} />
      </header>

      {/* Grid */}
      <section className="relative z-10 px-6 pb-20 md:px-16 lg:px-24">
        {isLoading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[16/10] w-full rounded-md" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-display text-xl text-muted-foreground">No editorials published yet.</p>
            <Link to="/" className="mt-4 font-body text-sm text-gold hover:text-terracotta transition-colors">
              ← Back to Feed
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {paged.map((editorial, i) => {
                const imageUrl = editorial.featured_image_url || getCategoryImage(editorial.category);
                const date = new Date(editorial.created_at).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric",
                });
                const isPremium = editorial.content_tier === "Premium Long-Form";
                const detailPath = isPremium ? `/editorial/${editorial.id}` : `/trend/${editorial.id}`;

                return (
                  <motion.article
                    key={editorial.id}
                    className="group relative flex flex-col overflow-hidden rounded-md border border-border bg-card transition-all hover:border-gold/30 hover:shadow-lg"
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
                    variants={cardVariants} custom={i}
                  >
                    <Link to={detailPath} className="block">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img src={imageUrl} alt={editorial.headline} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-3 left-3 flex gap-2">
                          <span className="rounded-sm bg-gold/90 px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider text-primary-foreground">{editorial.content_tier}</span>
                          <span className="rounded-sm bg-background/80 px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider text-foreground backdrop-blur-sm">{editorial.category}</span>
                        </div>
                      </div>
                    </Link>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="font-body text-[11px] uppercase tracking-wider">{date}</span>
                      </div>
                      <Link to={detailPath}>
                        <h2 className="mt-3 font-display text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-gold">{editorial.headline}</h2>
                      </Link>
                      <p className="mt-2 line-clamp-3 flex-1 font-body text-sm leading-relaxed text-muted-foreground">{editorial.cultural_significance}</p>
                      <Link to={detailPath} className="mt-4 inline-flex items-center gap-1.5 font-body text-xs font-medium uppercase tracking-[0.15em] text-gold transition-colors hover:text-foreground">
                        Read {isPremium ? "Premium Feature" : "Editorial"} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <span className="font-body text-sm text-muted-foreground">Page {safePage} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Membership CTA */}
      <section className="py-16 px-6 md:px-16 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
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

export default Editorials;

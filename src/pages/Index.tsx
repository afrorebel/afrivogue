import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import EditorialTile, { MASONRY_ASPECTS, plainExcerpt } from "@/components/EditorialTile";
import LeadGenWidget from "@/components/LeadGenWidget";
import NewsletterPopup from "@/components/NewsletterPopup";
import FeaturedProducts from "@/components/shop/FeaturedProducts";
import Footer from "@/components/Footer";
import { useTrends } from "@/hooks/useTrends";
import { trends as fallbackTrends } from "@/lib/trendData";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/integrations/api/client";
import SectionHeader from "@/components/editorial/SectionHeader";
import CategoryChip from "@/components/editorial/CategoryChip";
import MembershipCTA from "@/components/editorial/MembershipCTA";
import { getCategoryImage } from "@/lib/categoryImages";
import { categoryColor } from "@/lib/categoryColors";

const FALLBACK_CATEGORIES = ["Fashion", "Beauty", "Luxury", "Culture", "Art & Design", "Business", "Entertainment", "Lifestyle"];

const imageFor = (t: { featured_image_url?: string | null; category: string }) =>
  t.featured_image_url && t.featured_image_url.trim() !== "" ? t.featured_image_url : getCategoryImage(t.category);

const hrefFor = (t: { id: string; content_tier?: string }) =>
  t.content_tier === "Premium Long-Form" ? `/editorial/${t.id}` : `/trend/${t.id}`;

const fallbackTo = (category: string) => (e: React.SyntheticEvent<HTMLImageElement>) => {
  const fallback = getCategoryImage(category);
  if (!e.currentTarget.src.endsWith(fallback)) e.currentTarget.src = fallback;
};

const Index = () => {
  const { data: dbTrends, isLoading } = useTrends();

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

  // Admin-selected cover story
  const { data: heroTrendId } = useQuery({
    queryKey: ["hero-trend-id"],
    queryFn: async () => {
      const { data } = await api
        .from("site_settings")
        .select("value")
        .eq("key", "hero_trend_id")
        .maybeSingle();
      return (data?.value as string) || "";
    },
  });

  const { data: categories = FALLBACK_CATEGORIES } = useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const { data } = await api.from("categories").select("name").is("parent_id", null).order("name");
      const names = data?.map((c: { name: string }) => c.name) || [];
      return names.length ? names : FALLBACK_CATEGORIES;
    },
  });

  const { data: moodboard = [] } = useQuery({
    queryKey: ["home-moodboard"],
    queryFn: async () => {
      const { data } = await api
        .from("moodboard_items")
        .select("id, image_url, caption, category")
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(12);
      return data || [];
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

  const hero = useMemo(() => {
    if (heroTrendId) {
      const found = allTrends.find((t) => t.id === heroTrendId);
      if (found) return found;
    }
    return allTrends[0];
  }, [allTrends, heroTrendId]);

  const rest = useMemo(() => allTrends.filter((t) => t.id !== hero?.id), [allTrends, hero]);
  const trendingNow = rest.slice(0, 4);
  const latest = rest.slice(4, 16);
  const editorials = useMemo(
    () => rest.filter((t) => ["Editorial Feature", "Premium Long-Form"].includes(t.content_tier)).slice(0, 3),
    [rest],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of allTrends) counts[t.category] = (counts[t.category] || 0) + 1;
    return counts;
  }, [allTrends]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <NewsletterPopup />

      <main className="px-4 pt-20 md:px-8 md:pt-24 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          {/* ── Cover story + trending ── */}
          {hero && (
            <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-8"
              >
                <Link
                  to={hrefFor(hero)}
                  className="group relative block h-full min-h-[480px] overflow-hidden rounded-3xl bg-surface shadow-soft md:min-h-[600px]"
                >
                  <img
                    src={imageFor(hero)}
                    alt={hero.headline}
                    onError={fallbackTo(hero.category)}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 font-body text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-900">
                        Cover Story
                      </span>
                      <CategoryChip category={hero.category} variant="solid" />
                    </div>
                    <h1 className="max-w-3xl font-display text-4xl italic leading-[1.02] text-white md:text-6xl">
                      {hero.headline}
                    </h1>
                    <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-white/80 line-clamp-2 md:text-base">
                      {plainExcerpt(hero.cultural_significance || "")}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-body text-sm font-semibold text-neutral-900 transition-transform group-hover:translate-x-1">
                      Read the story <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>

              <motion.aside
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex flex-col rounded-3xl border border-border/60 bg-card p-5 shadow-soft md:p-6 lg:col-span-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-2xl italic text-foreground">Trending now</h2>
                  <span className="flex items-center gap-1.5 font-body text-[11px] font-medium text-muted-foreground">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--cat-fashion))]" /> Live
                  </span>
                </div>
                <div className="flex flex-1 flex-col divide-y divide-border/60">
                  {trendingNow.map((t) => (
                    <Link key={t.id} to={hrefFor(t)} className="group flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                      <img
                        src={imageFor(t)}
                        alt=""
                        loading="lazy"
                        onError={fallbackTo(t.category)}
                        className="h-24 w-20 shrink-0 rounded-xl object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="min-w-0">
                        <CategoryChip category={t.category} className="mb-2 px-2.5 py-0.5 text-[9px]" />
                        <h3 className="font-display text-base leading-snug text-foreground transition-colors line-clamp-3 group-hover:text-gold">
                          {t.headline}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  to="/trends"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-muted px-5 py-2.5 font-body text-xs font-semibold text-foreground transition-colors hover:bg-gold hover:text-primary-foreground"
                >
                  All stories <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.aside>
            </section>
          )}

          {/* ── Browse by category ── */}
          <section className="mt-12 md:mt-16">
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar md:mx-0 md:flex-wrap md:px-0">
              {categories.map((c) => (
                <Link
                  key={c}
                  to={`/trends?category=${encodeURIComponent(c)}`}
                  className="group flex shrink-0 items-center gap-3 rounded-full border border-border/70 bg-card py-1.5 pl-1.5 pr-5 transition-all hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <span className="relative h-10 w-10 overflow-hidden rounded-full">
                    <img src={getCategoryImage(c)} alt="" className="h-full w-full object-cover" />
                    <span className="absolute inset-0 mix-blend-multiply" style={{ backgroundColor: categoryColor(c, 0.35) }} />
                  </span>
                  <span className="font-body text-sm font-medium text-foreground transition-colors group-hover:text-gold">{c}</span>
                  {categoryCounts[c] ? (
                    <span
                      className="rounded-full px-2 py-0.5 font-body text-[10px] font-semibold"
                      style={{ backgroundColor: categoryColor(c, 0.15), color: categoryColor(c) }}
                    >
                      {categoryCounts[c]}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>

          {/* ── Latest stories (masonry) ── */}
          <section className="mt-16 md:mt-24">
            <SectionHeader eyebrow="Fresh from the feed" title="Latest Stories" link={{ to: "/trends", label: "View all stories" }} />
            {isLoading ? (
              <div className="columns-2 gap-4 md:columns-3 md:gap-6 xl:columns-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="mb-6 break-inside-avoid space-y-3">
                    <Skeleton className={`w-full rounded-2xl ${MASONRY_ASPECTS[i % MASONRY_ASPECTS.length]}`} />
                    <Skeleton className="h-5 w-4/5 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="columns-2 gap-4 md:columns-3 md:gap-6 xl:columns-4">
                {latest.map((trend, i) => (
                  <EditorialTile
                    key={trend.id}
                    trend={trend as any}
                    index={i}
                    aspect={MASONRY_ASPECTS[i % MASONRY_ASPECTS.length]}
                    isPaywalled={paywalledCategories.includes(trend.category)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Moodboard strip ── */}
          {moodboard.length > 0 && (
            <section className="mt-16 md:mt-24">
              <SectionHeader eyebrow="Curated by our community" title="From the Moodboard" link={{ to: "/moodboard", label: "Explore the moodboard" }} />
              <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-6">
                {moodboard.map((m: { id: string; image_url: string; caption: string; category: string }, i: number) => (
                  <Link
                    key={m.id}
                    to="/moodboard"
                    className="group relative mb-4 block break-inside-avoid overflow-hidden rounded-2xl bg-surface shadow-soft"
                  >
                    <img
                      src={m.image_url}
                      alt={m.caption}
                      loading="lazy"
                      onError={fallbackTo(m.category)}
                      className={`w-full object-cover transition-transform duration-700 group-hover:scale-[1.05] ${
                        ["aspect-[3/4]", "aspect-square", "aspect-[2/3]", "aspect-[4/5]"][i % 4]
                      }`}
                    />
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <p className="font-body text-xs leading-snug text-white line-clamp-3">{m.caption}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Style Concierge ── */}
          <section className="mt-16 md:mt-24">
            <Link
              to="/concierge"
              className="group relative block overflow-hidden rounded-3xl bg-sunset p-7 text-white shadow-lift md:p-12"
            >
              <div className="relative max-w-2xl">
                <p className="inline-flex rounded-full bg-white/15 px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.2em]">
                  New · Style Concierge
                </p>
                <h2 className="mt-4 font-display text-4xl italic leading-[1.02] md:text-6xl">What are you dressing for?</h2>
                <p className="mt-4 max-w-lg font-body text-base leading-relaxed text-white/85">
                  A wedding in Ibadan, a gallery opening, a first date. Tell our stylist the occasion and get the full look, from fabric to finishing touch.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-body text-sm font-semibold text-black transition-transform group-hover:translate-x-1">
                  Get styled <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </section>

          {/* ── Newsletter ── */}
          <section className="mt-16 md:mt-24">
            <LeadGenWidget variant="banner" />
          </section>

          {/* ── Editor's picks ── */}
          {editorials.length > 0 && (
            <section className="mt-16 md:mt-24">
              <SectionHeader eyebrow="Long reads" title="Editor's Picks" link={{ to: "/editorials", label: "All editorials" }} />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {editorials.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link
                      to={hrefFor(t)}
                      className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-surface shadow-soft transition-shadow hover:shadow-lift"
                    >
                      <img
                        src={imageFor(t)}
                        alt={t.headline}
                        loading="lazy"
                        onError={fallbackTo(t.category)}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                        <CategoryChip category={t.category} variant="solid" />
                        {paywalledCategories.includes(t.category) && (
                          <span className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-gold backdrop-blur-md">
                            <Lock className="h-3 w-3" /> Insider
                          </span>
                        )}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-6">
                        <h3 className="font-display text-2xl italic leading-tight text-white md:text-[1.7rem]">{t.headline}</h3>
                        <span className="mt-4 inline-flex items-center gap-1.5 font-body text-xs font-semibold text-white/90">
                          Read the editorial <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>

        <FeaturedProducts />
        <MembershipCTA />
      </main>

      <Footer />
    </div>
  );
};

export default Index;

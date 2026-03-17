import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCategoryImage } from "@/lib/categoryImages";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import TrendCard from "@/components/TrendCard";
import ImageCarousel from "@/components/ImageCarousel";
import LeadGenWidget from "@/components/LeadGenWidget";
import Paywall from "@/components/Paywall";
import { Skeleton } from "@/components/ui/skeleton";
import { linkifyText } from "@/lib/linkify";

const urgencyStyles: Record<string, string> = {
  Breaking: "urgency-breaking",
  Emerging: "urgency-emerging",
  "Slow-Burn": "urgency-slowburn",
};

const geoStyles: Record<string, string> = {
  Africa: "geo-africa",
  Diaspora: "geo-diaspora",
  Global: "geo-global",
};

function extractPullQuote(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const candidates = sentences.filter((s) => s.length > 30 && s.length < 160);
  return candidates.length > 0 ? candidates[candidates.length - 1] : sentences[0];
}

const TrendDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: trend, isLoading } = useQuery({
    queryKey: ["trend-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trends")
        .select("*")
        .eq("id", id!)
        .eq("published", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: relatedTrends = [] } = useQuery({
    queryKey: ["related-trends", trend?.category, trend?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trends")
        .select("*")
        .eq("published", true)
        .neq("id", trend!.id)
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!trend,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl px-6 pt-24">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!trend) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
          <h1 className="font-display text-3xl font-bold text-foreground">Story Not Found</h1>
          <p className="mt-3 font-body text-muted-foreground">
            This piece may have been archived or removed.
          </p>
          <Link to="/" className="mt-6 font-body text-sm font-medium text-gold transition-colors hover:text-terracotta">
            ← Return to Afrivogue Feed
          </Link>
        </div>
      </div>
    );
  }

  const pullQuote = extractPullQuote(trend.cultural_significance);
  const sentences = trend.cultural_significance.split(/(?<=[.!?])\s+/);
  const midpoint = Math.ceil(sentences.length / 2);
  const firstHalf = sentences.slice(0, midpoint).join(" ");
  const secondHalf = sentences.slice(midpoint).join(" ");

  const featuredImage = trend.featured_image_url || getCategoryImage(trend.category);
  const images = Array.isArray(trend.images) ? (trend.images as string[]) : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero with featured image */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <img
            src={featuredImage}
            alt={trend.headline}
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-24 md:px-16 lg:pt-32">
          <Link
            to="/"
            className="mb-8 inline-block font-body text-xs font-medium uppercase tracking-[0.2em] text-gold transition-colors hover:text-terracotta"
          >
            ← Afrivogue Feed
          </Link>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className={`rounded-sm px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider ${urgencyStyles[trend.urgency]}`}>
              {trend.urgency}
            </span>
            <span className={`rounded-sm px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider ${geoStyles[trend.geo_relevance]}`}>
              {trend.geo_relevance}
            </span>
            <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">
              {trend.category}
            </span>
            <span className="font-body text-[10px] italic tracking-wide text-gold/70">
              {trend.content_tier}
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
            {trend.headline}
          </h1>

          <div className="mt-6 flex items-center gap-4">
            <time className="font-body text-sm text-muted-foreground">
              {new Date(trend.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </time>
            <span className="h-px flex-1 bg-border" />
            <Link
              to={`/story/${trend.id}`}
              className="flex items-center gap-2 rounded-sm border border-gold/30 px-4 py-2 font-body text-xs font-medium uppercase tracking-[0.15em] text-gold transition-all hover:border-gold hover:bg-gold hover:text-primary-foreground"
            >
              ◆ Story Mode
            </Link>
          </div>
        </div>
      </header>

      {/* Article body */}
      <article className="mx-auto max-w-4xl px-6 py-16 md:px-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
          <div className="space-y-10">
            <p className="font-display text-xl leading-relaxed text-foreground/90 md:text-2xl">
              {linkifyText(firstHalf)}
            </p>

            {/* Image carousel if post has images */}
            {images.length > 0 && <ImageCarousel images={images} alt={trend.headline} />}

            <blockquote className="relative border-l-2 border-gold py-4 pl-8">
              <span className="absolute -left-3 -top-2 font-display text-5xl leading-none text-gold/30">"</span>
              <p className="font-display text-lg italic leading-relaxed text-foreground/80 md:text-xl">
                {pullQuote}
              </p>
            </blockquote>

            {secondHalf && (
              <p className="font-body text-base leading-[1.85] text-muted-foreground">
                {linkifyText(secondHalf)}
              </p>
            )}

            {/* Source attribution */}
            {trend.source_name && (
              <div className="rounded-sm border border-border bg-card/50 px-4 py-3">
                <p className="font-body text-xs text-muted-foreground">
                  <span className="font-bold uppercase tracking-wider text-gold/70">Source:</span>{" "}
                  {trend.source_url ? (
                    <a href={trend.source_url} target="_blank" rel="noopener noreferrer" className="text-gold underline transition-colors hover:text-foreground">
                      {trend.source_name}
                    </a>
                  ) : (
                    <span className="text-foreground">{trend.source_name}</span>
                  )}
                </p>
              </div>
            )}

            {/* Lead gen inline */}
            <LeadGenWidget variant="banner" category={trend.category} />

            {/* Cultural Context */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.15em] text-gold">
                Cultural Context
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Geographic Scope</span>
                  <p className="mt-1 font-body text-sm text-foreground">{trend.geo_relevance}</p>
                </div>
                <div>
                  <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Category</span>
                  <p className="mt-1 font-body text-sm text-foreground">{trend.category}</p>
                </div>
                <div>
                  <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Signal Strength</span>
                  <p className="mt-1 font-body text-sm text-foreground">{trend.urgency}</p>
                </div>
                <div>
                  <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Editorial Format</span>
                  <p className="mt-1 font-body text-sm text-foreground">{trend.content_tier}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden space-y-8 lg:block">
            <div className="sticky top-8 space-y-8">
              <div className="border-t border-gold pt-4">
                <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-gold">
                  Signal Classification
                </h4>
                <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">
                  This trend has been classified as{" "}
                  <span className="text-foreground">{trend.urgency}</span> with{" "}
                  <span className="text-foreground">{trend.geo_relevance}</span> relevance, filed
                  under <span className="text-foreground">{trend.content_tier}</span>.
                </p>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Filed Under
                </h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-sm border border-border px-2 py-1 font-body text-[10px] uppercase tracking-wider text-muted-foreground">{trend.category}</span>
                  <span className="rounded-sm border border-border px-2 py-1 font-body text-[10px] uppercase tracking-wider text-muted-foreground">{trend.geo_relevance}</span>
                  <span className="rounded-sm border border-border px-2 py-1 font-body text-[10px] uppercase tracking-wider text-muted-foreground">{trend.urgency}</span>
                </div>
              </div>

              {/* Sidebar lead gen */}
              <LeadGenWidget variant="sidebar" category={trend.category} />
            </div>
          </aside>
        </div>
      </article>

      {/* Related trends */}
      {relatedTrends.length > 0 && (
        <section className="border-t border-border px-6 py-16 md:px-16 lg:px-24">
          <h2 className="mb-10 font-display text-2xl font-bold text-foreground md:text-3xl">
            More from Afrivogue
          </h2>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedTrends.map((t, i) => (
              <TrendCard key={t.id} trend={t} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border px-6 py-10 md:px-16 lg:px-24">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="font-display text-lg font-bold text-foreground">
            AFRI<span className="text-gold">VOGUE</span>
          </div>
          <p className="font-body text-xs text-muted-foreground">
            © 2026 Afrivogue. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TrendDetail;

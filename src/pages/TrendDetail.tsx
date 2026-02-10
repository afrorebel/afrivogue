import { useParams, Link } from "react-router-dom";
import { trends } from "@/lib/trendData";
import type { Trend } from "@/lib/trendData";
import Navbar from "@/components/Navbar";
import TrendCard from "@/components/TrendCard";

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
  // Pick the most impactful sentence (usually the shortest declarative one or the last)
  const candidates = sentences.filter((s) => s.length > 30 && s.length < 160);
  return candidates.length > 0 ? candidates[candidates.length - 1] : sentences[0];
}

function getRelatedTrends(current: Trend): Trend[] {
  // Prioritize same category, then same geo, exclude self
  const others = trends.filter((t) => t.id !== current.id);
  const sameCategory = others.filter((t) => t.category === current.category);
  const sameGeo = others.filter(
    (t) => t.geoRelevance === current.geoRelevance && t.category !== current.category
  );
  const related = [...sameCategory, ...sameGeo];
  // Deduplicate and limit to 3
  const seen = new Set<string>();
  const result: Trend[] = [];
  for (const t of related) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      result.push(t);
    }
    if (result.length >= 3) break;
  }
  // Fill with any remaining if needed
  if (result.length < 3) {
    for (const t of others) {
      if (!seen.has(t.id)) {
        result.push(t);
        seen.add(t.id);
      }
      if (result.length >= 3) break;
    }
  }
  return result;
}

const TrendDetail = () => {
  const { id } = useParams<{ id: string }>();
  const trend = trends.find((t) => t.id === id);

  if (!trend) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
          <h1 className="font-display text-3xl font-bold text-foreground">Story Not Found</h1>
          <p className="mt-3 font-body text-muted-foreground">
            This piece may have been archived or removed.
          </p>
          <Link
            to="/"
            className="mt-6 font-body text-sm font-medium text-gold transition-colors hover:text-terracotta"
          >
            ← Return to Intelligence Feed
          </Link>
        </div>
      </div>
    );
  }

  const pullQuote = extractPullQuote(trend.culturalSignificance);
  const related = getRelatedTrends(trend);

  // Split the cultural significance into paragraphs for editorial feel
  const sentences = trend.culturalSignificance.split(/(?<=[.!?])\s+/);
  const midpoint = Math.ceil(sentences.length / 2);
  const firstHalf = sentences.slice(0, midpoint).join(" ");
  const secondHalf = sentences.slice(midpoint).join(" ");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero header */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-24 md:px-16 lg:pt-32">
          {/* Breadcrumb */}
          <Link
            to="/"
            className="mb-8 inline-block font-body text-xs font-medium uppercase tracking-[0.2em] text-gold transition-colors hover:text-terracotta"
          >
            ← Intelligence Feed
          </Link>

          {/* Meta badges */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-sm px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider ${urgencyStyles[trend.urgency]}`}
            >
              {trend.urgency}
            </span>
            <span
              className={`rounded-sm px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider ${geoStyles[trend.geoRelevance]}`}
            >
              {trend.geoRelevance}
            </span>
            <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">
              {trend.category}
            </span>
            <span className="font-body text-[10px] italic tracking-wide text-gold/70">
              {trend.contentTier}
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-3xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
            {trend.headline}
          </h1>

          {/* Date */}
          <div className="mt-6 flex items-center gap-4">
            <time className="font-body text-sm text-muted-foreground">{trend.timestamp}</time>
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
          {/* Main column */}
          <div className="space-y-10">
            {/* Lede */}
            <p className="font-display text-xl leading-relaxed text-foreground/90 md:text-2xl">
              {firstHalf}
            </p>

            {/* Pull quote */}
            <blockquote className="relative border-l-2 border-gold py-4 pl-8">
              <span className="absolute -left-3 -top-2 font-display text-5xl leading-none text-gold/30">
                "
              </span>
              <p className="font-display text-lg italic leading-relaxed text-foreground/80 md:text-xl">
                {pullQuote}
              </p>
            </blockquote>

            {/* Second half */}
            {secondHalf && (
              <p className="font-body text-base leading-[1.85] text-muted-foreground">
                {secondHalf}
              </p>
            )}

            {/* Editorial context section */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.15em] text-gold">
                Cultural Context
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">
                    Geographic Scope
                  </span>
                  <p className="mt-1 font-body text-sm text-foreground">{trend.geoRelevance}</p>
                </div>
                <div>
                  <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">
                    Sector
                  </span>
                  <p className="mt-1 font-body text-sm text-foreground">{trend.category}</p>
                </div>
                <div>
                  <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">
                    Signal Strength
                  </span>
                  <p className="mt-1 font-body text-sm text-foreground">{trend.urgency}</p>
                </div>
                <div>
                  <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">
                    Editorial Format
                  </span>
                  <p className="mt-1 font-body text-sm text-foreground">{trend.contentTier}</p>
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
                  This intelligence has been classified as{" "}
                  <span className="text-foreground">{trend.urgency}</span> with{" "}
                  <span className="text-foreground">{trend.geoRelevance}</span> relevance, filed
                  under <span className="text-foreground">{trend.contentTier}</span>.
                </p>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Filed Under
                </h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-sm border border-border px-2 py-1 font-body text-[10px] uppercase tracking-wider text-muted-foreground">
                    {trend.category}
                  </span>
                  <span className="rounded-sm border border-border px-2 py-1 font-body text-[10px] uppercase tracking-wider text-muted-foreground">
                    {trend.geoRelevance}
                  </span>
                  <span className="rounded-sm border border-border px-2 py-1 font-body text-[10px] uppercase tracking-wider text-muted-foreground">
                    {trend.urgency}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </article>

      {/* Related trends */}
      <section className="border-t border-border px-6 py-16 md:px-16 lg:px-24">
        <h2 className="mb-10 font-display text-2xl font-bold text-foreground md:text-3xl">
          Related Intelligence
        </h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {related.map((t, i) => (
            <TrendCard key={t.id} trend={t} index={i} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-10 md:px-16 lg:px-24">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="font-display text-lg font-bold text-foreground">
            AFRI<span className="text-gold">VOGUE</span>
          </div>
          <p className="font-body text-xs text-muted-foreground">
            © 2026 Afrivogue. Global Trend Intelligence Engine.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TrendDetail;

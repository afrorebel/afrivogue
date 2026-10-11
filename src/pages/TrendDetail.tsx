import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCategoryImage } from "@/lib/categoryImages";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShareButtons from "@/components/ShareButtons";
import StickyShareButtons from "@/components/StickyShareButtons";
import RelatedContent from "@/components/RelatedContent";
import ImageCarousel from "@/components/ImageCarousel";
import LeadGenWidget from "@/components/LeadGenWidget";
import Paywall from "@/components/Paywall";
import Comments from "@/components/Comments";
import { Skeleton } from "@/components/ui/skeleton";
import { linkifyText } from "@/lib/linkify";
import type { Json } from "@/integrations/supabase/types";
import DOMPurify from "dompurify";
import { Clock, Sparkles } from "lucide-react";

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

interface EditorialContent {
  body?: string;
  dek?: string;
  key_takeaways?: string[];
  why_it_matters?: string;
  sources?: { title: string; url: string }[];
  reading_minutes?: number;
}

// Editorial HTML can come from the admin editor or the AI pipeline; strip anything executable.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
    node.setAttribute("rel", "noopener noreferrer");
  }
});
const sanitizeEditorialHtml = (html: string) =>
  DOMPurify.sanitize(html, { ADD_ATTR: ["target"], FORBID_TAGS: ["style", "form", "input", "iframe"] });

const TrendDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { subscribed, isAdmin } = useAuth();

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

  const { data: paywalledCategories = [] } = useQuery({
    queryKey: ["paywalled-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "paywalled_categories")
        .maybeSingle();
      if (error) throw error;
      return (data?.value as unknown as string[]) || [];
    },
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

  // Long-form editorials (from the editor or the Claude pipeline) store HTML plus extras.
  const editorialContent = trend.editorial_content as EditorialContent | null;
  const hasRichContent = !!editorialContent?.body && editorialContent.body.includes("<");
  const safeBody = hasRichContent ? sanitizeEditorialHtml(editorialContent!.body!) : "";
  const takeaways = editorialContent?.key_takeaways?.filter(Boolean) ?? [];
  const sources = editorialContent?.sources?.filter((src) => /^https?:\/\//.test(src.url)) ?? [];

  const pullQuote = extractPullQuote(trend.cultural_significance);
  const paragraphs = trend.cultural_significance.includes("\n\n")
    ? trend.cultural_significance.split(/\n\n+/).filter((p) => p.trim())
    : (() => {
        const sentences = trend.cultural_significance.split(/(?<=[.!?])\s+/);
        const mid = Math.ceil(sentences.length / 2);
        return [sentences.slice(0, mid).join(" "), sentences.slice(mid).join(" ")].filter(Boolean);
      })();

  const featuredImage = trend.featured_image_url || getCategoryImage(trend.category);
  const images = Array.isArray(trend.images) ? (trend.images as string[]) : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <StickyShareButtons title={trend.headline} />

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
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-24 md:px-8 lg:pt-32">
          <Link
            to="/"
            className="mb-8 inline-block font-body text-xs font-medium uppercase tracking-[0.2em] text-gold transition-colors hover:text-terracotta"
          >
            ← Afrivogue Feed
          </Link>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider ${urgencyStyles[trend.urgency]}`}>
              {trend.urgency}
            </span>
            <span className={`rounded-full px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider ${geoStyles[trend.geo_relevance]}`}>
              {trend.geo_relevance}
            </span>
            <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">
              {trend.category}
            </span>
            <span className="font-body text-[10px] italic tracking-wide text-gold/70">
              {trend.content_tier}
            </span>
          </div>

          <h1 className="font-display text-4xl italic leading-[1.05] text-foreground md:text-6xl">
            {trend.headline}
          </h1>
          {editorialContent?.dek && (
            <p className="mt-5 max-w-3xl font-display text-xl leading-relaxed text-foreground/80 md:text-2xl">
              {editorialContent.dek}
            </p>
          )}

          <div className="mt-6 flex items-center gap-4">
            <time className="font-body text-sm text-muted-foreground">
              {new Date(trend.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </time>
            {editorialContent?.reading_minutes && (
              <span className="flex items-center gap-1.5 font-body text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> {editorialContent.reading_minutes} min read
              </span>
            )}
            <span className="h-px flex-1 bg-border" />
            <ShareButtons title={trend.headline} />
            <Link
              to={`/story/${trend.id}`}
              className="flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 font-body text-xs font-medium uppercase tracking-[0.15em] text-gold transition-all hover:border-gold hover:bg-gold hover:text-primary-foreground"
            >
              ◆ Story Mode
            </Link>
          </div>
        </div>
      </header>

      {/* Article body */}
      {(trend.members_only || paywalledCategories.includes(trend.category)) && !subscribed && !isAdmin ? (
        <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
          <Paywall previewContent={trend.cultural_significance} />
        </div>
      ) : (
      <article className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10">
            {hasRichContent ? (
              /* Long-form editorial */
              <>
                {takeaways.length > 0 && (
                  <aside className="rounded-3xl border border-gold/25 bg-sunset p-6 md:p-8">
                    <p className="mb-4 flex items-center gap-2 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                      <Sparkles className="h-3.5 w-3.5" /> Key takeaways
                    </p>
                    <ul className="space-y-3">
                      {takeaways.map((t) => (
                        <li key={t} className="flex gap-3 font-body text-base leading-relaxed text-foreground">
                          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </aside>
                )}

                <div
                  className="prose prose-lg max-w-[46rem] prose-li:text-foreground/85 prose-li:marker:text-gold [&_blockquote_p]:!font-display [&_blockquote_p]:!text-2xl md:[&_blockquote_p]:!text-3xl [&_blockquote_p]:!italic [&_blockquote_p]:!leading-snug [&_blockquote_p]:!text-foreground
                    prose-headings:font-display prose-headings:font-normal prose-headings:italic prose-headings:text-foreground
                    prose-h2:mt-14 prose-h2:text-3xl md:prose-h2:text-4xl
                    prose-p:font-body prose-p:text-[1.075rem] prose-p:leading-[1.9] prose-p:text-foreground/85
                    prose-a:text-gold prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:my-10 prose-blockquote:border-l-4 prose-blockquote:border-gold prose-blockquote:pl-6
                    prose-blockquote:font-display prose-blockquote:text-2xl prose-blockquote:not-italic prose-blockquote:leading-snug prose-blockquote:text-foreground
                    prose-em:text-foreground prose-strong:text-foreground
                    prose-img:rounded-2xl"
                  dangerouslySetInnerHTML={{ __html: safeBody }}
                />

                {editorialContent?.why_it_matters && (
                  <aside className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
                    <p className="mb-3 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Why it matters</p>
                    <p className="font-display text-xl leading-relaxed text-foreground">{editorialContent.why_it_matters}</p>
                  </aside>
                )}

                {images.length > 0 && <ImageCarousel images={images} alt={trend.headline} />}

                {sources.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card/50 p-5">
                    <p className="mb-3 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sources</p>
                    <ul className="space-y-2">
                      {sources.map((src) => (
                        <li key={src.url} className="font-body text-sm">
                          <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                            {src.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              /* Fallback: render plain text cultural_significance */
              <>
                {paragraphs.length > 0 && (
                  <p className="font-display text-xl leading-relaxed text-foreground/90 md:text-2xl">
                    {linkifyText(paragraphs[0])}
                  </p>
                )}

                {images.length > 0 && <ImageCarousel images={images} alt={trend.headline} />}

                <blockquote className="relative border-l-2 border-gold py-4 pl-8">
                  <span className="absolute -left-3 -top-2 font-display text-5xl leading-none text-gold/30">"</span>
                  <p className="font-display text-lg italic leading-relaxed text-foreground/80 md:text-xl">
                    {pullQuote}
                  </p>
                </blockquote>

                {paragraphs.slice(1).map((para, i) => (
                  <p key={i} className="font-body text-base leading-[1.9] text-muted-foreground">
                    {linkifyText(para)}
                  </p>
                ))}
              </>
            )}

            {/* Source attribution (long-form editorials list their sources above) */}
            {trend.source_name && sources.length === 0 && (
              <div className="rounded-2xl border border-border bg-card/50 px-5 py-4">
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

            <LeadGenWidget variant="inline" category={trend.category} />

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
                  <span className="rounded-full border border-border px-2 py-1 font-body text-[10px] uppercase tracking-wider text-muted-foreground">{trend.category}</span>
                  <span className="rounded-full border border-border px-2 py-1 font-body text-[10px] uppercase tracking-wider text-muted-foreground">{trend.geo_relevance}</span>
                  <span className="rounded-full border border-border px-2 py-1 font-body text-[10px] uppercase tracking-wider text-muted-foreground">{trend.urgency}</span>
                </div>
              </div>

              <LeadGenWidget variant="sidebar" category={trend.category} />
            </div>
          </aside>
        </div>

        <Comments trendId={trend.id} />
      </article>
      )}

      <RelatedContent
        currentId={trend.id}
        category={trend.category}
        geoRelevance={trend.geo_relevance}
      />

      <Footer />
    </div>
  );
};

export default TrendDetail;

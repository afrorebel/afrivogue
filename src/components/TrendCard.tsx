import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { getCategoryImage } from "@/lib/categoryImages";

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

export interface TrendCardData {
  id: string;
  headline: string;
  cultural_significance?: string;
  culturalSignificance?: string;
  geo_relevance?: string;
  geoRelevance?: string;
  urgency: string;
  category: string;
  content_tier?: string;
  contentTier?: string;
  created_at?: string;
  timestamp?: string;
  image_hint?: string | null;
  imageHint?: string;
  featured_image_url?: string | null;
  source_name?: string | null;
  members_only?: boolean;
}

interface TrendCardProps {
  trend: TrendCardData;
  index: number;
  isPaywalled?: boolean;
}

const TrendCard = ({ trend, index, isPaywalled = false }: TrendCardProps) => {
  const showLock = trend.members_only || isPaywalled;
  const significance = trend.cultural_significance || trend.culturalSignificance || "";
  const geo = trend.geo_relevance || trend.geoRelevance || "";
  const tier = trend.content_tier || trend.contentTier || "";
  const date = trend.created_at || trend.timestamp || "";
  const displayDate = date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";

  // Use featured image if available, fall back to category image
  const imageUrl = (trend.featured_image_url && trend.featured_image_url.trim() !== "") ? trend.featured_image_url : getCategoryImage(trend.category);

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:border-gold/40 hover:shadow-[0_0_30px_-10px_hsl(var(--gold)/0.15)] animate-fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Featured Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={trend.headline}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        {showLock && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-sm bg-gold/90 px-2 py-1 backdrop-blur-sm">
            <Lock className="h-3 w-3 text-background" />
            <span className="font-body text-[10px] font-bold uppercase tracking-wider text-background">Premium</span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-sm px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${urgencyStyles[trend.urgency] || ""}`}>
            {trend.urgency}
          </span>
          <span className={`rounded-sm px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${geoStyles[geo] || ""}`}>
            {geo}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-body text-[10px] italic tracking-wide text-gold/70">
            {tier}
          </span>
          <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">
            {trend.category}
          </span>
        </div>

      <Link to={`/trend/${trend.id}`}>
          <h3 className="mb-3 font-display text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-gold md:text-2xl">
            {trend.headline}
          </h3>
        </Link>

        <p className="flex-1 font-body text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {significance}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div className="flex flex-col gap-1">
            <time className="font-body text-xs text-muted-foreground">{displayDate}</time>
            {trend.source_name && (
              <span className="font-body text-[10px] text-muted-foreground/60">
                via {trend.source_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {tier === "Premium Long-Form" && (
              <Link to={`/editorial/${trend.id}`} className="font-body text-[10px] font-bold uppercase tracking-wider text-gold/70 transition-colors hover:text-gold">
                ◆ Editorial
              </Link>
            )}
            {tier === "Cultural Forecast" && (
              <Link to="/forecast" className="font-body text-[10px] font-bold uppercase tracking-wider text-gold/70 transition-colors hover:text-gold">
                ◇ Forecast
              </Link>
            )}
            <Link to={`/trend/${trend.id}`} className="font-body text-xs font-medium text-gold transition-transform group-hover:translate-x-1">
              Read more →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export default TrendCard;

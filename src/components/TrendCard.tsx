import type { Trend } from "@/lib/trendData";

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

interface TrendCardProps {
  trend: Trend;
  index: number;
}

const TrendCard = ({ trend, index }: TrendCardProps) => {
  return (
    <article
      className="group flex flex-col rounded-lg border border-border bg-card p-6 transition-all duration-300 hover:border-gold/40 hover:shadow-[0_0_30px_-10px_hsl(var(--gold)/0.15)] animate-fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-sm px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider ${urgencyStyles[trend.urgency]}`}>
          {trend.urgency}
        </span>
        <span className={`rounded-sm px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider ${geoStyles[trend.geoRelevance]}`}>
          {trend.geoRelevance}
        </span>
        <span className="ml-auto font-body text-[10px] uppercase tracking-wider text-muted-foreground">
          {trend.category}
        </span>
      </div>

      <h3 className="mb-3 font-display text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-gold md:text-2xl">
        {trend.headline}
      </h3>

      <p className="flex-1 font-body text-sm leading-relaxed text-muted-foreground">
        {trend.culturalSignificance}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <time className="font-body text-xs text-muted-foreground">{trend.timestamp}</time>
        <span className="font-body text-xs font-medium text-gold transition-transform group-hover:translate-x-1">
          Read more →
        </span>
      </div>
    </article>
  );
};

export default TrendCard;

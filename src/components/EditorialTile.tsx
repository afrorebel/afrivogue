import { Link } from "react-router-dom";
import { ArrowUpRight, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { getCategoryImage } from "@/lib/categoryImages";
import CategoryChip from "@/components/editorial/CategoryChip";
import type { TrendCardData } from "@/components/TrendCard";

interface EditorialTileProps {
  trend: TrendCardData;
  index: number;
  isPaywalled?: boolean;
  /** legacy sizing hint; prefer `aspect` */
  size?: "lead" | "mood" | "tall";
  /** Tailwind aspect class for the image, e.g. "aspect-[3/4]" */
  aspect?: string;
  /** show the two-line excerpt under the headline */
  showExcerpt?: boolean;
}

const aspectBySize: Record<string, string> = {
  lead: "aspect-[4/5]",
  mood: "aspect-[4/5]",
  tall: "aspect-[2/3]",
};

/** Varied image ratios give masonry grids their Pinterest rhythm. */
export const MASONRY_ASPECTS = ["aspect-[3/4]", "aspect-[4/5]", "aspect-square", "aspect-[2/3]", "aspect-[4/5]", "aspect-[3/4]", "aspect-[5/6]"];

/** Strips markdown links and bare URLs so card excerpts read as clean prose. */
export const plainExcerpt = (text: string) =>
  text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\(?https?:\/\/\S+\)?/g, "")
    .replace(/[*_`]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

const EditorialTile = ({ trend, index, isPaywalled, size = "mood", aspect, showExcerpt = true }: EditorialTileProps) => {
  const image =
    trend.featured_image_url && trend.featured_image_url.trim() !== ""
      ? trend.featured_image_url
      : getCategoryImage(trend.category);

  const excerpt = trend.cultural_significance || trend.culturalSignificance || "";
  const href =
    (trend.content_tier || trend.contentTier) === "Premium Long-Form"
      ? `/editorial/${trend.id}`
      : `/trend/${trend.id}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06 }}
      className="group mb-6 min-w-0 break-inside-avoid"
    >
      <Link
        to={href}
        className="relative block overflow-hidden rounded-2xl bg-surface shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
      >
        <img
          src={image}
          alt={trend.headline}
          loading="lazy"
          onError={(e) => {
            // Remote images can disappear or block hotlinking — fall back to the category art.
            const fallback = getCategoryImage(trend.category);
            if (!e.currentTarget.src.endsWith(fallback)) e.currentTarget.src = fallback;
          }}
          className={`w-full ${aspect || aspectBySize[size]} object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]`}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/0 to-black/10 opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
        <CategoryChip category={trend.category} variant="solid" className="absolute left-3 top-3" />
        {isPaywalled && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-gold backdrop-blur-md">
            <Lock className="h-3 w-3" /> Members
          </span>
        )}
        <span className="absolute bottom-3 right-3 flex translate-y-2 items-center gap-1 rounded-full bg-white px-3.5 py-1.5 font-body text-xs font-semibold text-neutral-900 opacity-0 shadow-soft transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Read story <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </Link>

      <div className="px-1 pt-3.5">
        <h3 className="font-display text-lg leading-snug text-foreground transition-colors line-clamp-3 group-hover:text-gold md:text-xl">
          <Link to={href}>{trend.headline}</Link>
        </h3>
        <p className="mt-1.5 font-body text-xs text-muted-foreground">
          {formatDate(trend.created_at || trend.timestamp)}
          {trend.urgency && <> · {trend.urgency}</>}
        </p>
        {showExcerpt && excerpt && (
          <div className="mt-2 hidden sm:block">
            <p className="font-body text-sm leading-relaxed text-muted-foreground/90 line-clamp-2">{plainExcerpt(excerpt)}</p>
          </div>
        )}
      </div>
    </motion.article>
  );
};

export default EditorialTile;

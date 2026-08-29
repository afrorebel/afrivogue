import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { getCategoryImage } from "@/lib/categoryImages";
import type { TrendCardData } from "@/components/TrendCard";

interface EditorialTileProps {
  trend: TrendCardData;
  index: number;
  isPaywalled?: boolean;
  /** visual weight of the tile within the moodboard grid */
  size?: "lead" | "mood" | "tall";
}

const aspectBySize: Record<string, string> = {
  lead: "aspect-[3/4]",
  mood: "aspect-[4/5]",
  tall: "aspect-[9/16]",
};

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase()
    : "";

const EditorialTile = ({ trend, index, isPaywalled, size = "mood" }: EditorialTileProps) => {
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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08 }}
      className="group flex flex-col"
    >
      <Link to={href} className="relative mb-6 block overflow-hidden">
        <img
          src={image}
          alt={trend.headline}
          loading="lazy"
          className={`w-full ${aspectBySize[size]} bg-surface object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105`}
        />
        <span className="absolute left-4 top-4 bg-gold px-3 py-1 font-body text-[8px] font-bold uppercase tracking-[0.2em] text-primary-foreground">
          {trend.category}
        </span>
        {isPaywalled && (
          <span className="absolute right-4 top-4 flex items-center gap-1 bg-background/80 px-2 py-1 font-body text-[8px] uppercase tracking-[0.2em] text-gold backdrop-blur-sm">
            <Lock className="h-3 w-3" /> Members
          </span>
        )}
      </Link>

      <span className="mb-3 font-body text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
        {formatDate(trend.created_at || trend.timestamp)} &mdash; {trend.urgency}
      </span>

      <h3
        className={`font-display italic leading-tight text-foreground transition-colors group-hover:text-gold ${
          size === "lead" ? "mb-5 text-3xl md:text-4xl" : "mb-4 text-2xl"
        }`}
      >
        <Link to={href}>{trend.headline}</Link>
      </h3>

      {size !== "lead" && <div className="mb-4 h-px w-8 bg-gold" />}

      <p
        className={`font-body font-light leading-relaxed text-muted-foreground ${
          size === "lead" ? "mb-8 max-w-md text-sm" : "text-xs"
        } line-clamp-3`}
      >
        {excerpt}
      </p>

      {size === "lead" && (
        <Link
          to={href}
          className="w-fit border-b border-border pb-1 font-body text-[9px] uppercase tracking-[0.3em] text-foreground transition-colors hover:border-gold hover:text-gold"
        >
          Read Article
        </Link>
      )}
    </motion.article>
  );
};

export default EditorialTile;

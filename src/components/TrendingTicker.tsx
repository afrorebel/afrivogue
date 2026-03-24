import { Link } from "react-router-dom";
import { useTrends } from "@/hooks/useTrends";
import { motion } from "framer-motion";

const TrendingTicker = () => {
  const { data: trends } = useTrends();

  const breaking = trends?.filter((t) => t.urgency === "Breaking").slice(0, 6) ?? [];
  const items = breaking.length > 0 ? breaking : trends?.slice(0, 5) ?? [];

  if (items.length === 0) return null;

  // Double items for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-b border-border bg-card/50 py-2.5">
      <div className="flex items-center">
        <span className="z-10 shrink-0 bg-card/50 px-4 font-body text-[10px] font-bold uppercase tracking-[0.2em] text-gold backdrop-blur-sm md:px-6">
          <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
          Trending
        </span>

        <div className="relative flex-1 overflow-hidden">
          <motion.div
            className="flex whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: items.length * 8, repeat: Infinity, ease: "linear" }}
          >
            {doubled.map((t, i) => (
              <Link
                key={`${t.id}-${i}`}
                to={`/trend/${t.id}`}
                className="mx-6 inline-block shrink-0 font-body text-xs text-muted-foreground transition-colors hover:text-gold"
              >
                <span className="mr-2 text-[10px] text-gold/50">◆</span>
                {t.headline}
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TrendingTicker;

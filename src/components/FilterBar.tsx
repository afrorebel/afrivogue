import { useState } from "react";
import { categories, urgencyLevels, geoOptions, contentTiers } from "@/lib/trendData";
import type { Category, Urgency, GeoRelevance, ContentTier } from "@/lib/trendData";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FilterBarProps {
  activeCategory: Category | "All";
  activeUrgency: Urgency | "All";
  activeGeo: GeoRelevance | "All";
  activeContentTier: ContentTier | "All";
  onCategoryChange: (c: Category | "All") => void;
  onUrgencyChange: (u: Urgency | "All") => void;
  onGeoChange: (g: GeoRelevance | "All") => void;
  onContentTierChange: (t: ContentTier | "All") => void;
}

type FilterKey = "category" | "urgency" | "region" | "format";

const FilterBar = ({
  activeCategory,
  activeUrgency,
  activeGeo,
  activeContentTier,
  onCategoryChange,
  onUrgencyChange,
  onGeoChange,
  onContentTierChange,
}: FilterBarProps) => {
  const [open, setOpen] = useState<FilterKey | null>(null);

  const toggle = (key: FilterKey) => setOpen(open === key ? null : key);

  const pill = (active: boolean) =>
    `cursor-pointer rounded-sm border px-3 py-1.5 font-body text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
      active
        ? "border-gold bg-gold text-primary-foreground"
        : "border-border bg-transparent text-muted-foreground hover:border-gold/40 hover:text-foreground"
    }`;

  const headerBtn = (key: FilterKey, label: string, activeValue: string) => (
    <button
      onClick={() => toggle(key)}
      className="flex items-center gap-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground/80 hover:text-foreground transition-colors"
    >
      <span>{label}</span>
      {activeValue !== "All" && (
        <span className="rounded-sm bg-gold/20 px-1.5 py-0.5 text-[10px] text-gold">{activeValue}</span>
      )}
      <ChevronDown
        className={`h-3 w-3 transition-transform duration-200 ${open === key ? "rotate-180" : ""}`}
      />
    </button>
  );

  return (
    <div className="px-6 md:px-16 lg:px-24 space-y-2">
      {/* Single-line filter headers */}
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        {headerBtn("category", "Category", activeCategory)}
        <span className="hidden md:block h-4 w-px bg-border" />
        {headerBtn("urgency", "Urgency", activeUrgency)}
        <span className="hidden md:block h-4 w-px bg-border" />
        {headerBtn("region", "Region", activeGeo)}
        <span className="hidden md:block h-4 w-px bg-border" />
        {headerBtn("format", "Format", activeContentTier)}
      </div>

      {/* Expandable filter options */}
      <AnimatePresence>
        {open && (
          <motion.div
            key={open}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 pt-2 pb-1">
              {open === "category" && (
                <>
                  <button className={pill(activeCategory === "All")} onClick={() => onCategoryChange("All")}>All</button>
                  {categories.map((c) => (
                    <button key={c} className={pill(activeCategory === c)} onClick={() => onCategoryChange(c)}>{c}</button>
                  ))}
                </>
              )}
              {open === "urgency" && (
                <>
                  <button className={pill(activeUrgency === "All")} onClick={() => onUrgencyChange("All")}>All</button>
                  {urgencyLevels.map((u) => (
                    <button key={u} className={pill(activeUrgency === u)} onClick={() => onUrgencyChange(u)}>{u}</button>
                  ))}
                </>
              )}
              {open === "region" && (
                <>
                  <button className={pill(activeGeo === "All")} onClick={() => onGeoChange("All")}>All</button>
                  {geoOptions.map((g) => (
                    <button key={g} className={pill(activeGeo === g)} onClick={() => onGeoChange(g)}>{g}</button>
                  ))}
                </>
              )}
              {open === "format" && (
                <>
                  <button className={pill(activeContentTier === "All")} onClick={() => onContentTierChange("All")}>All</button>
                  {contentTiers.map((t) => (
                    <button key={t} className={pill(activeContentTier === t)} onClick={() => onContentTierChange(t)}>{t}</button>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterBar;

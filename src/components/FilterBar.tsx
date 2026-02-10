import { categories, urgencyLevels, geoOptions } from "@/lib/trendData";
import type { Category, Urgency, GeoRelevance } from "@/lib/trendData";

interface FilterBarProps {
  activeCategory: Category | "All";
  activeUrgency: Urgency | "All";
  activeGeo: GeoRelevance | "All";
  onCategoryChange: (c: Category | "All") => void;
  onUrgencyChange: (u: Urgency | "All") => void;
  onGeoChange: (g: GeoRelevance | "All") => void;
}

const FilterBar = ({
  activeCategory,
  activeUrgency,
  activeGeo,
  onCategoryChange,
  onUrgencyChange,
  onGeoChange,
}: FilterBarProps) => {
  const pill = (active: boolean) =>
    `cursor-pointer rounded-sm border px-3 py-1.5 font-body text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
      active
        ? "border-gold bg-gold text-primary-foreground"
        : "border-border bg-transparent text-muted-foreground hover:border-gold/40 hover:text-foreground"
    }`;

  return (
    <div className="space-y-4 px-6 md:px-16 lg:px-24">
      {/* Categories */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Sector
        </span>
        <button className={pill(activeCategory === "All")} onClick={() => onCategoryChange("All")}>
          All
        </button>
        {categories.map((c) => (
          <button key={c} className={pill(activeCategory === c)} onClick={() => onCategoryChange(c)}>
            {c}
          </button>
        ))}
      </div>

      {/* Urgency + Geo */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Urgency
          </span>
          <button className={pill(activeUrgency === "All")} onClick={() => onUrgencyChange("All")}>
            All
          </button>
          {urgencyLevels.map((u) => (
            <button key={u} className={pill(activeUrgency === u)} onClick={() => onUrgencyChange(u)}>
              {u}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Region
          </span>
          <button className={pill(activeGeo === "All")} onClick={() => onGeoChange("All")}>
            All
          </button>
          {geoOptions.map((g) => (
            <button key={g} className={pill(activeGeo === g)} onClick={() => onGeoChange(g)}>
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;

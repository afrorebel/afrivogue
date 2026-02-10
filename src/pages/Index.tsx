import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FilterBar from "@/components/FilterBar";
import TrendCard from "@/components/TrendCard";
import { trends } from "@/lib/trendData";
import type { Category, Urgency, GeoRelevance, ContentTier } from "@/lib/trendData";

const Index = () => {
  const [category, setCategory] = useState<Category | "All">("All");
  const [urgency, setUrgency] = useState<Urgency | "All">("All");
  const [geo, setGeo] = useState<GeoRelevance | "All">("All");
  const [contentTier, setContentTier] = useState<ContentTier | "All">("All");

  const filtered = useMemo(() => {
    return trends.filter((t) => {
      if (category !== "All" && t.category !== category) return false;
      if (urgency !== "All" && t.urgency !== urgency) return false;
      if (geo !== "All" && t.geoRelevance !== geo) return false;
      if (contentTier !== "All" && t.contentTier !== contentTier) return false;
      return true;
    });
  }, [category, urgency, geo, contentTier]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      <main className="py-12">
        <FilterBar
          activeCategory={category}
          activeUrgency={urgency}
          activeGeo={geo}
          activeContentTier={contentTier}
          onCategoryChange={setCategory}
          onUrgencyChange={setUrgency}
          onGeoChange={setGeo}
          onContentTierChange={setContentTier}
        />

        <div className="mt-10 grid gap-6 px-6 md:grid-cols-2 md:px-16 lg:px-24 xl:grid-cols-3">
          {filtered.map((trend, i) => (
            <TrendCard key={trend.id} trend={trend} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-16 text-center">
            <p className="font-display text-xl text-muted-foreground">No trends match your filters.</p>
            <p className="mt-2 font-body text-sm text-muted-foreground">Try broadening your selection.</p>
          </div>
        )}

        <footer className="mt-24 border-t border-border px-6 py-10 md:px-16 lg:px-24">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="font-display text-lg font-bold text-foreground">
              AFRI<span className="text-gold">VOGUE</span>
            </div>
            <p className="font-body text-xs text-muted-foreground">
              © 2026 Afrivogue. Global Trend Intelligence Engine.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;

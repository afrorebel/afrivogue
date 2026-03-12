import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, TrendingUp, Globe, Clock, Signal } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown } from "lucide-react";
import {
  forecasts as staticForecasts,
  forecastDomains,
  forecastHorizons,
  signalStrengths,
} from "@/lib/forecastData";
import type {
  CulturalForecast,
  ForecastDomain,
  ForecastHorizon,
  ForecastSignalStrength,
} from "@/lib/forecastData";

/* ─────────────────── signal badge colours ─────────────────── */
const signalBadge: Record<ForecastSignalStrength, string> = {
  Definitive:
    "border-gold/60 bg-gold/10 text-gold",
  "High Confidence":
    "border-terracotta/50 bg-terracotta/10 text-terracotta",
  "Early Signal":
    "border-muted-foreground/40 bg-muted/30 text-muted-foreground",
};

const horizonIcon: Record<ForecastHorizon, React.ReactNode> = {
  "6 Months": <Clock className="h-3 w-3" />,
  "1–2 Years": <TrendingUp className="h-3 w-3" />,
  "3–5 Years": <Globe className="h-3 w-3" />,
};

/* ─────────────────── ambient particles ─────────────────── */
const AmbientField = () => {
  const dots = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2,
        dur: 12 + Math.random() * 18,
        delay: Math.random() * -20,
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute rounded-full bg-gold/15"
          style={{
            width: d.size,
            height: d.size,
            left: `${d.x}%`,
            top: `${d.y}%`,
          }}
          animate={{ y: [0, -40, 0], opacity: [0.1, 0.35, 0.1] }}
          transition={{
            duration: d.dur,
            repeat: Infinity,
            delay: d.delay,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* radial glow */}
      <div
        className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--gold) / 0.12) 0%, transparent 70%)",
        }}
      />
    </div>
  );
};

/* ─────────────────── single forecast card ─────────────────── */
const ForecastCard = ({
  forecast,
  index,
}: {
  forecast: CulturalForecast;
  index: number;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:border-gold/30 hover:shadow-[0_0_40px_-12px_hsl(var(--gold)/0.12)]"
    >
      {/* top accent line */}
      <div className="h-[2px] w-full gradient-gold opacity-50 transition-opacity group-hover:opacity-100" />

      <div className="flex flex-col p-6 sm:p-8">
        {/* meta row */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider ${signalBadge[forecast.signalStrength]}`}
          >
            <Signal className="h-2.5 w-2.5" />
            {forecast.signalStrength}
          </span>
          <span className="flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1 font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {horizonIcon[forecast.horizon]}
            {forecast.horizon}
          </span>
          <span className="ml-auto font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {forecast.domain}
          </span>
        </div>

        {/* title */}
        <h3 className="mb-3 font-display text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-gold sm:text-2xl">
          {forecast.title}
        </h3>

        {/* projection */}
        <p className="font-body text-sm leading-relaxed text-foreground/80">
          {forecast.projection}
        </p>

        {/* expandable sections */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-6 space-y-5 border-t border-border pt-6">
                <div>
                  <h4 className="mb-2 font-body text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                    Evidence
                  </h4>
                  <p className="font-body text-sm leading-relaxed text-muted-foreground">
                    {forecast.evidence}
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-body text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                    Implications
                  </h4>
                  <p className="font-body text-sm leading-relaxed text-muted-foreground">
                    {forecast.implications}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* footer */}
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <span className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">
              {forecast.region}
            </span>
            <span className="text-border">·</span>
            <time className="font-body text-[10px] text-muted-foreground">
              {forecast.publishedDate}
            </time>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="font-body text-xs font-medium text-gold transition-colors hover:text-foreground"
          >
            {expanded ? "Collapse ↑" : "Full Analysis →"}
          </button>
        </div>
      </div>
    </motion.article>
  );
};

/* ─────────────────── page ─────────────────── */
const CulturalForecast = () => {
  const { data: dbForecasts } = useQuery({
    queryKey: ["forecasts-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forecasts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((f: any) => ({
        id: f.id,
        title: f.title,
        projection: f.projection,
        evidence: f.evidence,
        implications: f.implications,
        domain: f.domain as ForecastDomain,
        horizon: f.horizon as ForecastHorizon,
        signalStrength: f.signal_strength as ForecastSignalStrength,
        region: f.region as "Africa" | "Diaspora" | "Global",
        publishedDate: new Date(f.published_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      })) as CulturalForecast[];
    },
    staleTime: 30_000,
  });

  const allForecasts = dbForecasts && dbForecasts.length > 0 ? dbForecasts : staticForecasts;

  const [domain, setDomain] = useState<ForecastDomain | "All">("All");
  const [horizon, setHorizon] = useState<ForecastHorizon | "All">("All");
  const [signal, setSignal] = useState<ForecastSignalStrength | "All">("All");
  const [openFilter, setOpenFilter] = useState<"category" | "horizon" | "signal" | null>(null);

  const toggleFilter = (key: "category" | "horizon" | "signal") =>
    setOpenFilter(openFilter === key ? null : key);

  const filtered = useMemo(() => {
    return allForecasts.filter((f) => {
      if (domain !== "All" && f.domain !== domain) return false;
      if (horizon !== "All" && f.horizon !== horizon) return false;
      if (signal !== "All" && f.signalStrength !== signal) return false;
      return true;
    });
  }, [domain, horizon, signal, allForecasts]);

  const pill = (active: boolean) =>
    `cursor-pointer rounded-sm border px-3 py-1.5 font-body text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
      active
        ? "border-gold bg-gold text-primary-foreground"
        : "border-border bg-transparent text-muted-foreground hover:border-gold/40 hover:text-foreground"
    }`;

  const headerBtn = (key: "category" | "horizon" | "signal", label: string, activeValue: string) => (
    <button
      onClick={() => toggleFilter(key)}
      className="flex items-center gap-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground/80 hover:text-foreground transition-colors"
    >
      <span>{label}</span>
      {activeValue !== "All" && (
        <span className="rounded-sm bg-gold/20 px-1.5 py-0.5 text-[10px] text-gold">{activeValue}</span>
      )}
      <ChevronDown
        className={`h-3 w-3 transition-transform duration-200 ${openFilter === key ? "rotate-180" : ""}`}
      />
    </button>
  );

  return (
    <div className="relative min-h-screen bg-background">
      <Navbar />
      <AmbientField />

      {/* Hero */}
      <header className="relative z-10 px-6 pb-8 pt-28 md:px-16 lg:px-24">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 font-body text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-3 w-3" />
          Afrivogue Feed
        </Link>

        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-3 font-body text-[10px] font-bold uppercase tracking-[0.3em] text-gold"
          >
            Cultural Forecast · Q1 2026
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl"
          >
            Signals from <span className="italic text-gold">Tomorrow</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 max-w-xl font-body text-sm leading-relaxed text-muted-foreground sm:text-base"
          >
            Intelligent projections across fashion, luxury, culture, and creative
            industry — curated for those who shape the future rather than follow it.
          </motion.p>
        </div>
      </header>

      {/* Filters */}
      <div className="relative z-10 px-6 md:px-16 lg:px-24 space-y-2">
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          {headerBtn("category", "Category", domain)}
          <span className="hidden md:block h-4 w-px bg-border" />
          {headerBtn("horizon", "Horizon", horizon)}
          <span className="hidden md:block h-4 w-px bg-border" />
          {headerBtn("signal", "Signal", signal)}
        </div>

        <AnimatePresence>
          {openFilter && (
            <motion.div
              key={openFilter}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-2 pt-2 pb-1">
                {openFilter === "category" && (
                  <>
                    <button className={pill(domain === "All")} onClick={() => setDomain("All")}>All</button>
                    {forecastDomains.map((d) => (
                      <button key={d} className={pill(domain === d)} onClick={() => setDomain(d)}>{d}</button>
                    ))}
                  </>
                )}
                {openFilter === "horizon" && (
                  <>
                    <button className={pill(horizon === "All")} onClick={() => setHorizon("All")}>All</button>
                    {forecastHorizons.map((h) => (
                      <button key={h} className={pill(horizon === h)} onClick={() => setHorizon(h)}>{h}</button>
                    ))}
                  </>
                )}
                {openFilter === "signal" && (
                  <>
                    <button className={pill(signal === "All")} onClick={() => setSignal("All")}>All</button>
                    {signalStrengths.map((s) => (
                      <button key={s} className={pill(signal === s)} onClick={() => setSignal(s)}>{s}</button>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cards grid */}
      <section className="relative z-10 mt-10 px-6 pb-24 md:px-16 lg:px-24">
        <AnimatePresence mode="popLayout">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
            {filtered.map((f, i) => (
              <ForecastCard key={f.id} forecast={f} index={i} />
            ))}
          </div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="mt-16 text-center">
            <p className="font-display text-xl text-muted-foreground">
              No forecasts match your filters.
            </p>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              Broaden your selection to explore more signals.
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-24 border-t border-border pt-10">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="font-display text-lg font-bold text-foreground">
              AFRI<span className="text-gold">VOGUE</span>
            </div>
            <p className="font-body text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Afrivogue does not chase the future. It defines it.
            </p>
          </div>
        </footer>
      </section>
    </div>
  );
};

export default CulturalForecast;

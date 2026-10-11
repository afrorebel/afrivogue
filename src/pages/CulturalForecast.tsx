import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Clock, Signal, TrendingUp, ChevronDown } from "lucide-react";
import Pager from "@/components/editorial/Pager";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageMasthead from "@/components/editorial/PageMasthead";
import { api } from "@/integrations/api/client";
import { linkifyText } from "@/lib/linkify";
import {
  forecasts as staticForecasts,
  forecastDomains,
  forecastHorizons,
  signalStrengths,
  normalizeHorizon,
} from "@/lib/forecastData";
import type {
  CulturalForecast,
  ForecastDomain,
  ForecastHorizon,
  ForecastSignalStrength,
} from "@/lib/forecastData";

const PER_PAGE = 12;

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
      transition={{ duration: 0.5, delay: (index % PER_PAGE) * 0.05 }}
      className="group relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lift"
    >
      {/* top accent line */}
      <div className="h-1 w-full gradient-gold opacity-70 transition-opacity group-hover:opacity-100" />

      <div className="flex flex-col p-6 sm:p-8">
        {/* meta row */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.12em] ${signalBadge[forecast.signalStrength]}`}
          >
            <Signal className="h-2.5 w-2.5" />
            {forecast.signalStrength}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-body text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {horizonIcon[forecast.horizon]}
            {forecast.horizon}
          </span>
          <span className="ml-auto font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {forecast.domain}
          </span>
        </div>

        {/* title */}
        <h3 className="mb-3 break-words font-display text-2xl italic leading-tight text-foreground transition-colors group-hover:text-gold sm:text-3xl">
          {forecast.title}
        </h3>

        {/* projection */}
        <p className={`font-body text-sm leading-relaxed text-foreground/80 ${expanded ? "" : "line-clamp-5"}`}>
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
                    {linkifyText(forecast.evidence)}
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-body text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                    Implications
                  </h4>
                  <p className="font-body text-sm leading-relaxed text-muted-foreground">
                    {linkifyText(forecast.implications)}
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
            className="rounded-full bg-gold/10 px-4 py-1.5 font-body text-xs font-semibold text-gold transition-colors hover:bg-gold hover:text-primary-foreground"
          >
            {expanded ? "Collapse" : "Full Analysis"}
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
      const { data, error } = await api
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
        horizon: normalizeHorizon(f.horizon),
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
  const [page, setPage] = useState(1);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const goToPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pill = (active: boolean) =>
    `cursor-pointer rounded-full border px-4 py-2 font-body text-xs font-medium transition-all duration-200 ${
      active
        ? "border-gold bg-gold text-primary-foreground"
        : "border-border bg-transparent text-muted-foreground hover:border-gold/40 hover:text-foreground"
    }`;

  const headerBtn = (key: "category" | "horizon" | "signal", label: string, activeValue: string) => (
    <button
      onClick={() => toggleFilter(key)}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-sm font-medium text-foreground/85 transition-colors hover:bg-muted hover:text-gold"
    >
      <span>{label}</span>
      {activeValue !== "All" && (
        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold">{activeValue}</span>
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

      <div className="relative z-10">
        <PageMasthead
          eyebrow="Cultural forecast"
          title="Signals from"
          accent="Tomorrow"
          intro="What the culture is about to do next. Researched projections on fashion, beauty, music and the creative economy, from Lagos to London to Los Angeles."
          meta={`${filtered.length} Signals`}
        />
      </div>

      {/* Filters */}
      <div className="relative z-10 px-4 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px] space-y-3 rounded-2xl border border-border/60 bg-card/70 px-5 py-4 backdrop-blur-sm">
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
                    <button className={pill(domain === "All")} onClick={() => { setDomain("All"); setPage(1); }}>All</button>
                    {forecastDomains.map((d) => (
                      <button key={d} className={pill(domain === d)} onClick={() => { setDomain(d); setPage(1); }}>{d}</button>
                    ))}
                  </>
                )}
                {openFilter === "horizon" && (
                  <>
                    <button className={pill(horizon === "All")} onClick={() => { setHorizon("All"); setPage(1); }}>All</button>
                    {forecastHorizons.map((h) => (
                      <button key={h} className={pill(horizon === h)} onClick={() => { setHorizon(h); setPage(1); }}>{h}</button>
                    ))}
                  </>
                )}
                {openFilter === "signal" && (
                  <>
                    <button className={pill(signal === "All")} onClick={() => { setSignal("All"); setPage(1); }}>All</button>
                    {signalStrengths.map((s) => (
                      <button key={s} className={pill(signal === s)} onClick={() => { setSignal(s); setPage(1); }}>{s}</button>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* Cards grid */}
      <section className="relative z-10 mt-8 px-4 pb-24 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
            {paged.map((f, i) => (
              <ForecastCard key={f.id} forecast={f} index={i} />
            ))}
          </div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="mt-16 text-center">
            <p className="font-display text-2xl italic text-muted-foreground">
              No forecasts match your filters.
            </p>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              Broaden your selection to explore more signals.
            </p>
          </div>
        )}
        <Pager page={safePage} totalPages={totalPages} onChange={goToPage} />
        </div>
      </section>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default CulturalForecast;

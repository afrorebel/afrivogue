import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, type PanInfo } from "framer-motion";
import { trends } from "@/lib/trendData";
import type { Trend } from "@/lib/trendData";

const SWIPE_THRESHOLD = 50;

function extractSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}

function buildStoryCards(trend: Trend) {
  const sentences = extractSentences(trend.culturalSignificance);
  const mid = Math.ceil(sentences.length / 2);

  return [
    {
      type: "opening" as const,
      label: "I",
      title: trend.headline,
      body: sentences[0] || trend.culturalSignificance,
    },
    {
      type: "context" as const,
      label: "II",
      title: "Why This Matters Now",
      body: sentences.slice(1, mid).join(" ") || sentences[0],
    },
    {
      type: "quote" as const,
      label: "III",
      title: "",
      body: sentences.length > 2 ? sentences[Math.min(2, sentences.length - 1)] : sentences[0],
    },
    {
      type: "insight" as const,
      label: "IV",
      title: "Cultural Significance",
      body: sentences.slice(mid).join(" ") || trend.culturalSignificance,
    },
    {
      type: "reflect" as const,
      label: "V",
      title: "A Question Worth Asking",
      body:
        trend.category === "Fashion"
          ? "How does this movement redefine what luxury means for the next generation of African creatives?"
          : trend.category === "Beauty"
            ? "When beauty technology centres melanin-rich skin as the default, what does that mean for the future of the global industry?"
            : trend.category === "Culture"
              ? "If culture drives commerce, who truly holds the power in the creative economy?"
              : trend.category === "Business"
                ? "What does it mean for global fashion when the most innovative business models emerge from the African continent?"
                : trend.category === "Art & Design"
                  ? "Can art markets evolve beyond extraction to honour the communities from which their most vital work emerges?"
                  : "How will this shift reshape the global luxury landscape in the decade ahead?",
    },
    {
      type: "closing" as const,
      label: "VI",
      title: "Looking Forward",
      body: `${sentences[sentences.length - 1] || trend.culturalSignificance} The narrative is only beginning — and Afrivogue will be watching.`,
    },
  ];
}

const cardVariants = {
  enter: (dir: number) => ({
    y: dir > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.92,
  }),
  center: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: (dir: number) => ({
    y: dir > 0 ? "-100%" : "100%",
    opacity: 0,
    scale: 0.92,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

/* ── Ambient floating particles ── */
function AmbientBackground({ activeIndex, totalCards }: { activeIndex: number; totalCards: number }) {
  const progress = totalCards > 1 ? activeIndex / (totalCards - 1) : 0;

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 12 + 10,
        delay: Math.random() * -20,
        opacity: Math.random() * 0.15 + 0.05,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Radial glow that shifts with progress */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `radial-gradient(ellipse 60% 50% at ${50 + progress * 10}% ${40 + progress * 20}%, hsl(var(--gold) / 0.06) 0%, transparent 70%)`,
        }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* Floating dust particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: "hsl(var(--gold))",
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.sin(p.id) * 15, 0],
            opacity: [p.opacity, p.opacity * 1.8, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,hsl(var(--background))_100%)]" />
    </div>
  );
}

/* ── Parallax wrapper: subtle mouse-follow on desktop ── */
function ParallaxWrapper({ children }: { children: React.ReactNode }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 100, damping: 30, mass: 0.5 };
  const x = useSpring(useTransform(mouseX, [-0.5, 0.5], [12, -12]), springConfig);
  const y = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [2, -2]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-2, 2]), springConfig);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div style={{ x, y, rotateX, rotateY, perspective: 800 }} className="w-full">
      {children}
    </motion.div>
  );
}

const StoryMode = () => {
  const { id } = useParams<{ id: string }>();
  const trend = trends.find((t) => t.id === id);
  const [[activeIndex, direction], setPage] = useState<[number, number]>([0, 0]);

  const cards = trend ? buildStoryCards(trend) : [];
  const totalCards = cards.length;

  const paginate = useCallback(
    (newDir: number) => {
      setPage(([prev]) => {
        const next = prev + newDir;
        if (next < 0 || next >= totalCards) return [prev, 0];
        return [next, newDir];
      });
    },
    [totalCards]
  );

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -SWIPE_THRESHOLD) paginate(1);
    else if (info.offset.y > SWIPE_THRESHOLD) paginate(-1);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        paginate(1);
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        paginate(-1);
      }
      if (e.key === "Escape") {
        window.history.back();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [paginate]);

  if (!trend) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-2xl text-foreground">Story Not Found</h1>
          <Link to="/" className="mt-4 inline-block font-body text-sm text-gold">
            ← Return
          </Link>
        </div>
      </div>
    );
  }

  const card = cards[activeIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Ambient background */}
      <AmbientBackground activeIndex={activeIndex} totalCards={totalCards} />
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link
          to={`/trend/${trend.id}`}
          className="font-body text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-gold"
        >
          ✕ Close
        </Link>
        <div className="font-display text-sm font-bold text-foreground">
          AFRI<span className="text-gold">VOGUE</span>
        </div>
        <span className="font-body text-xs tabular-nums text-muted-foreground">
          {activeIndex + 1} / {totalCards}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 px-6">
        {cards.map((_, i) => (
          <div key={i} className="h-[2px] flex-1 overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: "hsl(var(--gold))" }}
              initial={false}
              animate={{ width: i <= activeIndex ? "100%" : "0%" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        ))}
      </div>

      {/* Card area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-4 sm:px-6 sm:py-8">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="absolute flex w-full max-w-2xl cursor-grab items-center justify-center px-2 active:cursor-grabbing"
            style={{ touchAction: "none" }}
          >
            <ParallaxWrapper>
              <StoryCard card={card} trend={trend} />
            </ParallaxWrapper>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation hints */}
      <div className="flex items-center justify-center gap-6 px-6 pb-6">
        <button
          onClick={() => paginate(-1)}
          disabled={activeIndex === 0}
          className="font-body text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-gold disabled:opacity-30"
        >
          ↑ Previous
        </button>
        <button
          onClick={() => paginate(1)}
          disabled={activeIndex === totalCards - 1}
          className="font-body text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-gold disabled:opacity-30"
        >
          Next ↓
        </button>
      </div>
    </div>
  );
};

interface StoryCardData {
  type: "opening" | "context" | "quote" | "insight" | "reflect" | "closing";
  label: string;
  title: string;
  body: string;
}

function StoryCard({ card, trend }: { card: StoryCardData; trend: Trend }) {
  if (card.type === "opening") {
    return (
      <div className="flex w-full flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4 font-body text-[10px] font-bold uppercase tracking-[0.3em] text-gold"
        >
          {trend.category} · {trend.geoRelevance} · Story Mode
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-5xl lg:text-6xl"
        >
          {card.title}
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-6 h-px w-16 bg-gold sm:mt-8 sm:w-24"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 max-w-lg font-body text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base md:text-lg"
        >
          {card.body}
        </motion.p>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.2 }}
          className="mt-6 font-body text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:mt-10"
        >
          Swipe up to continue
        </motion.span>
      </div>
    );
  }

  if (card.type === "quote") {
    return (
      <div className="flex w-full flex-col items-center px-4 text-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-6 font-display text-5xl leading-none text-gold/30 sm:mb-8 sm:text-7xl"
        >
          "
        </motion.span>
        <motion.blockquote
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-lg font-display text-lg italic leading-relaxed text-foreground/90 sm:text-xl md:text-2xl lg:text-3xl"
        >
          {card.body}
        </motion.blockquote>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 h-px w-16 bg-gold/50 sm:mt-8"
        />
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-4 font-body text-xs uppercase tracking-[0.2em] text-gold/60"
        >
          — Afrivogue Intelligence
        </motion.span>
      </div>
    );
  }

  if (card.type === "reflect") {
    return (
      <div className="flex w-full flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-6 font-body text-[10px] font-bold uppercase tracking-[0.3em] text-gold"
        >
          {card.label} · Reflection
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 font-display text-xl font-bold text-foreground sm:mb-8 sm:text-2xl md:text-3xl"
        >
          {card.title}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-md rounded-lg border border-gold/20 bg-card p-5 sm:p-8"
        >
          <p className="font-display text-base italic leading-relaxed text-foreground/80 sm:text-lg md:text-xl">
            {card.body}
          </p>
          <div className="mt-6 h-px w-full bg-border" />
          <p className="mt-4 font-body text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Share your perspective with the Afrivogue community
          </p>
        </motion.div>
      </div>
    );
  }

  if (card.type === "closing") {
    return (
      <div className="flex w-full flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-6 font-body text-[10px] font-bold uppercase tracking-[0.3em] text-gold"
        >
          {card.label} · Coda
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4 font-display text-xl font-bold text-foreground sm:mb-6 sm:text-2xl md:text-3xl"
        >
          {card.title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-lg font-body text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg"
        >
          {card.body}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 flex flex-col items-center gap-3 sm:mt-10"
        >
          <div className="font-display text-lg font-bold text-foreground">
            AFRI<span className="text-gold">VOGUE</span>
          </div>
          <span className="font-body text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Global Trend Intelligence
          </span>
          <Link
            to="/"
            className="mt-4 font-body text-xs font-medium text-gold transition-colors hover:text-foreground"
          >
            ← Return to Intelligence Feed
          </Link>
        </motion.div>
      </div>
    );
  }

  // context + insight cards
  return (
    <div className="flex w-full flex-col items-center text-center">
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-6 font-body text-[10px] font-bold uppercase tracking-[0.3em] text-gold"
      >
        {card.label} · {card.type === "context" ? "Context" : "Insight"}
      </motion.span>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mb-4 font-display text-xl font-bold text-foreground sm:mb-6 sm:text-2xl md:text-3xl"
      >
        {card.title}
      </motion.h2>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5 }}
        className="mb-6 h-px w-16 bg-gold/40 sm:mb-8"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="max-w-lg font-body text-sm leading-[1.9] text-muted-foreground sm:text-base md:text-lg"
      >
        {card.body}
      </motion.p>
    </div>
  );
}

export default StoryMode;

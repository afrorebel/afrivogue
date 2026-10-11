import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Flame, Lightbulb, RotateCcw, Share2, Sparkles, Trophy, X, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TriviaLeaderboard from "@/components/trivia/TriviaLeaderboard";
import CategoryChip from "@/components/editorial/CategoryChip";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { categoryColor } from "@/lib/categoryColors";

interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  category: string;
  difficulty: string;
  fun_fact: string | null;
}

type Mode = "daily" | "quick";

interface Answer {
  question: TriviaQuestion;
  picked: string;
  correct: boolean;
}

interface TriviaStats {
  streak: number;
  best: number;
  lastPlayed: string | null;
  played: Record<string, number>;
}

const ROUND_SIZE = 5;
const POINTS = { easy: 10, medium: 15, hard: 25 } as Record<string, number>;
const STATS_KEY = "afrivogue_trivia_stats";
const LAUNCH_DAY = Date.UTC(2026, 0, 1);

/** "Pick a vibe" groups for Quick Play; each maps onto question categories. */
const VIBES: { label: string; categories: string[] }[] = [
  { label: "Everything", categories: [] },
  { label: "Fashion", categories: ["Fashion", "Luxury"] },
  { label: "Music & Film", categories: ["Entertainment"] },
  { label: "Culture", categories: ["Culture", "Lifestyle"] },
  { label: "Beauty", categories: ["Beauty"] },
  { label: "Art & Business", categories: ["Art & Design", "Business"] },
];

const todayKey = () => new Date().toISOString().slice(0, 10);
const dayNumber = () => Math.floor((Date.now() - LAUNCH_DAY) / 86_400_000) + 1;

/** Small deterministic PRNG so everyone gets the same Daily Five. */
function seeded(seedText: string) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Two easy, two medium, one hard, in that order, so everyone gets off to a good start. */
function buildRound(pool: TriviaQuestion[], rand: () => number): TriviaQuestion[] {
  const by = (d: string) => shuffle(pool.filter((q) => q.difficulty === d), rand);
  const picked = [...by("easy").slice(0, 2), ...by("medium").slice(0, 2), ...by("hard").slice(0, 1)];
  const missing = ROUND_SIZE - picked.length;
  if (missing > 0) picked.push(...shuffle(pool.filter((q) => !picked.includes(q)), rand).slice(0, missing));
  return picked.map((q) => ({ ...q, options: shuffle(q.options, rand) }));
}

function loadStats(): TriviaStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // storage unavailable; play without a saved streak
  }
  return { streak: 0, best: 0, lastPlayed: null, played: {} };
}

function saveStats(stats: TriviaStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

const Burst = () => (
  <div className="pointer-events-none absolute inset-0 overflow-visible">
    {Array.from({ length: 14 }).map((_, i) => {
      const angle = (i / 14) * Math.PI * 2;
      return (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
          style={{ backgroundColor: ["hsl(var(--gold))", "hsl(var(--cat-beauty))", "hsl(var(--cat-culture))", "hsl(var(--cat-art))"][i % 4] }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: Math.cos(angle) * 120, y: Math.sin(angle) * 80, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      );
    })}
  </div>
);

const Trivia = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>("daily");
  const [vibe, setVibe] = useState(VIBES[0]);
  const [round, setRound] = useState<TriviaQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [fiftyUsed, setFiftyUsed] = useState(false);
  const [combo, setCombo] = useState(0);
  const [points, setPoints] = useState(0);
  const [stats, setStats] = useState<TriviaStats>(loadStats);
  const [started, setStarted] = useState(false);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["trivia-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trivia_questions")
        .select("id, question, options, correct_answer, explanation, category, difficulty, fun_fact")
        .eq("published", true);
      if (error) throw error;
      return (data || [])
        .map((q: Omit<TriviaQuestion, "options"> & { options: unknown }) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : JSON.parse(String(q.options)),
        }))
        .filter((q: TriviaQuestion) => q.options.length === 4 && q.options.includes(q.correct_answer)) as TriviaQuestion[];
    },
    staleTime: 5 * 60_000,
  });

  const dailyKey = `daily-${todayKey()}`;
  const playedToday = stats.played[todayKey()] !== undefined;
  const current = round[index];
  // The round ends when the player moves past the last explanation, not the moment they answer it.
  const finished = started && round.length > 0 && index >= round.length;
  const correctCount = answers.filter((a) => a.correct).length;

  const startRound = useCallback(
    (nextMode: Mode, nextVibe = vibe) => {
      const pool =
        nextMode === "quick" && nextVibe.categories.length
          ? questions.filter((q) => nextVibe.categories.includes(q.category))
          : questions;
      const rand = nextMode === "daily" ? seeded(dailyKey) : Math.random;
      setMode(nextMode);
      setVibe(nextVibe);
      setRound(buildRound(pool, rand));
      setIndex(0);
      setAnswers([]);
      setPicked(null);
      setHidden([]);
      setFiftyUsed(false);
      setCombo(0);
      setPoints(0);
      setStarted(true);
    },
    [questions, vibe, dailyKey],
  );

  const answer = (option: string) => {
    if (!current || picked) return;
    const correct = option === current.correct_answer;
    setPicked(option);
    setAnswers((prev) => [...prev, { question: current, picked: option, correct }]);
    if (correct) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      // Streak bonus: +5 for every answer after the first in a row.
      setPoints((p) => p + (POINTS[current.difficulty] ?? 10) + (nextCombo > 1 ? 5 * (nextCombo - 1) : 0));
    } else {
      setCombo(0);
    }
  };

  const useFifty = () => {
    if (!current || fiftyUsed || picked) return;
    const wrong = shuffle(current.options.filter((o) => o !== current.correct_answer)).slice(0, 2);
    setHidden(wrong);
    setFiftyUsed(true);
  };

  const next = () => {
    setPicked(null);
    setHidden([]);
    setIndex((i) => i + 1);
  };

  // Record the Daily Five once it is finished: local streak plus the leaderboard for signed-in players.
  useEffect(() => {
    if (!finished || mode !== "daily" || playedToday) return;
    const today = todayKey();
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const streak = stats.lastPlayed === yesterday ? stats.streak + 1 : 1;
    const updated: TriviaStats = {
      streak,
      best: Math.max(stats.best, streak),
      lastPlayed: today,
      played: { ...stats.played, [today]: correctCount },
    };
    setStats(updated);
    saveStats(updated);
    if (user) {
      supabase
        .from("trivia_scores")
        .insert({ user_id: user.id, score: points, total_questions: round.length, category: dailyKey })
        .then(() => qc.invalidateQueries({ queryKey: ["trivia-leaderboard"] }));
    }
  }, [finished, mode, playedToday, stats, correctCount, user, points, round.length, dailyKey, qc]);

  const shareText = useMemo(() => {
    const grid = answers.map((a) => (a.correct ? "🟨" : "⬛")).join("");
    return `AfriTrivia #${dayNumber()} ${grid} ${correctCount}/${round.length}\nCan you beat me? afrivogue.com/trivia`;
  }, [answers, correctCount, round.length]);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
        return;
      }
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Copied your result", description: "Paste it anywhere to challenge a friend." });
    } catch {
      // user cancelled the share sheet
    }
  };

  const verdict =
    correctCount === round.length
      ? "Flawless. You are the friend everyone calls before a party."
      : correctCount >= 3
        ? "Proper culture fluency. You won this one."
        : correctCount >= 1
          ? "Some wins, some lessons. That is exactly how it works."
          : "Tough round, but you just learned five new things.";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-[1100px] px-4 pb-20 pt-24 md:px-8 md:pt-28">
        {/* Header */}
        <header className="mb-8 text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            <Sparkles className="h-3.5 w-3.5" /> The culture game
          </p>
          <h1 className="font-display text-5xl italic tracking-tight md:text-7xl">
            Afri<span className="text-gold">Trivia</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-body text-base leading-relaxed text-muted-foreground md:text-lg">
            Five quick questions a day about the style, music and moments shaping African culture. Win some, learn the
            rest, keep your streak alive.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0">
            {isLoading ? (
              <div className="h-[420px] animate-pulse rounded-3xl bg-card" />
            ) : !started ? (
              /* ── Lobby ── */
              <div className="space-y-5">
                <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-sunset p-6 shadow-soft md:p-10">
                  <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                    Daily Five · #{dayNumber()}
                  </p>
                  <h2 className="mt-3 font-display text-4xl italic leading-tight md:text-5xl">Today's round</h2>
                  <p className="mt-3 max-w-md font-body text-base text-muted-foreground">
                    Two easy, two medium and one hard question. The same five for everyone, so you can compare with friends.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {playedToday ? (
                      <span className="rounded-full bg-background/70 px-5 py-3 font-body text-sm font-medium">
                        Played today: {stats.played[todayKey()]}/{ROUND_SIZE}. Back tomorrow for #{dayNumber() + 1}.
                      </span>
                    ) : (
                      <button
                        onClick={() => startRound("daily")}
                        disabled={questions.length < ROUND_SIZE}
                        className="group inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 font-body text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-50"
                      >
                        Play today's five <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )}
                    <span className="flex items-center gap-1.5 font-body text-sm text-muted-foreground">
                      <Flame className="h-4 w-4 text-[hsl(var(--cat-fashion))]" /> {stats.streak}-day streak
                    </span>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft md:p-8">
                  <h2 className="font-display text-2xl italic">Quick Play</h2>
                  <p className="mt-1 font-body text-sm text-muted-foreground">Pick a vibe and play as many rounds as you like.</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {VIBES.map((v) => (
                      <button
                        key={v.label}
                        onClick={() => startRound("quick", v)}
                        className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 font-body text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-gold hover:text-gold"
                      >
                        {v.categories[0] && (
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryColor(v.categories[0]) }} />
                        )}
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : finished ? (
              /* ── Results ── */
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="rounded-3xl border border-gold/25 bg-sunset p-6 text-center shadow-soft md:p-10">
                  <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                    {mode === "daily" ? `Daily Five · #${dayNumber()}` : `Quick Play · ${vibe.label}`}
                  </p>
                  <p className="mt-4 text-3xl tracking-[0.3em]">{answers.map((a) => (a.correct ? "🟨" : "⬛")).join("")}</p>
                  <h2 className="mt-4 font-display text-5xl italic">
                    {correctCount}/{round.length}
                  </h2>
                  <p className="mt-2 font-body text-base text-muted-foreground">{verdict}</p>
                  <p className="mt-1 font-body text-sm font-semibold text-gold">{points} points</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                      onClick={share}
                      className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-body text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
                    >
                      <Share2 className="h-4 w-4" /> Challenge a friend
                    </button>
                    <button
                      onClick={() => startRound("quick", vibe)}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-6 py-3 font-body text-sm font-medium transition-colors hover:border-gold hover:text-gold"
                    >
                      <RotateCcw className="h-4 w-4" /> {mode === "daily" ? "Keep playing" : "Another round"}
                    </button>
                  </div>
                  {!user && mode === "daily" && (
                    <p className="mt-5 font-body text-sm text-muted-foreground">
                      <Link to="/auth" className="font-semibold text-gold hover:underline">
                        Join free
                      </Link>{" "}
                      to save your streak and get on the leaderboard.
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft md:p-8">
                  <h3 className="mb-5 font-display text-2xl italic">What you learned today</h3>
                  <ol className="space-y-4">
                    {answers.map((a, i) => (
                      <li key={a.question.id} className="flex gap-4">
                        <span
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            a.correct ? "bg-gold text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {a.correct ? <Check className="h-4 w-4" /> : <span className="font-body text-xs">{i + 1}</span>}
                        </span>
                        <div className="min-w-0">
                          <p className="font-body text-sm font-semibold text-foreground">{a.question.correct_answer}</p>
                          <p className="mt-1 font-body text-sm leading-relaxed text-muted-foreground">{a.question.explanation}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            ) : current ? (
              /* ── Question ── */
              <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft md:p-8">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div className="flex gap-1.5">
                    {round.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 w-8 rounded-full transition-colors md:w-10 ${
                          i < answers.length ? (answers[i].correct ? "bg-gold" : "bg-muted-foreground/40") : i === index ? "bg-foreground/60" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 font-body text-sm">
                    {combo > 1 && (
                      <span className="flex items-center gap-1 font-semibold text-[hsl(var(--cat-fashion))]">
                        <Zap className="h-4 w-4" /> x{combo}
                      </span>
                    )}
                    <span className="font-semibold text-gold">{points} pts</span>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <CategoryChip category={current.category} />
                      <span className="font-body text-xs capitalize text-muted-foreground">{current.difficulty}</span>
                    </div>
                    <h2 className="font-display text-2xl leading-snug md:text-3xl">{current.question}</h2>

                    <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {picked === current.correct_answer && <Burst />}
                      {current.options.map((option) => {
                        const isCorrect = option === current.correct_answer;
                        const isPicked = option === picked;
                        const gone = hidden.includes(option);
                        const state = !picked ? "idle" : isCorrect ? "correct" : isPicked ? "wrong" : "muted";
                        return (
                          <motion.button
                            key={option}
                            data-answer={option}
                            onClick={() => answer(option)}
                            disabled={!!picked || gone}
                            animate={state === "wrong" ? { x: [0, -8, 8, -5, 5, 0] } : {}}
                            transition={{ duration: 0.4 }}
                            className={`flex min-h-[3.5rem] items-center justify-between gap-3 rounded-2xl border px-5 py-3 text-left font-body text-[15px] font-medium transition-all ${
                              gone
                                ? "pointer-events-none border-dashed border-border text-transparent"
                                : state === "idle"
                                  ? "border-border bg-background hover:-translate-y-0.5 hover:border-gold hover:shadow-soft"
                                  : state === "correct"
                                    ? "border-gold bg-gold/15 text-foreground"
                                    : state === "wrong"
                                      ? "border-[hsl(var(--cat-fashion))] bg-[hsl(var(--cat-fashion)/0.12)] text-foreground"
                                      : "border-border bg-background opacity-50"
                            }`}
                          >
                            {option}
                            {state === "correct" && <Check className="h-5 w-5 shrink-0 text-gold" />}
                            {state === "wrong" && <X className="h-5 w-5 shrink-0 text-[hsl(var(--cat-fashion))]" />}
                          </motion.button>
                        );
                      })}
                    </div>

                    {!picked && (
                      <button
                        onClick={useFifty}
                        disabled={fiftyUsed}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                      >
                        <Lightbulb className="h-3.5 w-3.5" /> {fiftyUsed ? "50/50 used this round" : "Use 50/50 (once per round)"}
                      </button>
                    )}

                    {picked && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 rounded-2xl border border-border/60 bg-background/70 p-5"
                      >
                        <p className="font-display text-xl italic text-foreground">
                          {picked === current.correct_answer ? "Yes! " : "Not quite. "}
                          <span className="text-gold">{current.correct_answer}</span>
                        </p>
                        <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">{current.explanation}</p>
                        {current.fun_fact && (
                          <p className="mt-3 rounded-xl bg-gold/10 px-4 py-3 font-body text-sm leading-relaxed text-foreground">
                            <span className="font-semibold text-gold">Did you know? </span>
                            {current.fun_fact}
                          </p>
                        )}
                        <button
                          onClick={next}
                          className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 font-body text-sm font-semibold text-background transition-transform hover:scale-[1.02]"
                        >
                          {index + 1 < round.length ? "Next question" : "See my results"} <ArrowRight className="h-4 w-4" />
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <p className="py-16 text-center font-body text-muted-foreground">No questions in this vibe yet. Try another.</p>
            )}
          </section>

          <aside className="space-y-5">
            <div className="grid grid-cols-3 gap-3 rounded-3xl border border-border/60 bg-card p-5 text-center shadow-soft">
              <div>
                <Flame className="mx-auto h-5 w-5 text-[hsl(var(--cat-fashion))]" />
                <p className="mt-1 font-display text-2xl">{stats.streak}</p>
                <p className="font-body text-[11px] text-muted-foreground">Streak</p>
              </div>
              <div>
                <Trophy className="mx-auto h-5 w-5 text-gold" />
                <p className="mt-1 font-display text-2xl">{stats.best}</p>
                <p className="font-body text-[11px] text-muted-foreground">Best</p>
              </div>
              <div>
                <Sparkles className="mx-auto h-5 w-5 text-[hsl(var(--cat-art))]" />
                <p className="mt-1 font-display text-2xl">{Object.keys(stats.played).length}</p>
                <p className="font-body text-[11px] text-muted-foreground">Days played</p>
              </div>
            </div>
            <TriviaLeaderboard category={dailyKey} title="Today's top players" />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Trivia;

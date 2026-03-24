import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Lightbulb, Check, X, RotateCcw, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import TriviaLeaderboard from "@/components/trivia/TriviaLeaderboard";
import { useAuth } from "@/hooks/useAuth";

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

const categoryColors: Record<string, string> = {
  Fashion: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Culture: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Entertainment: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  Lifestyle: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Beauty: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "Art & Design": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Business: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Luxury: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

const difficultyLabel: Record<string, string> = {
  easy: "🟢 Easy",
  medium: "🟡 Medium",
  hard: "🔴 Hard",
};

const swipeVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 400 : -400,
    opacity: 0,
    scale: 0.9,
    rotateY: dir > 0 ? 15 : -15,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: (dir: number) => ({
    x: dir < 0 ? 400 : -400,
    opacity: 0,
    scale: 0.9,
    rotateY: dir < 0 ? 15 : -15,
    transition: { duration: 0.25 },
  }),
};

const Trivia = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["trivia-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trivia_questions")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options),
      })) as TriviaQuestion[];
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    if (filterCategory === "All") return questions;
    return questions.filter((q) => q.category === filterCategory);
  }, [questions, filterCategory]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(questions.map((q) => q.category)))],
    [questions]
  );

  const current = filtered[currentIndex];

  const paginate = useCallback(
    (newDir: number) => {
      setDirection(newDir);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setCurrentIndex((prev) => {
        const next = prev + newDir;
        if (next < 0) return filtered.length - 1;
        if (next >= filtered.length) return 0;
        return next;
      });
    },
    [filtered.length]
  );

  const handleSwipe = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 80) {
      paginate(info.offset.x > 0 ? -1 : 1);
    }
  };

  const handleAnswer = (option: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    setShowExplanation(true);
    if (option === current.correct_answer && !answered.has(currentIndex)) {
      setScore((s) => s + 1);
      setAnswered((prev) => new Set(prev).add(currentIndex));
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnswered(new Set());
    setDirection(0);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="relative pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 mb-3 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-gold">
              Culture Quiz
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">
            AFRI<span className="text-gold">TRIVIA</span>
          </h1>
          <p className="font-body text-muted-foreground max-w-lg mx-auto text-sm">
            Test your knowledge of African fashion, culture, entertainment and lifestyle — past and present.
          </p>
        </motion.div>

        {/* Score bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Score: <span className="text-gold font-semibold">{score}</span>
              {filtered.length > 0 && ` / ${filtered.length}`}
            </span>
            <button onClick={resetQuiz} className="text-muted-foreground hover:text-gold transition-colors" title="Reset">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          {filtered.length > 0 && (
            <span className="font-body text-xs text-muted-foreground">
              {currentIndex + 1} of {filtered.length}
            </span>
          )}
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setFilterCategory(cat);
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setShowExplanation(false);
              }}
              className={`rounded-full border px-3 py-1 font-body text-xs uppercase tracking-[0.1em] transition-all ${
                filterCategory === cat
                  ? "border-gold bg-gold/20 text-gold"
                  : "border-border text-muted-foreground hover:border-gold/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading / Empty */}
        {isLoading && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="h-8 w-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
            <p className="font-body text-sm text-muted-foreground">Loading trivia…</p>
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <Lightbulb className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-body text-muted-foreground">No trivia questions available yet. Check back soon!</p>
          </div>
        )}

        {/* Card */}
        {!isLoading && current && (
          <div className="relative min-h-[480px] flex items-center justify-center">
            {/* Nav arrows (desktop) */}
            <button
              onClick={() => paginate(-1)}
              className="hidden md:flex absolute -left-4 z-10 h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground hover:text-gold hover:border-gold transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => paginate(1)}
              className="hidden md:flex absolute -right-4 z-10 h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground hover:text-gold hover:border-gold transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={current.id + currentIndex}
                custom={direction}
                variants={swipeVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={handleSwipe}
                className="w-full max-w-xl mx-auto cursor-grab active:cursor-grabbing"
              >
                <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 md:p-8 shadow-xl">
                  {/* Category & difficulty */}
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className={`rounded-full border px-3 py-0.5 font-body text-[10px] uppercase tracking-[0.15em] ${
                        categoryColors[current.category] || "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {current.category}
                    </span>
                    <span className="font-body text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                      {difficultyLabel[current.difficulty] || current.difficulty}
                    </span>
                  </div>

                  {/* Question */}
                  <h2 className="font-display text-lg md:text-xl font-bold leading-snug mb-6">
                    {current.question}
                  </h2>

                  {/* Options */}
                  <div className="space-y-3 mb-6">
                    {current.options.map((opt, i) => {
                      const isCorrect = opt === current.correct_answer;
                      const isSelected = opt === selectedAnswer;
                      let optClass =
                        "rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-left font-body text-sm transition-all hover:border-gold/50 hover:bg-gold/5";

                      if (selectedAnswer) {
                        if (isCorrect) {
                          optClass =
                            "rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-left font-body text-sm text-emerald-300";
                        } else if (isSelected && !isCorrect) {
                          optClass =
                            "rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-left font-body text-sm text-red-300";
                        } else {
                          optClass =
                            "rounded-xl border border-border/30 bg-background/30 px-4 py-3 text-left font-body text-sm text-muted-foreground/50";
                        }
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handleAnswer(opt)}
                          disabled={!!selectedAnswer}
                          className={`w-full flex items-center gap-3 ${optClass}`}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-bold">
                            {selectedAnswer ? (
                              isCorrect ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : isSelected ? (
                                <X className="h-3.5 w-3.5" />
                              ) : (
                                String.fromCharCode(65 + i)
                              )
                            ) : (
                              String.fromCharCode(65 + i)
                            )}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 mb-4">
                          <p className="font-body text-sm text-foreground/90 leading-relaxed">
                            {current.explanation}
                          </p>
                          {current.fun_fact && (
                            <p className="mt-3 font-body text-xs text-gold/80 italic flex items-start gap-2">
                              <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              {current.fun_fact}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => paginate(1)}
                          className="w-full rounded-xl bg-gold/20 border border-gold/30 py-2.5 font-body text-xs font-semibold uppercase tracking-[0.15em] text-gold hover:bg-gold/30 transition-colors"
                        >
                          Next Question →
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Progress dots */}
        {filtered.length > 1 && filtered.length <= 20 && (
          <div className="flex justify-center gap-1.5 mt-6">
            {filtered.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > currentIndex ? 1 : -1);
                  setCurrentIndex(i);
                  setSelectedAnswer(null);
                  setShowExplanation(false);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex ? "w-6 bg-gold" : answered.has(i) ? "w-1.5 bg-gold/40" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
        )}

        {/* Swipe hint mobile */}
        <p className="text-center mt-6 font-body text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 md:hidden">
          Swipe to navigate
        </p>
      </div>
    </div>
  );
};

export default Trivia;

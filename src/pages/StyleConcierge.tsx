import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Copy, Lightbulb, Loader2, RotateCcw, Scissors, Sparkles, Wand2, X } from "lucide-react";
import { api } from "@/integrations/api/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageMasthead from "@/components/editorial/PageMasthead";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Look {
  title: string;
  mood: string;
  pieces: { item: string; why: string }[];
  palette: { name: string; hex: string }[];
  beauty: string;
  accessories: string;
  makers_note: string;
  pro_tip: string;
  avoid: string;
}

interface LookResponse {
  look: Look;
  related: {
    stories: { id: string; headline: string; category: string; featured_image_url: string | null }[];
    products: { id: string; name: string; price: number; images: string[] | null }[];
  };
  remaining: number;
  allowance: number;
  tier: "guest" | "collective" | "insider";
}

interface Status {
  tier: "guest" | "collective" | "insider";
  allowance: number;
  remaining: number;
  available: boolean;
}

const OCCASIONS = [
  "Owambe wedding guest",
  "First date, rooftop bar",
  "Job interview at a creative agency",
  "Gallery opening on a Friday",
  "Detty December beach party",
  "Graduation day",
  "Sunday service, then brunch",
  "Afrobeats concert",
];

const BUDGETS = ["Thrift & tailor", "Mid-range", "Splurge"];
const VIBES = ["Classic", "Bold", "Minimal", "Romantic", "Street"];

const THINKING = [
  "Reading the dress code…",
  "Pulling fabrics from the rail…",
  "Checking the colour story…",
  "Calling our favourite tailor…",
  "Adding the finishing touch…",
];

const Chip = ({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3.5 py-1.5 font-body text-xs transition-colors ${
      active ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground/80 hover:border-foreground/40"
    }`}
  >
    {children}
  </button>
);

const lookAsText = (look: Look, occasion: string) =>
  [
    `${look.title} — for ${occasion}`,
    look.mood,
    "",
    ...look.pieces.map((p, i) => `${i + 1}. ${p.item} — ${p.why}`),
    "",
    `Beauty: ${look.beauty}`,
    `Accessories: ${look.accessories}`,
    `Pro tip: ${look.pro_tip}`,
    "",
    "Styled by the AfriVogue Style Concierge · afrivogue.com/concierge",
  ].join("\n");

const StyleConcierge = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [occasion, setOccasion] = useState("");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");
  const [vibe, setVibe] = useState("");
  const [notes, setNotes] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(0);
  const [result, setResult] = useState<LookResponse | null>(null);
  const [askedFor, setAskedFor] = useState("");
  const [limitMessage, setLimitMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: status } = useQuery({
    queryKey: ["concierge-status", user?.id ?? "guest"],
    queryFn: async () => {
      const { data } = await api.functions.invoke<Status>("style-concierge-status");
      return data;
    },
  });

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setThinking((n) => (n + 1) % THINKING.length), 1800);
    return () => clearInterval(t);
  }, [loading]);

  const remaining = result?.remaining ?? status?.remaining;
  const outOfLooks = remaining === 0;

  const ask = async (previous?: string) => {
    const text = occasion.trim();
    if (text.length < 3) {
      toast({ title: "Tell us where you're going first" });
      return;
    }
    setLoading(true);
    setThinking(0);
    setLimitMessage("");
    const { data, error } = await api.functions.invoke<LookResponse>("style-concierge", {
      body: { occasion: text, details: { city, budget, vibe, notes }, previous },
    });
    setLoading(false);
    if (error) {
      if (error.status === 429) setLimitMessage(error.message);
      else toast({ title: "The Concierge stepped out", description: error.message, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["concierge-status"] });
      return;
    }
    setResult(data);
    setAskedFor(text);
    queryClient.setQueryData(["concierge-status", user?.id ?? "guest"], (s: Status | undefined) => (s ? { ...s, remaining: data!.remaining } : s));
    setTimeout(() => document.getElementById("look")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const copyLook = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(lookAsText(result.look, askedFor));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy", description: "Your browser blocked the clipboard." });
    }
  };

  const tierLine =
    status?.tier === "insider"
      ? "Insider: looks on tap."
      : status?.tier === "collective"
        ? "Collective member."
        : "Guest.";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <PageMasthead
        eyebrow="New · Style Concierge"
        title="What are you"
        accent="dressing for?"
        intro="Tell us the occasion. Our stylist builds the whole look, from fabric to finishing touch, with a love for African and diaspora design and an eye on your budget."
      />

      <main className="mx-auto max-w-[1100px] px-4 pb-24 md:px-8">
        {/* Ask */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft md:p-8">
          <label htmlFor="occasion" className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            The occasion
          </label>
          <textarea
            id="occasion"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value.slice(0, 300))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask();
              }
            }}
            rows={2}
            placeholder="My cousin's traditional wedding in Ibadan, outdoors, in April…"
            className="mt-3 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 font-display text-xl italic leading-snug text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring md:text-2xl"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <Chip key={o} active={occasion === o} onClick={() => setOccasion(o)}>
                {o}
              </Chip>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="mt-6 font-body text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            {showDetails ? "Hide details" : "+ Add details (city, budget, vibe)"}
          </button>
          <AnimatePresence initial={false}>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid gap-5 pt-5 md:grid-cols-2">
                  <div>
                    <p className="mb-2 font-body text-xs uppercase tracking-[0.18em] text-muted-foreground">City</p>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value.slice(0, 60))}
                      placeholder="Lagos, London, Atlanta…"
                      className="w-full rounded-full border border-border bg-background px-4 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <p className="mb-2 font-body text-xs uppercase tracking-[0.18em] text-muted-foreground">Budget</p>
                    <div className="flex flex-wrap gap-2">
                      {BUDGETS.map((b) => (
                        <Chip key={b} active={budget === b} onClick={() => setBudget(budget === b ? "" : b)}>
                          {b}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 font-body text-xs uppercase tracking-[0.18em] text-muted-foreground">Vibe</p>
                    <div className="flex flex-wrap gap-2">
                      {VIBES.map((v) => (
                        <Chip key={v} active={vibe === v} onClick={() => setVibe(vibe === v ? "" : v)}>
                          {v}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 font-body text-xs uppercase tracking-[0.18em] text-muted-foreground">Anything else?</p>
                    <input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value.slice(0, 300))}
                      placeholder="I hate heels. I already own a green gele…"
                      className="w-full rounded-full border border-border bg-background px-4 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-body text-xs text-muted-foreground">
              {status && status.available
                ? `${tierLine} ${remaining ?? status.remaining} of ${status.allowance} looks left today.`
                : status && !status.available
                  ? "The Concierge is getting ready. Check back soon."
                  : " "}
            </p>
            <Button
              size="lg"
              onClick={() => ask()}
              disabled={loading || outOfLooks || status?.available === false}
              className="rounded-full bg-foreground px-7 text-background hover:bg-foreground/90"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              {loading ? "Styling…" : "Style me"}
            </Button>
          </div>
        </section>

        {/* Limit reached */}
        {(limitMessage || (outOfLooks && !result)) && (
          <section className="mt-8 rounded-3xl bg-sunset p-6 text-white md:p-8">
            <p className="font-display text-2xl italic">You've used today's looks.</p>
            <p className="mt-2 max-w-xl font-body text-sm text-white/85">
              {limitMessage ||
                (status?.tier === "guest"
                  ? "Join the Collective free to unlock more looks every day."
                  : "Become an Insider for a look whenever you need one.")}
            </p>
            <Button asChild className="mt-5 rounded-full bg-white text-black hover:bg-white/90">
              <Link to={status?.tier === "guest" ? "/auth?mode=signup" : "/membership"}>
                {status?.tier === "guest" ? "Join free" : "See Insider"} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </section>
        )}

        {/* Thinking */}
        {loading && (
          <section className="mt-8 flex items-center gap-4 rounded-3xl border border-border bg-card p-6">
            <Sparkles className="h-6 w-6 animate-pulse text-gold" />
            <AnimatePresence mode="wait">
              <motion.p
                key={thinking}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="font-display text-xl italic text-foreground"
              >
                {THINKING[thinking]}
              </motion.p>
            </AnimatePresence>
          </section>
        )}

        {/* The look */}
        {result && !loading && (
          <motion.section id="look" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-10 scroll-mt-24">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              <div className="flex h-3">
                {result.look.palette.map((p) => (
                  <div key={p.hex} className="flex-1" style={{ background: p.hex }} />
                ))}
              </div>
              <div className="p-6 md:p-10">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-gold">For {askedFor}</p>
                <h2 className="mt-3 font-display text-4xl italic leading-tight md:text-5xl">{result.look.title}</h2>
                <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-muted-foreground md:text-lg">{result.look.mood}</p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {result.look.palette.map((p) => (
                    <div key={p.hex} className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
                      <span className="h-6 w-6 rounded-full border border-black/10" style={{ background: p.hex }} />
                      <span className="font-body text-xs text-foreground/80">{p.name}</span>
                    </div>
                  ))}
                </div>

                <ol className="mt-8 grid gap-4 md:grid-cols-2">
                  {result.look.pieces.map((p, i) => (
                    <li key={i} className="flex gap-4 rounded-2xl bg-muted/50 p-4">
                      <span className="font-display text-3xl italic leading-none text-gold">{i + 1}</span>
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">{p.item}</p>
                        <p className="mt-1 font-body text-sm leading-relaxed text-muted-foreground">{p.why}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {[
                    { label: "Beauty", text: result.look.beauty },
                    { label: "Accessories", text: result.look.accessories },
                  ].map((b) => (
                    <div key={b.label} className="rounded-2xl border border-border p-5">
                      <p className="font-display text-lg italic">{b.label}</p>
                      <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">{b.text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-gold/10 p-5">
                    <p className="flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                      <Lightbulb className="h-4 w-4" /> Pro tip
                    </p>
                    <p className="mt-2 font-body text-sm leading-relaxed text-foreground">{result.look.pro_tip}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-5">
                    <p className="flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <Scissors className="h-4 w-4" /> Support a maker
                    </p>
                    <p className="mt-2 font-body text-sm leading-relaxed text-foreground">{result.look.makers_note}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-5">
                    <p className="flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <X className="h-4 w-4" /> Skip this
                    </p>
                    <p className="mt-2 font-body text-sm leading-relaxed text-foreground">{result.look.avoid}</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => ask(result.look.title)}
                    disabled={outOfLooks}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Try another take
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={copyLook}>
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copied ? "Copied" : "Copy the look"}
                  </Button>
                </div>
              </div>
            </div>

            {(result.related.stories.length > 0 || result.related.products.length > 0) && (
              <div className="mt-10">
                <h3 className="font-display text-2xl italic">Keep the inspiration going</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {result.related.stories.map((s) => (
                    <Link key={s.id} to={`/trend/${s.id}`} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift">
                      {s.featured_image_url && (
                        <img src={s.featured_image_url} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                      )}
                      <div className="p-4">
                        <p className="font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{s.category}</p>
                        <p className="mt-1 font-display text-lg italic leading-snug group-hover:underline">{s.headline}</p>
                      </div>
                    </Link>
                  ))}
                  {result.related.products.map((p) => (
                    <Link key={p.id} to={`/shop/${p.id}`} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift">
                      {p.images?.[0] && <img src={p.images[0]} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />}
                      <div className="p-4">
                        <p className="font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">From the shop</p>
                        <p className="mt-1 font-display text-lg italic leading-snug group-hover:underline">{p.name}</p>
                        <p className="mt-1 font-body text-sm text-foreground">${Number(p.price).toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!user && (
              <div className="mt-10 rounded-3xl border border-border bg-card p-6 text-center md:p-8">
                <p className="font-display text-2xl italic">Like what you see?</p>
                <p className="mx-auto mt-2 max-w-md font-body text-sm text-muted-foreground">
                  Join the Collective free for more looks every day, plus saved stories, moodboards and your AfriTrivia streak.
                </p>
                <Button asChild className="mt-5 rounded-full bg-foreground text-background hover:bg-foreground/90">
                  <Link to="/auth?mode=signup">Join free</Link>
                </Button>
              </div>
            )}
          </motion.section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StyleConcierge;

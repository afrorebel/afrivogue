import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { trends } from "@/lib/trendData";
import { useAuth } from "@/hooks/useAuth";
import Paywall from "@/components/Paywall";
import Footer from "@/components/Footer";
import RelatedContent from "@/components/RelatedContent";

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const dividerMotion = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 1.2, ease: "easeOut" as const } },
};

/* ── Editorial content for trend 9 — structured as 5 acts ── */
const editorialContent = {
  "9": {
    kicker: "Premium Editorial · February 2026",
    opening: {
      title: "The Invisible Loom",
      subtitle: "How African Textile Philosophy Is Quietly Rewriting Global Fashion's Soul",
      body: `There is a revolution underway that makes no noise. It does not announce itself on Instagram, nor does it arrive with the fanfare of a capsule collaboration. It moves through the hands of weavers in Kumasi, through the indigo vats of Kano, through the resist-dye studios of Lagos — and it is changing everything.\n\nThe West has long treated African textiles as raw material: something to be sampled, flattened into print, stripped of context. But a new generation of makers and thinkers is refusing that transaction. They are not offering their traditions for extraction. They are asserting them as complete intellectual systems — philosophies of material, colour, and meaning that stand on their own authority.`,
    },
    culturalAnalysis: {
      title: "Cloth as Language, Weave as Memory",
      body: `To understand what is happening, one must first unlearn the Western habit of seeing fabric as surface. In the Yoruba tradition, cloth is speech. The patterns of aso-oke encode lineage, occasion, and aspiration. In the Akan tradition, kente is not decoration — it is proverb made visible, each colour and arrangement carrying a specific philosophical statement.\n\nThis is textile as epistemology: a way of knowing the world through the act of making. And it is precisely this depth that the global fashion system is now absorbing — not as aesthetic reference, but as structural logic.\n\nWhen Thebe Magugu deconstructs South African heritage textiles into contemporary silhouettes, he is not quoting tradition. He is extending a conversation that has been underway for centuries. When Kenneth Ize brings aso-oke to the Paris schedule, the cloth itself carries more intellectual weight than most Western collections manage in an entire season.`,
      pullQuote: "This is textile as epistemology — a way of knowing the world through the act of making.",
    },
    globalImplications: {
      title: "The Power Geometry Shifts",
      body: `The implications ripple outward from fashion into the architecture of global luxury itself. For decades, the flow of influence has been unidirectional: the West designs, the world follows. African textiles were permitted entry only as inspiration — safely contained, credited vaguely if at all.\n\nThat geometry is fracturing. When a Parisian atelier studies the mathematics of adire resist-dyeing to reimagine its approach to surface design, when a Milanese house restructures its supply chain to partner directly with Ghanaian weavers rather than merely photographing their work, the centre of gravity moves.\n\nThis is not diversity as performance. This is capability transfer — the recognition that African making traditions possess technical and philosophical sophistication that the Western system needs, not as charity, but as necessity.\n\nThe commercial evidence is already legible. The global market for authentic African textiles has grown by forty percent in the last three years. Direct-to-consumer platforms built by African designers are outperforming the wholesale channels that once excluded them. The infrastructure is being built — not borrowed, not rented, but owned.`,
    },
    foresight: {
      title: "What the Loom Knows That the Algorithm Does Not",
      body: `The most consequential insight may be the simplest: that slow making produces deeper meaning. In an industry addicted to speed — to algorithmic trend prediction, to weekly drops, to content-as-commerce — the African textile tradition offers a radical counter-proposal.\n\nA single piece of hand-woven kente can take weeks to complete. A master adire artist may spend days preparing a single indigo vat. This is not inefficiency. This is a different relationship with time, one that produces objects capable of carrying cultural weight across generations.\n\nAs sustainability becomes the defining challenge of global fashion, these traditions — rooted in natural dyes, zero-waste construction, and community-based production — offer not just alternatives but blueprints. The future that the industry is desperately seeking already exists, woven into cloth that has been made this way for centuries.\n\nThe question is no longer whether African textile philosophy will influence global fashion. It is whether the global system will have the humility to learn from it properly — or whether it will repeat the extractive patterns of the past, taking the aesthetics while ignoring the ethics.`,
      pullQuote: "The future that the industry is desperately seeking already exists, woven into cloth that has been made this way for centuries.",
    },
    closing: {
      title: "The Thread That Connects Everything",
      body: `Stand in a weaving cooperative in Bonwire, Ghana, and watch a young apprentice learning the patterns her grandmother taught her mother. Listen to the rhythm of the loom — steady, unhurried, certain. In that sound is a confidence that no fashion week can manufacture and no trend report can predict.\n\nThis is the invisible loom: the quiet, persistent, unbreakable thread connecting ancestral knowledge to tomorrow's design language. It does not seek validation. It does not require a platform. It simply continues — as it always has — making beauty that means something.\n\nThe world is finally learning to listen to what the cloth has been saying all along.`,
    },
  },
};

const PremiumEditorial = () => {
  const { id } = useParams<{ id: string }>();
  const { subscribed, isAdmin } = useAuth();
  const trend = trends.find((t) => t.id === id);
  const content = editorialContent[id as keyof typeof editorialContent];

  if (!trend || !content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="font-display text-3xl font-bold text-foreground">Editorial Not Found</h1>
          <p className="mt-3 font-body text-muted-foreground">This piece may not yet be available.</p>
          <Link to="/" className="mt-6 inline-block font-body text-sm text-gold hover:text-terracotta">
            ← Return to Afrivogue Feed
          </Link>
        </div>
      </div>
    );
  }
  // Gate premium editorial content behind paywall
  if (!subscribed && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-16">
          <Link to="/" className="font-display text-lg font-bold text-foreground">
            AFRI<span className="text-gold">VOGUE</span>
          </Link>
          <Link to={`/trend/${id}`} className="font-body text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-gold">
            ← Back to Brief
          </Link>
        </nav>
        <div className="mx-auto max-w-3xl px-6 pt-8 pb-20 md:px-12">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">{content.opening.title}</h1>
          <Paywall previewContent={content.opening.body} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient top glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,hsl(var(--gold)/0.04)_0%,transparent_60%)]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-16">
        <Link to="/" className="font-display text-lg font-bold text-foreground">
          AFRI<span className="text-gold">VOGUE</span>
        </Link>
        <Link
          to={`/trend/${id}`}
          className="font-body text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-gold"
        >
          ← Back to Brief
        </Link>
      </nav>

      {/* Kicker */}
      <motion.div
        className="relative z-10 px-6 pt-8 text-center md:px-16"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        custom={0}
      >
        <span className="inline-block rounded-sm border border-gold/30 px-4 py-1.5 font-body text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
          {content.kicker}
        </span>
      </motion.div>

      {/* ── Act I: Editorial Opening ── */}
      <motion.header
        className="relative z-10 mx-auto max-w-3xl px-6 pb-16 pt-12 md:px-12"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        custom={1}
      >
        <h1 className="font-display text-4xl font-bold leading-[1.1] text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          {content.opening.title}
        </h1>
        <p className="mt-4 font-display text-lg italic leading-relaxed text-gold/80 sm:text-xl md:text-2xl">
          {content.opening.subtitle}
        </p>
        <motion.div
          className="mx-auto mt-10 h-px w-24 origin-left bg-gold/40"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={dividerMotion}
        />
        <div className="mt-10 space-y-6">
          {content.opening.body.split("\n\n").map((p, i) => (
            <p key={i} className="font-body text-base leading-[1.9] text-muted-foreground sm:text-lg">
              {p}
            </p>
          ))}
        </div>
      </motion.header>

      {/* ── Act II: Cultural Analysis ── */}
      <motion.section
        className="relative z-10 border-t border-border"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionVariants}
        custom={0}
      >
        <div className="mx-auto max-w-3xl px-6 py-16 md:px-12">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-gold">
            II · Cultural Analysis
          </h2>
          <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">
            {content.culturalAnalysis.title}
          </h3>
          <div className="mt-8 space-y-6">
            {content.culturalAnalysis.body.split("\n\n").map((p, i) => (
              <p key={i} className="font-body text-base leading-[1.9] text-muted-foreground sm:text-lg">
                {p}
              </p>
            ))}
          </div>
          {/* Pull quote */}
          <motion.blockquote
            className="relative my-12 border-l-2 border-gold py-6 pl-8"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="absolute -left-4 -top-2 font-display text-6xl leading-none text-gold/20">"</span>
            <p className="font-display text-xl italic leading-relaxed text-foreground/85 sm:text-2xl">
              {content.culturalAnalysis.pullQuote}
            </p>
          </motion.blockquote>
        </div>
      </motion.section>

      {/* ── Act III: Global Implications ── */}
      <motion.section
        className="relative z-10 border-t border-border bg-card/50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionVariants}
        custom={0}
      >
        <div className="mx-auto max-w-3xl px-6 py-16 md:px-12">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-gold">
            III · Global Implications
          </h2>
          <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">
            {content.globalImplications.title}
          </h3>
          <div className="mt-8 space-y-6">
            {content.globalImplications.body.split("\n\n").map((p, i) => (
              <p key={i} className="font-body text-base leading-[1.9] text-muted-foreground sm:text-lg">
                {p}
              </p>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Act IV: Forward-Looking Insight ── */}
      <motion.section
        className="relative z-10 border-t border-border"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionVariants}
        custom={0}
      >
        <div className="mx-auto max-w-3xl px-6 py-16 md:px-12">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-gold">
            IV · Foresight
          </h2>
          <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">
            {content.foresight.title}
          </h3>
          <div className="mt-8 space-y-6">
            {content.foresight.body.split("\n\n").map((p, i) => (
              <p key={i} className="font-body text-base leading-[1.9] text-muted-foreground sm:text-lg">
                {p}
              </p>
            ))}
          </div>
          <motion.blockquote
            className="relative my-12 border-l-2 border-gold py-6 pl-8"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="absolute -left-4 -top-2 font-display text-6xl leading-none text-gold/20">"</span>
            <p className="font-display text-xl italic leading-relaxed text-foreground/85 sm:text-2xl">
              {content.foresight.pullQuote}
            </p>
          </motion.blockquote>
        </div>
      </motion.section>

      {/* ── Act V: Closing Reflection ── */}
      <motion.section
        className="relative z-10 border-t border-border"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={sectionVariants}
        custom={0}
      >
        <div className="mx-auto max-w-3xl px-6 py-16 md:px-12">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-gold">
            V · Reflection
          </h2>
          <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">
            {content.closing.title}
          </h3>
          <div className="mt-8 space-y-6">
            {content.closing.body.split("\n\n").map((p, i) => (
              <p key={i} className="font-body text-base leading-[1.9] text-muted-foreground sm:text-lg">
                {p}
              </p>
            ))}
          </div>
        </div>
      </motion.section>

      {/* End mark */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6 px-6 pb-20 pt-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <div className="h-px w-16 bg-gold/40" />
        <span className="font-display text-2xl text-gold/30">◆</span>
        <Link
          to={`/story/${id}`}
          className="rounded-sm border border-gold/30 px-6 py-2.5 font-body text-xs font-medium uppercase tracking-[0.2em] text-gold transition-all hover:border-gold hover:bg-gold hover:text-primary-foreground"
        >
          Experience in Story Mode
        </Link>
      </motion.div>

      {trend && (
        <RelatedContent
          currentId={trend.id}
          category={trend.category}
          geoRelevance={trend.geoRelevance}
        />
      )}

      <Footer />
    </div>
  );
};

export default PremiumEditorial;

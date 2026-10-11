import PageMasthead from "@/components/editorial/PageMasthead";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Globe, Users, Sparkles, Target } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionHeader from "@/components/editorial/SectionHeader";
import Wordmark from "@/components/brand/Wordmark";
import MembershipCTA from "@/components/editorial/MembershipCTA";

const values = [
  {
    icon: Globe,
    title: "Global Perspective",
    description:
      "From Lagos to Los Angeles, Accra to Atlanta, London to the Caribbean — we cover fashion, entertainment, and culture across the African continent, the diaspora, and the world.",
  },
  {
    icon: Users,
    title: "Community First",
    description:
      "Afrivogue is for everyone who loves culture, style, and innovation. We centre Black voices and African narratives while welcoming every reader who wants to be part of the conversation.",
  },
  {
    icon: Sparkles,
    title: "Cultural Intelligence",
    description:
      "We decode the forces driving what's next — from Hollywood red carpets and Afrobeats to emerging designers, celebrity culture, and the movements shaping global style.",
  },
  {
    icon: Target,
    title: "Editorial Integrity",
    description:
      "Our content is deeply researched, thoughtfully curated, and always rooted in authenticity — covering celebrity moments through cultural significance, never gossip.",
  },
];

/** Accent colour per value card, drawn from the category palette. */
const VALUE_TONES = ["--cat-art", "--cat-culture", "--cat-fashion", "--cat-luxury"];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Masthead */}
      <PageMasthead
        eyebrow="Who We Are"
        title={<>About <Wordmark /></>}
        intro="A global fashion, culture, entertainment and lifestyle platform — through an African lens, from the continent to the diaspora."
      />


      <main className="px-4 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          {/* Mission */}
          <motion.section
            {...fade(0.15)}
            className="grid grid-cols-1 gap-8 overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-soft md:grid-cols-12 md:p-12"
          >
            <div className="md:col-span-5">
              <p className="mb-4 inline-flex rounded-full bg-gold/15 px-3.5 py-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                Our mission
              </p>
              <h2 className="font-display text-4xl italic leading-[1.02] text-foreground md:text-5xl">
                Redefining the <span className="text-gold">narrative</span>
              </h2>
            </div>
            <div className="space-y-5 md:col-span-7">
              <p className="font-body text-base leading-relaxed text-muted-foreground md:text-lg">
                We believe African and Black creativity is one of the most powerful forces in global culture today.
                From Lagos to London, Accra to Atlanta, Nairobi to New York, Kingston to Paris — the continent and its
                diaspora are shaping fashion runways, Hollywood, music charts, beauty standards, and the cultural
                zeitgeist. Afrivogue exists to document, celebrate, and forecast these movements with the editorial
                depth they deserve.
              </p>
              <p className="font-body text-base leading-relaxed text-muted-foreground md:text-lg">
                Our platform combines real-time trend intelligence with entertainment coverage, cultural forecasting,
                and community-driven curation. Whether you're a brand strategist, creative director, celebrity watcher,
                or culture enthusiast — regardless of where you are or where you're from — Afrivogue is your home.
              </p>
            </div>
          </motion.section>

          {/* Values */}
          <section className="mt-16 md:mt-24">
            <SectionHeader eyebrow="What drives us" title="Our Values" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((v, i) => {
                const tone = VALUE_TONES[i % VALUE_TONES.length];
                return (
                  <motion.div
                    key={v.title}
                    {...fade(0.25 + i * 0.08)}
                    className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
                  >
                    <span
                      className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `hsl(var(${tone}) / 0.15)`, color: `hsl(var(${tone}))` }}
                    >
                      <v.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mb-3 font-display text-2xl italic leading-tight text-foreground">{v.title}</h3>
                    <p className="font-body text-sm leading-relaxed text-muted-foreground">{v.description}</p>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <Link
                to="/trends"
                className="rounded-full bg-gold px-6 py-3 font-body text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                Browse the feed
              </Link>
              <Link
                to="/contact"
                className="rounded-full border border-border bg-card px-6 py-3 font-body text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold"
              >
                Get in touch
              </Link>
            </div>
          </section>
        </div>

        <MembershipCTA />
      </main>

      <Footer />
    </div>
  );
};

export default About;

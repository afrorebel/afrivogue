import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Globe, Users, Sparkles, Target, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";

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

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative flex items-center justify-center px-6 pb-16 pt-32 md:px-16 lg:px-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <motion.div {...fade()} className="relative z-10 text-center">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-primary">Who We Are</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            About <span className="text-primary">Afrivogue</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground md:text-base">
            Afrivogue is a global fashion, culture, entertainment, and lifestyle platform — through an African lens. From the continent to the diaspora, from Hollywood to the Caribbean, we celebrate the creativity and influence that shapes the world.
          </p>
        </motion.div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-4xl px-6 pb-20 md:px-16 lg:px-24">
        <motion.div {...fade(0.15)} className="rounded-lg border border-border bg-card p-8 md:p-12">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-primary">Our Mission</p>
          <h2 className="mt-3 font-display text-2xl font-bold md:text-3xl">
            Redefining the narrative
          </h2>
          <p className="mt-4 font-body text-sm leading-relaxed text-muted-foreground md:text-base">
            We believe African creativity is one of the most powerful forces in global culture today.
            From Lagos to London, Accra to Atlanta, Nairobi to New York — the Diaspora is shaping
            fashion runways, music charts, beauty standards, and the cultural zeitgeist. Afrivogue
            exists to document, celebrate, and forecast these movements with the editorial depth they
            deserve.
          </p>
          <p className="mt-4 font-body text-sm leading-relaxed text-muted-foreground md:text-base">
            Our platform combines real-time trend intelligence with longform storytelling, cultural
            forecasting, and community-driven curation. Whether you're a brand strategist, creative
            director, or culture enthusiast — Afrivogue is your window into what's next.
          </p>
        </motion.div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-5xl px-6 pb-24 md:px-16 lg:px-24">
        <motion.div {...fade(0.2)} className="text-center">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-primary">What Drives Us</p>
          <h2 className="mt-3 font-display text-2xl font-bold md:text-3xl">Our Values</h2>
        </motion.div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              {...fade(0.25 + i * 0.08)}
              className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <v.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-display text-base font-semibold">{v.title}</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">
                {v.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card/50 px-6 py-16 text-center md:px-16">
        <motion.div {...fade(0.1)}>
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            Ready to explore the feed?
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-sm text-muted-foreground">
            Dive into the latest trends, cultural forecasts, and editorial deep-dives curated by our
            team.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-body text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Browse Trends <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 font-body text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Get in Touch
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 px-6 py-10 text-center">
        <p className="font-display text-lg font-bold tracking-tight">
          AFRI<span className="text-primary">VOGUE</span>
        </p>
        <p className="mt-1 font-body text-xs text-muted-foreground">
          © {new Date().getFullYear()} Afrivogue. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default About;

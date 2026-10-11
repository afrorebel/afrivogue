import PageMasthead from "@/components/editorial/PageMasthead";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Globe, Users, Sparkles, Target } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionRule from "@/components/editorial/SectionRule";
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
        title="About"
        accent="Afrivogue"
        intro="A global fashion, culture, entertainment and lifestyle platform — through an African lens, from the continent to the diaspora."
      />


      <main className="px-6 md:px-12 lg:px-16">
        <div className="mx-auto max-w-7xl">
          {/* Mission */}
          <motion.section {...fade(0.15)} className="grid grid-cols-1 gap-8 py-16 md:grid-cols-12 md:py-24">
            <div className="md:col-span-5">
              <p className="mb-5 font-body text-[9px] uppercase tracking-[0.4em] text-gold">Our Mission</p>
              <h2 className="font-display text-4xl italic leading-[0.95] text-foreground md:text-5xl">
                Redefining the <span className="text-gold">narrative</span>
              </h2>
            </div>
            <div className="space-y-6 md:col-span-7 md:border-l md:border-border/60 md:pl-12">
              <p className="font-body text-sm font-light leading-relaxed text-muted-foreground md:text-base">
                We believe African and Black creativity is one of the most powerful forces in global culture today.
                From Lagos to London, Accra to Atlanta, Nairobi to New York, Kingston to Paris — the continent and its
                diaspora are shaping fashion runways, Hollywood, music charts, beauty standards, and the cultural
                zeitgeist. Afrivogue exists to document, celebrate, and forecast these movements with the editorial
                depth they deserve.
              </p>
              <p className="font-body text-sm font-light leading-relaxed text-muted-foreground md:text-base">
                Our platform combines real-time trend intelligence with entertainment coverage, cultural forecasting,
                and community-driven curation. Whether you're a brand strategist, creative director, celebrity watcher,
                or culture enthusiast — regardless of where you are or where you're from — Afrivogue is your home.
              </p>
            </div>
          </motion.section>

          {/* Values */}
          <section className="pb-8">
            <SectionRule label="What Drives Us" className="mb-16" />
            <div className="grid grid-cols-1 gap-x-12 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((v, i) => (
                <motion.div key={v.title} {...fade(0.25 + i * 0.08)} className="border-t border-gold/30 pt-6">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="font-body text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <v.icon className="h-4 w-4 text-gold" />
                  </div>
                  <h3 className="mb-4 font-display text-2xl italic leading-tight text-foreground">{v.title}</h3>
                  <div className="mb-4 h-px w-8 bg-gold" />
                  <p className="font-body text-xs font-light leading-relaxed text-muted-foreground">{v.description}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-20 flex flex-wrap justify-center gap-10">
              <Link
                to="/trends"
                className="border-b border-border pb-1 font-body text-[10px] uppercase tracking-[0.4em] text-foreground transition-colors hover:border-gold hover:text-gold"
              >
                Browse the Feed
              </Link>
              <Link
                to="/contact"
                className="border-b border-border pb-1 font-body text-[10px] uppercase tracking-[0.4em] text-foreground transition-colors hover:border-gold hover:text-gold"
              >
                Get in Touch
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

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Compass, Crown, Globe, HandHeart, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageMasthead from "@/components/editorial/PageMasthead";
import SectionHeader from "@/components/editorial/SectionHeader";
import Wordmark from "@/components/brand/Wordmark";

const values = [
  {
    icon: Globe,
    tone: "--cat-art",
    title: "Rooted, then global",
    description:
      "We start in Lagos, Accra, Nairobi, Johannesburg, Kingston and Harlem, then follow the thread to Paris, Milan and the red carpet. Wherever African style travels, we get there first.",
  },
  {
    icon: HandHeart,
    tone: "--cat-culture",
    title: "Credit where it's due",
    description:
      "Every story names the makers. Designers, artisans, stylists and photographers get their names, their context and their flowers. The culture is not a mood board for someone else's brand.",
  },
  {
    icon: Compass,
    tone: "--cat-fashion",
    title: "Foresight over hype",
    description:
      "We read the signals early. Our forecasts help creatives, brands and the endlessly curious see what's coming before it becomes a trend everyone else is chasing.",
  },
  {
    icon: Users,
    tone: "--cat-luxury",
    title: "Belonging, not followers",
    description:
      "You are not an audience here. Members write, curate, vote and shape what we cover next. This magazine gets better every time one of you joins it.",
  },
];

const memberBenefits = [
  "Every premium editorial, the long reads that go deeper than any feed ever will",
  "Early access to our cultural forecasts, so you see the next wave first",
  "Publish with us: pitch your story and get paid for approved pieces",
  "Points for reading, sharing and contributing, redeemable across AfriVogue",
  "Insider-only pieces and first access to drops in the shop",
  "A real say in what we cover, plus member-only conversations",
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay },
});

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <PageMasthead
        eyebrow="Our story"
        title={<>About <Wordmark /></>}
        intro="We grew up watching the world borrow our prints, our music and our swagger, then sell it back to us without our name on it. AfriVogue exists so the credit, the conversation and the next chapter stay with the people who started it."
      />

      <main className="px-4 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          {/* Why we exist */}
          <motion.section
            {...fade(0.1)}
            className="grid grid-cols-1 gap-8 overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-soft md:grid-cols-12 md:p-12"
          >
            <div className="md:col-span-5">
              <p className="mb-4 inline-flex rounded-full bg-gold/15 px-3.5 py-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                Why we exist
              </p>
              <h2 className="font-display text-4xl italic leading-[1.02] text-foreground md:text-5xl">
                The culture was <span className="text-gold">always ours.</span>
              </h2>
            </div>
            <div className="space-y-5 md:col-span-7">
              <p className="font-body text-base leading-relaxed text-muted-foreground md:text-lg">
                Long before "Afro-luxury" was a hashtag, our grandmothers were tying gele like architecture, and tailors
                in Lagos, Accra and Dakar were cutting silhouettes Paris would discover a decade later. The world has
                always taken notes. It has rarely given credit.
              </p>
              <p className="font-body text-base leading-relaxed text-muted-foreground md:text-lg">
                AfriVogue is where that changes. We document the designers, artists, musicians and everyday stylists
                shaping what the world wears next, from the continent to every corner of the diaspora, and we write
                about them with the depth, beauty and seriousness they have always deserved.
              </p>
              <p className="font-body text-base leading-relaxed text-foreground md:text-lg">
                No gossip. No gatekeeping. Just the stories behind the style, told by people who live the culture.
              </p>
            </div>
          </motion.section>

          {/* Values */}
          <section className="mt-16 md:mt-24">
            <SectionHeader eyebrow="What we stand for" title="Our Values" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((v, i) => (
                <motion.div
                  key={v.title}
                  {...fade(0.1 + i * 0.08)}
                  className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
                >
                  <span
                    className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `hsl(var(${v.tone}) / 0.15)`, color: `hsl(var(${v.tone}))` }}
                  >
                    <v.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mb-3 font-display text-2xl italic leading-tight text-foreground">{v.title}</h3>
                  <p className="font-body text-sm leading-relaxed text-muted-foreground">{v.description}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Promise */}
          <motion.figure {...fade(0.1)} className="mx-auto mt-16 max-w-4xl text-center md:mt-24">
            <blockquote className="font-display text-3xl italic leading-snug text-foreground md:text-5xl">
              "We are not here to chase trends. We are here to make sure the people who start them are{" "}
              <span className="text-gold">never forgotten.</span>"
            </blockquote>
            <figcaption className="mt-6 font-body text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              The AfriVogue editors
            </figcaption>
          </motion.figure>

          {/* Inside the Collective */}
          <motion.section
            {...fade(0.1)}
            className="mt-16 grid grid-cols-1 gap-10 overflow-hidden rounded-3xl border border-gold/25 bg-sunset p-6 shadow-soft md:mt-24 md:grid-cols-12 md:p-12"
          >
            <div className="md:col-span-5">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-gold/15 px-3.5 py-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                <Crown className="h-3.5 w-3.5" /> The Collective · Free to join
              </p>
              <h2 className="font-display text-4xl italic leading-[1.02] text-foreground md:text-5xl">
                Inside the <span className="text-gold">Collective</span>
              </h2>
              <p className="mt-5 font-body text-base leading-relaxed text-muted-foreground">
                Membership keeps AfriVogue independent, ad-light and fearless. It also brings you closer to the culture
                than any feed can: you read first, see further and help decide what we cover next.
              </p>
              <p className="mt-4 font-body text-base font-medium leading-relaxed text-foreground">
                Founding members join free while we build. When membership opens to the public, your place and your
                founding perks stay yours.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/membership"
                  className="group inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-body text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  Claim your founding spot
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/trends"
                  className="rounded-full border border-border bg-background/60 px-6 py-3 font-body text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold"
                >
                  Read the latest first
                </Link>
              </div>
            </div>
            <ul className="grid grid-cols-1 gap-3 self-center md:col-span-7 sm:grid-cols-2">
              {memberBenefits.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-3 rounded-2xl border border-border/50 bg-background/70 p-4 font-body text-sm leading-relaxed text-foreground backdrop-blur-sm"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </motion.section>

          {/* Contact nudge */}
          <section className="mx-auto max-w-2xl py-16 text-center md:py-24">
            <h2 className="font-display text-3xl italic text-foreground md:text-4xl">Have a story only you can tell?</h2>
            <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground">
              We are always looking for new voices: writers, stylists, photographers and people with a point of view.
              Pitch us, collaborate with us, or simply say hello.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/submit"
                className="rounded-full bg-foreground px-6 py-3 font-body text-sm font-semibold text-background transition-transform hover:scale-[1.02]"
              >
                Pitch a story
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
      </main>

      <Footer />
    </div>
  );
};

export default About;

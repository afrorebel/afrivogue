import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Crown } from "lucide-react";

/** Membership invitation panel used at the foot of public pages. */
const MembershipCTA = () => (
  <section className="mx-auto max-w-[1440px] py-16 md:py-24">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-3xl border border-gold/25 bg-sunset px-6 py-12 shadow-soft md:px-14 md:py-16"
    >
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-gold/15 px-3.5 py-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            <Crown className="h-3.5 w-3.5" /> Membership
          </p>
          <h2 className="font-display text-4xl italic leading-[1.02] text-foreground md:text-6xl">
            Join the <span className="text-gold">Collective</span>
          </h2>
        </div>
        <div className="md:col-span-5">
          <p className="mb-7 font-body text-base leading-relaxed text-muted-foreground">
            Read deeper, see what is coming first and get paid to tell the stories you know best. Founding members join free while we build.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/membership"
              className="group inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-body text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Claim your founding spot <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/about"
              className="rounded-full border border-border bg-background/50 px-6 py-3 font-body text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold"
            >
              Why join
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  </section>
);

export default MembershipCTA;
